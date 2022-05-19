const fs = require("fs");
const { getTag } = require("./helpers");

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

    // convert JSON object to string
    const data = JSON.stringify(versions, null, 2);

    // write to version file
    fs.writeFileSync(path, data);
  });

module.exports = {};
