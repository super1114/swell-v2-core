const fs = require("fs");
const { networkNames } = require("@openzeppelin/upgrades-core");

task("Verify", "Verify the swNFTImplementation contract")
  .setAction(async (taskArgs, hre) => {
    const isMain = hre.network.name.includes("-main");

    let network = await ethers.provider.getNetwork();

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
      const path = `./deployments/${network.chainId}_versions${isMain ? "-main" : ""
        }.json`;
      const versions = require("." + path);
      const latest = Object.keys(versions)[Object.keys(versions).length - 1];
      const contracts = versions[latest].contracts;

      await hre.run("verify:verify", {
          address: contracts.swNFTImplementation,
          constructorArguments: [],
      });
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
