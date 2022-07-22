const fs = require("fs");
const {
  getTag,
  getManifestFile,
  getImplementation,
  renameManifestForMainEnv,
  restoreManifestForMainEnv,
  tryVerify,
} = require("./helpers");

task("upgrade", "Upgrade the contracts")
  .addOptionalParam(
    "keepVersion",
    "keep the previous release published version. don't update it",
    false,
    types.boolean
  )
  .setAction(async (taskArgs, hre) => {
    const isMain = hre.network.name.includes("-main");
    const manifestFile = await getManifestFile(hre);
    renameManifestForMainEnv({ isMain, manifestFile });

    try {
      const { ethers, upgrades } = hre;
      let network = await ethers.provider.getNetwork();
      // Init tag
      const path = `./deployments/${network.chainId}_versions${
        isMain ? "-main" : ""
      }.json`;
      const versions = require("." + path);

      const oldTag = Object.keys(versions)[Object.keys(versions).length - 1];
      let newTag;
      if (taskArgs.keepVersion) {
        newTag = oldTag;
      } else {
        // update to latest release version
        newTag = await getTag();
      }

      const contracts = versions[oldTag].contracts;
      versions[newTag] = new Object();
      versions[newTag].contracts = contracts;
      versions[newTag].network = network;
      versions[newTag].date = new Date().toUTCString();

      let swNFT = await ethers.getContractAt(
        "contracts/swNFTUpgrade.sol:SWNFTUpgrade",
        contracts.swNFT
      );
      // await swNFT.pause();

      const SWNFTUpgrade = await ethers.getContractFactory(
        "contracts/swNFTUpgrade.sol:SWNFTUpgrade",
        {
          libraries: {
            NFTDescriptor: contracts.nftDescriptorLibrary,
          },
        }
      );
      swNFT = await upgrades.upgradeProxy(contracts.swNFT, SWNFTUpgrade, {
        kind: "uups",
        libraries: {
          NFTDescriptor: contracts.nftDescriptorLibrary,
        },
        unsafeAllowLinkedLibraries: true,
      });
      console.log({ addr: swNFT.address });
      const swNFTImplementation = await getImplementation(swNFT.address, hre);
      try {
        await tryVerify(
          hre,
          swNFTImplementation,
          "contracts/swNFTUpgrade.sol:SWNFTUpgrade",
          []
        );
      } catch (e) {
        console.log(e);
      }

      // await swNFT.unpause();

      // convert JSON object to string
      const data = JSON.stringify(versions, null, 2);

      // write to version file
      fs.writeFileSync(path, data);
    } catch (e) {
      console.log("error", e);
    } finally {
      restoreManifestForMainEnv({ isMain, manifestFile });
    }
  });

module.exports = {};
