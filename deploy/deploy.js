const fs = require("fs");
const { getTag } = require("./helpers");
const { deployDepositContract, deploySWNFTUpgradeTestnet } = require("./deployTestnet");
const goerliDepositContract = "0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC";
let depositContractAddress, swNFT;

task("deploy", "Deploy the contracts")
  .addOptionalParam("keepVersion", "keep the previous release published version. don't update it", false, types.boolean)
  .setAction(async (taskArgs) => {
    let network = await ethers.provider.getNetwork();
    console.log("network:", network);

    // Init tag
    const path = `./deployments/${network.chainId}_versions.json`;
    const versions = require("." + path);

    const oldTag = Object.keys(versions)[Object.keys(versions).length - 1];
    let newTag;
    if (taskArgs.keepVersion) {
      newTag = oldTag;
    } else {
      // update to latest release version
      newTag = await getTag();
    }
    console.log(`Old Version: ${oldTag}`);
    console.log(`New Version: ${newTag}`);

    const contracts = versions[oldTag].contracts;
    versions[newTag] = new Object();
    versions[newTag].contracts = { ...contracts };
    versions[newTag].network = network;
    versions[newTag].date = new Date().toUTCString();

    if(network.chainId === 1191572815) {
      depositContractAddress = await deployDepositContract();
    }

    const SWDAO = await ethers.getContractFactory("SWDAO");
    const swDAO = await SWDAO.deploy();
    await swDAO.deployed();
    console.log("swDAO:", swDAO.address);
    versions[newTag].contracts.swDAO = swDAO.address;

    switch(network.chainId){
      case 5:
        swNFT = await deploySWNFTUpgradeTestnet(swDAO.address, goerliDepositContract);
        break;
      case 1191572815:
        swNFT = await deploySWNFTUpgradeTestnet(swDAO.address, depositContractAddress);
        break;
      default:
        const SWNFTUpgrade = await ethers.getContractFactory("SWNFTUpgrade");
        swNFT = await upgrades.deployProxy(SWNFTUpgrade, [swDAO.address], { kind: "uups" });
        await swNFT.deployed();
        console.log("swNFT:", swNFT.address);
    }
    versions[newTag].contracts.swNFT = swNFT.address;

    const SWETH = await ethers.getContractFactory("SWETH");
    const swETH = await SWETH.deploy(swNFT.address);
    await swETH.deployed();
    await swNFT.setswETHAddress(swETH.address);
    console.log("swETH:", swETH.address);
    versions[newTag].contracts.swETH = swETH.address;

    const Strategy = await ethers.getContractFactory("Strategy");
    const strategy = await Strategy.deploy(swNFT.address);
    await strategy.deployed();
    console.log("strategy:", strategy.address);
    versions[newTag].contracts.strategy = strategy.address;

    // convert JSON object to string
    const data = JSON.stringify(versions, null, 2);

    // write to version file
    fs.writeFileSync(path, data);
  });

module.exports = {};