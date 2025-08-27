import prompts from "prompts";

const defaultForkConfig = [
  { name: "VIP191", blockNumber: 0 },
  { name: "ETH_CONST", blockNumber: 0 },
  { name: "BLOCKLIST", blockNumber: 0 },
  { name: "ETH_IST", blockNumber: 0 },
  { name: "VIP214", blockNumber: 0 },
  { name: "FINALITY", blockNumber: 0 },
  { name: "GALACTICA", blockNumber: 0 },
  { name: "HAYABUSA", blockNumber: 0 },
];

export const createForkConfig = async () => {
  const forkConfig = {};
  for (const config of defaultForkConfig) {
    const { blockNumber } = await prompts({
      type: "number",
      name: "blockNumber",
      message: `Enter the block number for the ${config.name} fork`,
      initial: config.blockNumber,
      validate: (value) =>
        value >= 0 ? true : "Block number must be greater than or equal to 0",
    });
    forkConfig[config.name] = blockNumber;
  }

  return forkConfig;
};

export const createConfig = async () => {

  const { hayabusaTP } = await prompts({
    type: "number",
    name: "hayabusaTP",
    message: "Enter the amount of blocks for the hayabusa transition period",
    initial: 18,
  });
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

  const epochValues = [
    { name: "lowStakingPeriod", value: lowStakingPeriod },
    { name: "mediumStakingPeriod", value: mediumStakingPeriod },
    { name: "highStakingPeriod", value: highStakingPeriod },
    { name: "cooldownPeriod", value: cooldownPeriod },
    { name: "seederInterval", value: seederInterval },
    { name: "validatorEvictionThreshold", value: validatorEvictionThreshold },
    { name: "hayabusaTP", value: hayabusaTP },
  ];

  for (const { name, value } of epochValues) {
    if (value % epochLength !== 0) {
      throw new Error(`${name} must be a multiple of epoch length`);
    }
  }

  const config = {
    blockInterval,
    epochLength,
    seederInterval,
    validatorEvictionThreshold,
    lowStakingPeriod,
    mediumStakingPeriod,
    highStakingPeriod,
    cooldownPeriod,
    hayabusaTP
  };

  return config;
};
