const fs = require("fs");
const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);
const { IMPLEMENTATION_STORAGE_ADDRESS } = require("../constants/addresses");
const { retryWithDelay } = require("./utils");
const SafeServiceClient = require("@gnosis.pm/safe-service-client").default;
const Safe = require("@gnosis.pm/safe-core-sdk").default;
const EthersAdapter = require("@gnosis.pm/safe-ethers-lib").default;
const axios = require("axios");
const { networkNames } = require("@openzeppelin/upgrades-core");

let nonce;
const nonceLog = [];

const getManifestFile = async (hre) => {
  let network = await hre.ethers.provider.getNetwork();
  console.log("network:", network);
  // if Main env, change network manifest file name temporarily
  const manifestFile = networkNames[network.chainId]
    ? networkNames[network.chainId]
    : `unknown-${network.chainId}`;

  return manifestFile;
};

const renameManifestForMainEnv = ({ isMain, manifestFile }) => {
  if (isMain) {
    if (fs.existsSync(`.openzeppelin/${manifestFile}.json`)) {
      fs.renameSync(
        `.openzeppelin/${manifestFile}.json`,
        `.openzeppelin/${manifestFile}-orig.json`
      );
    }
    if (fs.existsSync(`.openzeppelin/${manifestFile}-main.json`)) {
      fs.renameSync(
        `.openzeppelin/${manifestFile}-main.json`,
        `.openzeppelin/${manifestFile}.json`
      );
    }
  }
};

const restoreManifestForMainEnv = ({ isMain, manifestFile }) => {
  if (isMain) {
    // restore network manifest file
    if (fs.existsSync(`.openzeppelin/${manifestFile}.json`)) {
      fs.renameSync(
        `.openzeppelin/${manifestFile}.json`,
        `.openzeppelin/${manifestFile}-main.json`
      );
    }

    if (fs.existsSync(`.openzeppelin/${manifestFile}-orig.json`)) {
      fs.renameSync(
        `.openzeppelin/${manifestFile}-orig.json`,
        `.openzeppelin/${manifestFile}.json`
      );
    }
  }
};

const getTag = async () => {
  /*eslint no-useless-catch: "error"*/
  try {
    await execProm("git pull --tags");
  } catch (e) {
    console.log(e);
    throw e;
  }
  let result = await execProm("git tag | sort -V | tail -1");
  return result.stdout.trim();
};

const getImplementation = async (proxyAddrss, hre) => {
  const implementation = await hre.ethers.provider.getStorageAt(
    proxyAddrss,
    IMPLEMENTATION_STORAGE_ADDRESS
  );
  return hre.ethers.utils.hexValue(implementation);
};

const tryVerify = async (hre, address, path, constructorArguments) => {
  await retryWithDelay(async () => {
    try {
      await hre.run("verify:verify", {
        address: address,
        contract: path,
        constructorArguments: constructorArguments,
      });
    } catch (e) {
      if (
        e.message
          .toLowerCase()
          .includes("constructor arguments exceeds max accepted")
      ) {
        // This error may be to do with the compiler, "constructor arguments exceeds max accepted (10k chars) length"
        // Possibly because the contract should have been compiled in isolation before deploying ie "compile:one"
        console.warn(
          `Couldn't verify contract at ${address}. Error: ${e.message}, skipping verification`
        );
        return;
      }
      if (!e.message.toLowerCase().includes("already verified")) {
        throw e;
      }
      console.log(e.message);
    }
  }, "Try Verify Failed: " + address);
};

const getNonce = async (safeSdk, chainId, safeAddress) => {
  const lastConfirmedNonce = await safeSdk.getNonce();
  console.log({ lastConfirmedNonce });

  const safeTxApi = `https://safe-client.gnosis.io/v1/chains/${chainId}/safes/${safeAddress}/transactions/queued`;
  const response = await axios.get(safeTxApi);
  const results = response.data.results.reverse();
  const last = results.find((r) => r.type === "TRANSACTION");
  if (!last) {
    console.log(
      "GetNonce: No Pending Nonce - Starting from LAST CONFIRMED NONCE: ",
      lastConfirmedNonce
    );
    return lastConfirmedNonce;
  }

  const nonce = last.transaction.executionInfo.nonce + 1;
  console.log("GetNonce: Starting from last PENDING nonce: ", nonce);
  return nonce;
};

const proposeTx = async (to, data, message, config, addresses, ethers) => {
  if (!config.execute) {
    console.log("Will propose transaction:", message);
    return;
  }

  // Initialize the Safe SDK
  const provider = ethers.provider;
  const owner1 = provider.getSigner(0);
  const ethAdapter = new EthersAdapter({ ethers, signer: owner1 });
  const chainId = await ethAdapter.getChainId();

  const service = new SafeServiceClient({
    txServiceUrl: addresses.gnosisApi,
    ethAdapter,
  });

  const chainSafeAddress = addresses.protocolDaoAddress;

  console.log({ chainId, addresses, chainSafeAddress });

  const safeSdk = await Safe.create({
    ethAdapter,
    safeAddress: chainSafeAddress,
  });

  let txNonce;

  if (config.nonce !== -1) {
    console.log("--> config manual nonce", config.nonce);
    txNonce = config.nonce;
  } else {
    nonce = nonce
      ? nonce
      : await retryWithDelay(
          () => getNonce(safeSdk, chainId, chainSafeAddress),
          "Gnosis Get Nonce"
        );

    console.log({ nonce });
    txNonce = nonce;
    nonce += 1;
  }

  const transaction = {
    to: to,
    value: "0",
    data: data,
    nonce: txNonce,
  };

  const log = {
    nonce: txNonce,
    message: message,
  };

  console.log("Proposing transaction: ", transaction);
  console.log(`Nonce Log`, log);
  nonceLog.push(log);

  const safeTransaction = await safeSdk.createTransaction(transaction);
  // off-chain sign
  const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
  const senderSignature = await safeSdk.signTransactionHash(safeTxHash);
  // on-chain sign
  // const approveTxResponse = await safeSdk.approveTransactionHash(txHash)
  // console.log("approveTxResponse", approveTxResponse);
  console.log("safeTransaction: ", safeTransaction);

  const senderAddress = await owner1.getAddress();
  await retryWithDelay(
    () =>
      service.proposeTransaction({
        safeAddress: chainSafeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress,
        senderSignature: senderSignature.data,
      }),
    "Gnosis safe"
  );

  console.log("--> gnosis propose tx success", nonceLog);
};

module.exports = {
  getManifestFile,
  renameManifestForMainEnv,
  restoreManifestForMainEnv,
  getTag,
  getImplementation,
  tryVerify,
  proposeTx,
};
