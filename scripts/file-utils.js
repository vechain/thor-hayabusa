import * as fs from "fs";
import prompts from "prompts";

export const saveAllKeys = async (
  genesisKeys,
  faucetKeys,
  rotatingValidatorsKeys,
  authorityKeys,
  endorsorAccounts,
  executorAccounts,
  mnemonics
) => {
  const { outDir } = await prompts({
    type: "text",
    name: "outDir",
    message: "Enter the output directory",
    initial: "./genesis",
  });

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Save key files
  fs.writeFileSync(
    `${outDir}/genesis-keys.json`,
    JSON.stringify(genesisKeys, null, 2)
  );
  fs.writeFileSync(
    `${outDir}/genesis-mnemonic.txt`,
    mnemonics.genesis.join(",")
  );

  fs.writeFileSync(
    `${outDir}/faucet-keys.json`,
    JSON.stringify(faucetKeys, null, 2)
  );
  fs.writeFileSync(
    `${outDir}/faucet-mnemonic.txt`,
    mnemonics.faucet.join(",")
  );

  fs.writeFileSync(
    `${outDir}/rotating-validators-keys.json`,
    JSON.stringify(rotatingValidatorsKeys, null, 2)
  );
  fs.writeFileSync(
    `${outDir}/rotating-validators-mnemonic.txt`,
    mnemonics.rotatingValidators.join(",")
  );

  fs.writeFileSync(
    `${outDir}/authority-keys.json`,
    JSON.stringify(authorityKeys, null, 2)
  );
  fs.writeFileSync(
    `${outDir}/authority-mnemonic.txt`,
    mnemonics.authority.join(",")
  );

  fs.writeFileSync(
    `${outDir}/endorsor-keys.json`,
    JSON.stringify(endorsorAccounts, null, 2)
  );
  fs.writeFileSync(
    `${outDir}/endorsor-mnemonic.txt`,
    mnemonics.endorser.join(",")
  );

  fs.writeFileSync(
    `${outDir}/executor-keys.json`,
    JSON.stringify(executorAccounts, null, 2)
  );
  fs.writeFileSync(
    `${outDir}/executor-mnemonic.txt`,
    mnemonics.executor.join(",")
  );

  return outDir;
};

export const saveGenesis = (genesis, outDir) => {
  function bigIntReplacer(_key, value) {
    return typeof value === "bigint" ? value.toString() : value;
  }

  fs.writeFileSync(
    `${outDir}/genesis.json`,
    JSON.stringify(genesis, bigIntReplacer, 2)
  );
};

export const createGenesisAccounts = (accounts, authorityAmount, authorityAccounts, endorsorAccounts, executorAccounts) => {
  const genesisAccounts = [...accounts];

  // Add system accounts
  genesisAccounts.push({
    address: "0x00000000000000000000000000005374616b6572", // Staker address
    balance: "0x0",
    energy: 0,
    code: "0x6060604052600256",
  });

  // Add authority and endorsor accounts
  for (let i = 0; i < authorityAccounts.length; i++) {
    genesisAccounts.push({
      address: endorsorAccounts[i].address,
      balance: `0x` + authorityAmount.toString(16),
      energy: `0x` + authorityAmount.toString(16),
      code: "0x6060604052600256",
      storage: {
        ["0x0000000000000000000000000000000000000000000000000000000000000001"]:
          "0x0000000000000000000000000000000000000000000000000000000000000002",
      },
    });

    genesisAccounts.push({
      address: authorityAccounts[i].masterAddress,
      balance: `0x` + authorityAmount.toString(16),
      energy: `0x` + authorityAmount.toString(16),
    });
  }

  // Add executor accounts
  executorAccounts.forEach((executor) => {
    genesisAccounts.push({
      address: executor.address,
      balance: `0x` + authorityAmount.toString(16),
      energy: `0x` + authorityAmount.toString(16),
    });
  });

  return genesisAccounts;
};
