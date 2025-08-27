import * as sdk from "@vechain/sdk-core";
import prompts from "prompts";

export const generateNewKeys = async () => {
  const { amount } = await prompts({
    type: "number",
    name: "amount",
    message:
      "Enter the amount (Millions) of VET and VTHO to allocate to the genesis accounts",
    initial: 600,
  });

  const { faucetAmount } = await prompts({
    type: "number",
    name: "faucetAmount",
    message:
      "Enter the amount (Millions) of VET and VTHO to allocate to the faucet accounts",
    initial: 100_000_000,
  });

  const { rotatingValidatorsAmount } = await prompts({
    type: "number",
    name: "rotatingValidatorsAmount",
    message:
      "Enter the amount (Millions) of VET and VTHO to allocate to each rotating validator",
    initial: 50,
    min: 1,
    max: 100,
  });

  const balance = BigInt(amount) * BigInt(1e6) * BigInt(1e18);
  const faucetBalance = BigInt(faucetAmount) * BigInt(1e6) * BigInt(1e18);
  const rotatingValidatorsBalance =
    BigInt(rotatingValidatorsAmount) * BigInt(1e6) * BigInt(1e18);

  const { accountAmount } = await prompts({
    type: "number",
    name: "accountAmount",
    message: "Enter the number of genesis accounts",
    initial: 250,
    min: 1,
    max: 1000,
  });

  const { faucetAccountsAmount } = await prompts({
    type: "number",
    name: "faucetAccountsAmount",
    message: "Enter the number of faucet accounts",
    initial: 100,
    min: 1,
    max: 1000,
  });

  const { rotatingValidators } = await prompts({
    type: "number",
    name: "rotatingValidators",
    message: "Enter the number of rotating validators",
    initial: 2500,
    min: 1,
  });

  // Generate genesis account keys
  const genesisAccounts = [];
  const genesisKeys = [];
  const mnemonic = sdk.Mnemonic.of(12);
  const node = sdk.HDKey.fromMnemonic(mnemonic);

  for (let i = 0; i < accountAmount; i++) {
    const child = node.deriveChild(i);
    const key = child.privateKey;
    const keyHex = Buffer.of(...key).toString("hex");
    const address = sdk.Address.ofPrivateKey(key);
    
    genesisAccounts.push({
      address: address.toString(),
      balance: `0x` + balance.toString(16),
      energy: `0x` + balance.toString(16),
    });
    
    genesisKeys.push({
      address: address.toString(),
      key: keyHex,
    });
  }

  // Generate faucet account keys
  const faucetKeys = [];
  const faucetMnemonic = sdk.Mnemonic.of(12);
  const faucetHDKey = sdk.HDKey.fromMnemonic(faucetMnemonic);
  
  for (let i = 0; i < faucetAccountsAmount; i++) {
    const child = faucetHDKey.deriveChild(i);
    const key = child.privateKey;
    const keyHex = Buffer.of(...key).toString("hex");
    const address = sdk.Address.ofPrivateKey(key);
    
    genesisAccounts.push({
      address: address.toString(),
      balance: `0x` + faucetBalance.toString(16),
      energy: `0x` + faucetBalance.toString(16),
    });
    
    faucetKeys.push({
      address: address.toString(),
      key: keyHex,
    });
  }

  // Generate rotating validator keys
  const rotatingValidatorsKeys = [];
  const rotatingValidatorsMnemonic = sdk.Mnemonic.of(12);
  const rotatingValidatorsHDKey = sdk.HDKey.fromMnemonic(rotatingValidatorsMnemonic);
  
  for (let i = 0; i < rotatingValidators; i++) {
    const child = rotatingValidatorsHDKey.deriveChild(i);
    const key = child.privateKey;
    const keyHex = Buffer.of(...key).toString("hex");
    const address = sdk.Address.ofPrivateKey(key);
    
    rotatingValidatorsKeys.push({
      address: address.toString(),
      key: keyHex,
    });
    
    genesisAccounts.push({
      address: address.toString(),
      balance: `0x` + rotatingValidatorsBalance.toString(16),
      energy: `0x` + rotatingValidatorsBalance.toString(16),
    });
  }

  return {
    accounts: genesisAccounts,
    genesisKeys,
    faucetKeys,
    rotatingValidatorsKeys,
    mnemonics: {
      genesis: mnemonic,
      faucet: faucetMnemonic,
      rotatingValidators: rotatingValidatorsMnemonic,
    },
  };
};
