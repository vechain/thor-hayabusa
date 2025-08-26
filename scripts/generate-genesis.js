import * as sdk from "@vechain/sdk-core";
import * as fs from "fs";
import prompts from "prompts";

const forkConfigs = [
  "VIP191",
  "ETH_CONST",
  "BLOCKLIST",
  "ETH_IST",
  "VIP214",
  "FINALITY",
  "GALACTICA",
  "HAYABUSA",
  "HAYABUSA_TP"
];

const main = async () => {
  const genesisAccounts = [];
  const genesisKeys = [];
  const authorityAccounts = [];
  const authorityKeys = [];
  const endorsorAccounts = [];
  const genesis = {};

  const { gasLimit } = await prompts({
    type: "number",
    name: "gasLimit",
    message: "Enter the gas limit for the genesis block",
    initial: "40000000",
    min: 10_000_000,
    max: 100_000_000,
  });
  genesis.gasLimit = gasLimit;

  const { extraData } = await prompts({
    type: "text",
    name: "extraData",
    message: "Enter the extra data for the genesis block",
    initial: "Hayabusa Devnet",
  });
  genesis.extraData = extraData;

  genesis.forkConfig = {};
  for (const config of forkConfigs) {
    const { blockNumber } = await prompts({
      type: "number",
      name: "blockNumber",
      message: `Enter the block number for the ${config} fork`,
      initial: 0,
      validate: (value) =>
        value >= 0 ? true : "Block number must be greater than or equal to 0",
    });
    genesis.forkConfig[config] = blockNumber;
  }

  const { lowStakingPeriod } = await prompts({
    type: "number",
    name: "lowStakingPeriod",
    message: "Enter the low staking period",
    initial: 18,
  });
  const { mediumStakingPeriod } = await prompts({
    type: "number",
    name: "mediumStakingPeriod",
    message: "Enter the medium staking period",
    initial: 180,
  });
  const { highStakingPeriod } = await prompts({
    type: "number",
    name: "highStakingPeriod",
    message: "Enter the high staking period",
    initial: 8640,
  });
  const { epochLength } = await prompts({
    type: "number",
    name: "epochLength",
    message: "Enter the epoch length",
    initial: 18,
  });
  const { cooldownPeriod } = await prompts({
    type: "number",
    name: "cooldownPeriod",
    message: "Enter the cooldown period",
    initial: 720,
  });

  const { blockInterval } = await prompts({
    type: "number",
    name: "blockInterval",
    message: "Enter the block interval (in seconds)",
    initial: 10,
  });

  const { seederInterval } = await prompts({
    type: "number",
    name: "seederInterval",
    message: "Enter the seeder interval",
    initial: 720,
  });

  const { validatorEvictionThreshold } = await prompts({
    type: "number",
    name: "validatorEvictionThreshold",
    message: "Enter the validator eviction threshold",
    initial: 8640,
  });

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

  const { accounts } = await prompts({
    type: "number",
    name: "accounts",
    message: "Enter the number of genesis accounts",
    initial: 250,
    min: 1,
    max: 1000,
  });

  const { faucetAccounts } = await prompts({
    type: "number",
    name: "faucetAccounts",
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

  const mnemonic = sdk.Mnemonic.of(12);
  const node = sdk.HDKey.fromMnemonic(mnemonic);

  for (let i = 0; i < accounts; i++) {
    const child = node.deriveChild(i);
    const key = child.privateKey;
    const keyHex = Buffer.of(...key).toString("hex");
    const address = sdk.Address.ofPrivateKey(key);
    genesisAccounts[i] = {
      address: address.toString(),
      balance: `0x` + balance.toString(16),
      energy: `0x` + balance.toString(16),
    };
    genesisKeys[i] = {
      address: address.toString(),
      key: keyHex,
    };
  }

  const faucetKeys = [];
  const faucetMnemonic = sdk.Mnemonic.of(12);
  const faucetHDKey = sdk.HDKey.fromMnemonic(faucetMnemonic);
  for (let i = accounts; i < accounts + faucetAccounts; i++) {
    const child = faucetHDKey.deriveChild(i);
    const key = child.privateKey;
    const keyHex = Buffer.of(...key).toString("hex");
    const address = sdk.Address.ofPrivateKey(key);
    genesisAccounts[i] = {
      address: address.toString(),
      balance: `0x` + faucetBalance.toString(16),
      energy: `0x` + faucetBalance.toString(16),
    };
    faucetKeys.push({
      address: address.toString(),
      key: keyHex,
    });
  }

  const rotatingValidatorsKeys = [];
  const rotatingValidatorsMnemonic = sdk.Mnemonic.of(12);
  const rotatingValidatorsHDKey = sdk.HDKey.fromMnemonic(rotatingValidatorsMnemonic);
  for (let i = accounts + faucetAccounts; i < accounts + faucetAccounts + rotatingValidators; i++) {
    const child = rotatingValidatorsHDKey.deriveChild(i);
    const key = child.privateKey;
    const keyHex = Buffer.of(...key).toString("hex");
    const address = sdk.Address.ofPrivateKey(key);
    rotatingValidatorsKeys.push({
      address: address.toString(),
      key: keyHex,
    });
    genesisAccounts[i] = {
      address: address.toString(),
      balance: `0x` + rotatingValidatorsBalance.toString(16),
      energy: `0x` + rotatingValidatorsBalance.toString(16),
    };
  }

  genesisAccounts.push({
    address: "0x00000000000000000000000000005374616b6572", // Staker address
    balance: "0x0",
    energy: 0,
    code: "0x6060604052600256",
  });

  genesis.accounts = genesisAccounts;

  const { authorities } = await prompts({
    type: "number",
    name: "authorities",
    message:
      "Enter the amount of Authority nodes to allocate to the genesis block",
    initial: 10,
  });
  const { authorityBalance } = await prompts({
    type: "number",
    name: "authorityBalance",
    message:
      "Enter the amount (Millions) of VET and VTHO to allocate to each Authority node",
    initial: 40,
  });

  genesisAccounts.push({
    address: "0x0000000000000000000000000000506172616d73", // Params address
    balance: "0x0",
    energy: 0,
    storage: {
      "0x000000000000000000000000006d61782d626c6f636b2d70726f706f73657273": 
      "0x" + BigInt(authorities).toString(16).padStart(64, "0"),
    }
  })

  const authorityAmount = BigInt(authorityBalance) * BigInt(1e6) * BigInt(1e18);
  const authorityMnemonic = sdk.Mnemonic.of(12);
  const endorserMnemonic = sdk.Mnemonic.of(12);
  const authorityHDKey = sdk.HDKey.fromMnemonic(authorityMnemonic);
  const endorserHDKey = sdk.HDKey.fromMnemonic(endorserMnemonic);

  for (let i = 0; i < authorities; i++) {
    const authorityChild = authorityHDKey.deriveChild(i);
    const authorityKey = authorityChild.privateKey;
    const authorityKeyHex = Buffer.of(...authorityKey).toString("hex");
    const authorityAddress = sdk.Address.ofPrivateKey(authorityKey).toString();

    const endorserChild = endorserHDKey.deriveChild(i);
    const endorserKey = endorserChild.privateKey;
    const endorserKeyHex = Buffer.of(...endorserKey).toString("hex");
    const endorserAddress = sdk.Address.ofPrivateKey(endorserKey).toString();

    const identity = await sdk.Secp256k1.generatePrivateKey();
    const identityHex = Buffer.of(...identity).toString("hex");
    
    authorityAccounts[i] = {
      masterAddress: authorityAddress,
      endorserAddress: endorserAddress,
      identity: `0x` + identityHex,
    };

    authorityKeys[i] = {
      address: authorityAddress,
      key: authorityKeyHex,
    };

    endorsorAccounts[i] = {
      address: endorserAddress,
      key: endorserKeyHex,
    };

    genesis.accounts.push({
      address: endorserAddress,
      balance: `0x` + authorityAmount.toString(16),
      energy: `0x` + authorityAmount.toString(16),
      code: "0x6060604052600256",
      storage: {
        ["0x0000000000000000000000000000000000000000000000000000000000000001"]:
          "0x0000000000000000000000000000000000000000000000000000000000000002",
      },
    });

    genesis.accounts.push({
      address: authorityAddress,
      balance: `0x` + authorityAmount.toString(16),
      energy: `0x` + authorityAmount.toString(16),
    });
  }

  genesis.authority = authorityAccounts;

  genesis.executor = {};
  genesis.executor.approvers = [];
  const executorAccounts = [];
  const executorMnemonic = sdk.Mnemonic.of(12);
  const executorHDKey = sdk.HDKey.fromMnemonic(executorMnemonic);
  // create 5 executors
  for (let i = 0; i < 5; i++) {
    const executorChild = executorHDKey.deriveChild(i);
    const executorKey = executorChild.privateKey;
    const executorKeyHex = Buffer.of(...executorKey).toString("hex");
    const executorAddress = sdk.Address.ofPrivateKey(executorKey).toString();

    const identity = await sdk.Secp256k1.generatePrivateKey();
    const identityHex = Buffer.of(...identity).toString("hex");

    executorAccounts.push({
      key: executorKeyHex,
      address: executorAddress,
    });

    genesis.executor.approvers.push({
      address: executorAddress,
      identity: `0x` + identityHex,
    });
  }

  genesis.params = {
    executorAddress: genesisAccounts[0].address,
    baseGasPrice: 10000000000000,
    rewardRatio: 300000000000000000n,
    proposerEndorsement: 25000000000000000000000000n,
  };

  genesis.config = {
    blockInterval,
    epochLength,
    seederInterval,
    validatorEvictionThreshold,
    lowStakingPeriod,
    mediumStakingPeriod,
    highStakingPeriod,
    cooldownPeriod,
  };

  genesis.launchTime = Math.floor(Date.now() / 1000);

  const { outDir } = await prompts({
    type: "text",
    name: "outDir",
    message: "Enter the output directory",
    initial: "./custom-net",
  });

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  function bigIntReplacer(_key, value) {
    return typeof value === "bigint" ? value.toString() : value;
  }

  fs.writeFileSync(
    `${outDir}/genesis.json`,
    JSON.stringify(genesis, bigIntReplacer, 2), // Indent with 2 spaces
  );
  fs.writeFileSync(
    `${outDir}/authority-keys.json`,
    JSON.stringify(authorityKeys, null, 2),
  );
  fs.writeFileSync(
    `${outDir}/authority-mnemonic.txt`,
    authorityMnemonic.join(',')
  );
  fs.writeFileSync(
    `${outDir}/endorsor-keys.json`,
    JSON.stringify(endorsorAccounts, null, 2),
  );
  fs.writeFileSync(
    `${outDir}/endorsor-mnemonic.txt`,
    endorserMnemonic.join(',')
  );
  fs.writeFileSync(
    `${outDir}/executor-keys.json`,
    JSON.stringify(executorAccounts, null, 2),
  );
  fs.writeFileSync(
    `${outDir}/executor-mnemonic.txt`,
    executorMnemonic.join(',')
  );
  fs.writeFileSync(
    `${outDir}/genesis-keys.json`,
    JSON.stringify(genesisKeys, null, 2),
  );
  fs.writeFileSync(
    `${outDir}/genesis-mnemonic.txt`,
    mnemonic.join(',')
  );
  fs.writeFileSync(
    `${outDir}/faucet-keys.json`,
    JSON.stringify(faucetKeys, null, 2),
  );
  fs.writeFileSync(
    `${outDir}/faucet-mnemonic.txt`,
    faucetMnemonic.join(',')
  );
  fs.writeFileSync(
    `${outDir}/rotating-validators-keys.json`,
    JSON.stringify(rotatingValidatorsKeys, null, 2),
  );
  fs.writeFileSync(
    `${outDir}/rotating-validators-mnemonic.txt`,
    rotatingValidatorsMnemonic.join(',')
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
