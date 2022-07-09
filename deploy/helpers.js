const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);
const { IMPLEMENTATION_STORAGE_ADDRESS } = require("../constants/addresses");
const { retryWithDelay } = require("./utils");
const { SafeService } = require("@gnosis.pm/safe-ethers-adapters");
const {
  ContractNetworksConfig,
  EthersAdapter,
} = require("@gnosis.pm/safe-core-sdk");
const Safe = require("@gnosis.pm/safe-core-sdk");

const getTag = async () => {
  try {
    await execProm("git pull --tags");
  } catch {}
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

// const proposeTx = async (to, data, message, config, addresses) => {
//   if (!config.execute) {
//     console.log("Will propose transaction:", message);
//     return;
//   }

//   // Initialize the Safe SDK
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const provider = ethers.provider;
//   const owner1 = provider.getSigner(0);
//   const ethAdapter = new EthersAdapter({ ethers: ethers, signer: owner1 });
//   const chainId = await ethAdapter.getChainId();

//   const service = new SafeService(addresses.gnosisApi);

//   const contractNetworks = {
//     [chainId]: {
//       multiSendAddress: addresses.gnosisMultiSendAddress,
//       safeMasterCopyAddress: "",
//       safeProxyFactoryAddress: "",
//     },
//   };

//   const chainSafeAddress = addresses.protocolDaoAddress;

//   const safeSdk = await Safe.create({
//     ethAdapter,
//     safeAddress: chainSafeAddress,
//     contractNetworks,
//   });

//   nonce = nonce
//     ? nonce
//     : await retryWithDelay(
//         () => getNonce(safeSdk, chainId, chainSafeAddress, config.restartnonce),
//         "Gnosis Get Nonce"
//       );

//   const transaction = {
//     to: to,
//     value: "0",
//     data: data,
//     nonce: nonce,
//   };

//   const log = {
//     nonce: nonce,
//     message: message,
//   };

//   console.log("Proposing transaction: ", transaction);
//   console.log(`Nonce Log`, log);
//   nonceLog.push(log);

//   nonce += 1;

//   const safeTransaction = await safeSdk.createTransaction(...[transaction]);
//   // off-chain sign
//   const txHash = await safeSdk.getTransactionHash(safeTransaction);
//   const signature = await safeSdk.signTransactionHash(txHash);
//   // on-chain sign
//   // const approveTxResponse = await safeSdk.approveTransactionHash(txHash)
//   // console.log("approveTxResponse", approveTxResponse);
//   console.log("safeTransaction: ", safeTransaction);

//   await retryWithDelay(
//     () =>
//       service.proposeTx(chainSafeAddress, txHash, safeTransaction, signature),
//     "Gnosis safe"
//   );
// };

module.exports = {
  getTag,
  getImplementation,
  tryVerify,
  //   proposeTx,
};
