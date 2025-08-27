import * as sdk from "@vechain/sdk-core";
import * as fs from "fs";
import prompts from "prompts";
import { validateKeys } from "./use-previous-keys.js";

export const generateAuthorityAndExecutorKeys = async () => {
  const { authorities } = await prompts({
    type: "number",
    name: "authorities",
    message: "Enter the amount of Authority nodes to allocate to the genesis block",
    initial: 10,
  });

  const { authorityBalance } = await prompts({
    type: "number",
    name: "authorityBalance",
    message: "Enter the amount (Millions) of VET and VTHO to allocate to each Authority node",
    initial: 40,
  });

  const authorityAmount = BigInt(authorityBalance) * BigInt(1e6) * BigInt(1e18);

  // Generate authority and endorser keys
  const authorityKeys = [];
  const endorsorAccounts = [];
  const authorityAccounts = [];
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
    const endorsorAddress = sdk.Address.ofPrivateKey(endorserKey).toString();

    const identity = await sdk.Secp256k1.generatePrivateKey();
    const identityHex = Buffer.of(...identity).toString("hex");

    authorityAccounts[i] = {
      masterAddress: authorityAddress,
      endorsorAddress: endorsorAddress,
      identity: `0x` + identityHex,
    };

    authorityKeys[i] = {
      address: authorityAddress,
      key: authorityKeyHex,
    };

    endorsorAccounts[i] = {
      address: endorsorAddress,
      key: endorserKeyHex,
    };
  }

  // Generate executor keys
  const executorAccounts = [];
  const executorApprovers = [];
  const executorMnemonic = sdk.Mnemonic.of(12);
  const executorHDKey = sdk.HDKey.fromMnemonic(executorMnemonic);
  
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

    executorApprovers.push({
      address: executorAddress,
      identity: `0x` + identityHex,
    });
  }

  return {
    authorities,
    authorityAmount,
    authorityKeys,
    endorsorAccounts,
    authorityAccounts,
    executorAccounts,
    executorApprovers,
    mnemonics: {
      authority: authorityMnemonic,
      endorser: endorserMnemonic,
      executor: executorMnemonic,
    },
  };
};

export const loadAuthorityAndExecutorKeys = async (outDir) => {
  try {
    const authorityKeys = JSON.parse(fs.readFileSync(`${outDir}/authority-keys.json`, 'utf8'));
    const authorityMnemonic = fs.readFileSync(`${outDir}/authority-mnemonic.txt`, 'utf8').split(',');
    
    const endorsorAccounts = JSON.parse(fs.readFileSync(`${outDir}/endorsor-keys.json`, 'utf8'));
    const endorsorMnemonic = fs.readFileSync(`${outDir}/endorsor-mnemonic.txt`, 'utf8').split(',');
    
    const executorAccounts = JSON.parse(fs.readFileSync(`${outDir}/executor-keys.json`, 'utf8'));
    const executorMnemonic = fs.readFileSync(`${outDir}/executor-mnemonic.txt`, 'utf8').split(',');

    validateKeys(authorityKeys, authorityMnemonic);
    validateKeys(endorsorAccounts, endorsorMnemonic);
    validateKeys(executorAccounts, executorMnemonic);

    const { authorityBalance } = await prompts({
      type: "number",
      name: "authorityBalance",
      message: "Enter the amount (Millions) of VET and VTHO to allocate to each Authority node",
      initial: 40,
    });

    const authorityAmount = BigInt(authorityBalance) * BigInt(1e6) * BigInt(1e18);

    // Recreate authority accounts with identities
    const authorityAccounts = [];
    for (let i = 0; i < authorityKeys.length; i++) {
      const identity = await sdk.Secp256k1.generatePrivateKey();
      const identityHex = Buffer.of(...identity).toString("hex");
      
      authorityAccounts[i] = {
        masterAddress: authorityKeys[i].address,
        endorsorAddress: endorsorAccounts[i].address,
        identity: `0x` + identityHex,
      };
    }

    // Create executor approvers with identities
    const executorApprovers = [];
    for (let i = 0; i < executorAccounts.length; i++) {
      const identity = await sdk.Secp256k1.generatePrivateKey();
      const identityHex = Buffer.of(...identity).toString("hex");
      
      executorApprovers.push({
        address: executorAccounts[i].address,
        identity: `0x` + identityHex,
      });
    }

    return {
      authorities: authorityKeys.length,
      authorityAmount,
      authorityKeys,
      endorsorAccounts,
      authorityAccounts,
      executorAccounts,
      executorApprovers,
      mnemonics: {
        authority: authorityMnemonic,
        endorser: endorsorMnemonic,
        executor: executorMnemonic,
      },
    };
  } catch (error) {
    throw new Error(`Failed to load authority/executor keys: ${error.message}`);
  }
};
