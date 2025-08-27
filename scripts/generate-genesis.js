import * as sdk from "@vechain/sdk-core";
import prompts from "prompts";
import { createConfig, createForkConfig } from "./config.js";
import { loadPreviousKeys } from "./use-previous-keys.js";
import { generateNewKeys } from "./generate-new-keys.js";
import { generateAuthorityAndExecutorKeys, loadAuthorityAndExecutorKeys } from "./authority-executor.js";
import { saveAllKeys, saveGenesis, createGenesisAccounts } from "./file-utils.js";

const main = async () => {
  console.log("🚀 VeChain Genesis Builder");
  console.log("=========================");

  // Basic genesis configuration
  const { gasLimit } = await prompts({
    type: "number",
    name: "gasLimit",
    message: "Enter the gas limit for the genesis block",
    initial: 40000000,
    min: 10_000_000,
    max: 100_000_000,
  });

  const { extraData } = await prompts({
    type: "text",
    name: "extraData",
    message: "Enter the extra data for the genesis block",
    initial: "Hayabusa Devnet",
  });

  // Create genesis object
  const genesis = {
    gasLimit,
    extraData,
    forkConfig: await createForkConfig(),
    config: await createConfig(),
    launchTime: Math.floor(Date.now() / 1000),
  };

  // Choose between using existing keys or generating new ones
  const { usePreviousKeys } = await prompts({
    type: "confirm",
    name: "usePreviousKeys",
    message: "Do you want to use existing keys?",
    initial: true,
  });

  let keyData;
  if (usePreviousKeys) {
    console.log("\n📂 Loading existing keys...");
    keyData = await loadPreviousKeys();
  } else {
    console.log("\n🔑 Generating new keys...");
    keyData = await generateNewKeys();
  }

  // Generate or load authority and executor keys
  let authorityData;
  if (usePreviousKeys) {
    console.log("📂 Loading existing authority/executor keys...");
    const { outDir } = await prompts({
      type: "text",
      name: "outDir",
      message: "Enter the directory containing existing keys",
      initial: "./custom-net",
    });
    authorityData = await loadAuthorityAndExecutorKeys(outDir);
  } else {
    console.log("🔑 Generating authority and executor keys...");
    authorityData = await generateAuthorityAndExecutorKeys();
  }

  // Create genesis accounts
  console.log("\n⚙️  Creating genesis accounts...");
  const genesisAccounts = createGenesisAccounts(
    keyData.accounts,
    authorityData.authorityAmount,
    authorityData.authorityAccounts,
    authorityData.endorsorAccounts,
    authorityData.executorAccounts
  );

  // Add Params address with authority count
  genesisAccounts.push({
    address: "0x0000000000000000000000000000506172616d73", // Params address
    balance: "0x0",
    energy: 0,
    storage: {
      "0x000000000000000000000000006d61782d626c6f636b2d70726f706f73657273":
        "0x" + BigInt(authorityData.authorities).toString(16).padStart(64, "0"),
    },
  });

  // Complete genesis configuration
  genesis.accounts = genesisAccounts;
  genesis.authority = authorityData.authorityAccounts;
  
  genesis.executor = {
    approvers: authorityData.executorApprovers,
  };

  genesis.params = {
    executorAddress: "0x0000000000000000000000004578656375746f72",
    baseGasPrice: 10000000000000,
    rewardRatio: 300000000000000000n,
    proposerEndorsement: 25000000000000000000000000n,
  };

  // Save all files
  console.log("\n💾 Saving files...");
  
  // Combine all mnemonics
  const allMnemonics = {
    genesis: keyData.mnemonics.genesis,
    faucet: keyData.mnemonics.faucet,
    rotatingValidators: keyData.mnemonics.rotatingValidators,
    authority: authorityData.mnemonics.authority,
    endorser: authorityData.mnemonics.endorser,
    executor: authorityData.mnemonics.executor,
  };

  const outDir = await saveAllKeys(
    keyData.genesisKeys,
    keyData.faucetKeys,
    keyData.rotatingValidatorsKeys,
    authorityData.authorityKeys,
    authorityData.endorsorAccounts,
    authorityData.executorAccounts,
    allMnemonics
  );

  saveGenesis(genesis, outDir);

  console.log("\n✅ Genesis creation completed successfully!");
  console.log(`📁 Files saved to: ${outDir}`);
  console.log(`📊 Summary:`);
  console.log(`   - Genesis accounts: ${keyData.genesisKeys.length}`);
  console.log(`   - Faucet accounts: ${keyData.faucetKeys.length}`);
  console.log(`   - Rotating validators: ${keyData.rotatingValidatorsKeys.length}`);
  console.log(`   - Authority nodes: ${authorityData.authorities}`);
  console.log(`   - Executors: ${authorityData.executorAccounts.length}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
