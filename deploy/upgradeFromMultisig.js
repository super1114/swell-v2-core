const fs = require("fs");
const { networkNames } = require("@openzeppelin/upgrades-core");
const { getTag, tryVerify, proposeTx } = require("./helpers");
const { GNOSIS_SAFE } = require("../constants/addresses");

task("upgradeFromMultisig", "Upgrade the swNFT from multisig wallet")
  .addOptionalParam(
    "keepVersion",
    "keep the previous release published version. don't update it",
    false,
    types.boolean
  )
  .setAction(async (taskArgs, hre) => {
    let network = await ethers.provider.getNetwork();
    if (network.chainId !== 1 && network.chainId !== 5) {
      console.log("Only available for goerli and mainnet");
      return;
    }

    const isMain = hre.network.name.includes("-main");
    console.log("network:", network);
    // if Main env, change network manifest file name temporarily
    const manifestFile = networkNames[network.chainId]
      ? networkNames[network.chainId]
      : `unknown-${network.chainId}`;

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

    try {
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

      const SWNFTUpgrade = await ethers.getContractFactory(
        "contracts/swNFTUpgrade.sol:SWNFTUpgrade",
        {
          libraries: {
            NFTDescriptor: contracts.nftDescriptorLibrary,
          },
        }
      );
      const swNFTImplementation = await upgrades.prepareUpgrade(
        contracts.swNFT,
        SWNFTUpgrade,
        {
          kind: "uups",
          libraries: {
            NFTDescriptor: contracts.nftDescriptorLibrary,
          },
          unsafeAllowLinkedLibraries: true,
        }
      );
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

      console.log({ swNFTImplementation });

      const swNFTUpgradeFactory = await hre.artifacts.readArtifact(
        "contracts/swNFTUpgrade.sol:SWNFTUpgrade"
      );
      const swNFTUpgradeFactoryABI = new ethers.utils.Interface(
        swNFTUpgradeFactory.abi
      );
      const upgradeToABI = swNFTUpgradeFactoryABI.encodeFunctionData(
        "upgradeTo",
        [swNFTImplementation]
      );
      console.log("--> before propose", swNFTImplementation);
      await proposeTx(
        contracts.swNFT,
        upgradeToABI,
        "Upgrade to new implementation",
        { execute: true, restartnonce: false },
        GNOSIS_SAFE[network.chainId],
        ethers
      );

      // convert JSON object to string
      const data = JSON.stringify(versions, null, 2);

      // write to version file
      fs.writeFileSync(path, data);
    } catch (e) {
      console.log("error", e);
    } finally {
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
    }
  });

module.exports = {};
