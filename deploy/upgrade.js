const fs = require("fs");
const { networkNames } = require("@openzeppelin/upgrades-core");
const { getTag, getImplementation, tryVerify  } = require("./helpers");

task("upgrade", "Upgrade the contracts")
  .addOptionalParam(
    "keepVersion",
    "keep the previous release published version. don't update it",
    false,
    types.boolean
  )
  .setAction(async (taskArgs, hre) => {
    const isMain = hre.network.name.includes("-main");

    let network = await ethers.provider.getNetwork();
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

      const SWNFTUpgrade = await ethers.getContractFactory("SWNFTUpgrade", {
        libraries: {
          NFTDescriptor: contracts.nftDescriptorLibrary
        }
      });
      const swNFT = await upgrades.upgradeProxy(contracts.swNFT, SWNFTUpgrade, {
        kind: "uups",
        libraries: {
          NFTDescriptor: contracts.nftDescriptorLibrary
        },
        unsafeAllowLinkedLibraries: true
      });
      versions[newTag].contracts.swNFT = swNFT.address;

      const swNFTImplementation = await getImplementation(swNFT.address, hre);
      await tryVerify(hre, swNFTImplementation, "contracts/swNFTUpgrade.sol:SWNFTUpgrade", []);

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
