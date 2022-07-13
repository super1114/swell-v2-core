const fs = require("fs");
const {
  getTag,
  getImplementation,
  tryVerify,
  getManifestFile,
  renameManifestForMainEnv,
  restoreManifestForMainEnv,
  upgradeNFTContract,
} = require("./helpers");

task("upgrade", "Upgrade the contracts")
  .addOptionalParam(
    "keepVersion",
    "keep the previous release published version. don't update it",
    false,
    types.boolean
  )
  .setAction(async (taskArgs, hre) => {
    let network = await ethers.provider.getNetwork();
    const isMain = hre.network.name.includes("-main");
    const manifestFile = await getManifestFile(hre);
    renameManifestForMainEnv({ isMain, manifestFile });

    try {
      await upgradeNFTContract({ hre, taskArgs.keepVersion });
      const swNFT = await upgrades.upgradeProxy(contracts.swNFT, SWNFTUpgrade, {
        kind: "uups",
        libraries: {
          NFTDescriptor: contracts.nftDescriptorLibrary,
        },
        unsafeAllowLinkedLibraries: true,
      });
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
