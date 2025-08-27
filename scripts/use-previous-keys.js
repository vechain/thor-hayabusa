import { Address, HDKey } from "@vechain/sdk-core";
import * as fs from "fs";
import prompts from "prompts";

export const validateKeys = (keys, mnemonic) => {
  const hdKey = HDKey.fromMnemonic(mnemonic);
  for (let i = 0; i < keys.length; i++) {
    const child = hdKey.deriveChild(i);
    const addr = Address.ofPrivateKey(child.privateKey);
    if (addr.toString() !== keys[i].address) {
      throw new Error(`Mnemonic / key list mismatch. Key ${i} is not valid. Expected ${keys[i].address}, got ${addr.toString()}`);
    }
  }
}

export const loadPreviousKeys = async () => {
  const { outDir } = await prompts({
    type: "text",
    name: "outDir",
    message: "Enter the directory containing existing keys",
    initial: "./keys",
  });

  try {
    // Load all existing key files
    const genesisKeys = JSON.parse(fs.readFileSync(`${outDir}/genesis-keys.json`, 'utf8'));
    const genesisMnemonic = fs.readFileSync(`${outDir}/genesis-mnemonic.txt`, 'utf8').split(',');
    validateKeys(genesisKeys, genesisMnemonic);
    
    const faucetKeys = JSON.parse(fs.readFileSync(`${outDir}/faucet-keys.json`, 'utf8'));
    const faucetMnemonic = fs.readFileSync(`${outDir}/faucet-mnemonic.txt`, 'utf8').split(',');
    validateKeys(faucetKeys, faucetMnemonic);

    const rotatingValidatorsKeys = JSON.parse(fs.readFileSync(`${outDir}/rotating-validators-keys.json`, 'utf8'));
    const rotatingValidatorsMnemonic = fs.readFileSync(`${outDir}/rotating-validators-mnemonic.txt`, 'utf8').split(',');
    validateKeys(rotatingValidatorsKeys, rotatingValidatorsMnemonic);

    // Get amounts for recreating accounts with proper balances
    const { amount } = await prompts({
      type: "number",
      name: "amount",
      message: "Enter the amount (Millions) of VET and VTHO to allocate to the genesis accounts",
      initial: 600,
    });

    const { faucetAmount } = await prompts({
      type: "number",
      name: "faucetAmount",
      message: "Enter the amount (Millions) of VET and VTHO to allocate to the faucet accounts",
      initial: 100_000_000,
    });

    const { rotatingValidatorsAmount } = await prompts({
      type: "number",
      name: "rotatingValidatorsAmount",
      message: "Enter the amount (Millions) of VET and VTHO to allocate to each rotating validator",
      initial: 50,
      min: 1,
      max: 100,
    });

    const balance = BigInt(amount) * BigInt(1e6) * BigInt(1e18);
    const faucetBalance = BigInt(faucetAmount) * BigInt(1e6) * BigInt(1e18);
    const rotatingValidatorsBalance = BigInt(rotatingValidatorsAmount) * BigInt(1e6) * BigInt(1e18);

    // Recreate accounts with current balance settings
    const genesisAccounts = [];

    // Add genesis accounts
    genesisKeys.forEach(keyInfo => {
      genesisAccounts.push({
        address: keyInfo.address,
        balance: `0x` + balance.toString(16),
        energy: `0x` + balance.toString(16),
      });
    });

    // Add faucet accounts
    faucetKeys.forEach(keyInfo => {
      genesisAccounts.push({
        address: keyInfo.address,
        balance: `0x` + faucetBalance.toString(16),
        energy: `0x` + faucetBalance.toString(16),
      });
    });

    // Add rotating validator accounts
    rotatingValidatorsKeys.forEach(keyInfo => {
      genesisAccounts.push({
        address: keyInfo.address,
        balance: `0x` + rotatingValidatorsBalance.toString(16),
        energy: `0x` + rotatingValidatorsBalance.toString(16),
      });
    });

    console.log(`Loaded existing keys:`);
    console.log(`- Genesis accounts: ${genesisKeys.length}`);
    console.log(`- Faucet accounts: ${faucetKeys.length}`);
    console.log(`- Rotating validators: ${rotatingValidatorsKeys.length}`);

    return {
      accounts: genesisAccounts,
      genesisKeys,
      faucetKeys,
      rotatingValidatorsKeys,
      mnemonics: {
        genesis: genesisMnemonic,
        faucet: faucetMnemonic,
        rotatingValidators: rotatingValidatorsMnemonic,
      },
    };
  } catch (error) {
    throw new Error(`Failed to load existing keys: ${error.message}. Make sure all key files exist in ${outDir}/`);
  }
};
