task("updateIsValidatorsActive", "Add validators to white list").addParam("rate", "The rate for each validator")
.setAction(
  async taskArgs => {
    [signer, user, bot] = await ethers.getSigners();

    let network = await ethers.provider.getNetwork();
    console.log("network:", network);

    // Init tag
    const path = `./deployments/${network.chainId}_versions.json`;
    const versions = require("." + path);
    const { validators } = require("../whitelist_validators.json");
    const oldTag = Object.keys(versions)[Object.keys(versions).length - 1];

    const contracts = versions[oldTag].contracts;

    const SWNFTUpgrade = await ethers.getContractFactory("SWNFTUpgrade", {
      libraries: {
        NFTDescriptor: contracts.nftDescriptorLibrary
      }
    });

    const swNFT = await SWNFTUpgrade.attach(contracts.swNFT);

    const botAddress = await swNFT.botAddress();

    if (botAddress !== signer.address)
      throw new Error("botAddress is not signer.address");

    let res;
    if(taskArgs.rate>0) res = await swNFT.updateIsValidatorActiveAndSetRate(validators, taskArgs.rate);
    else  res = await swNFT.updateIsValidatorsActive(validators);
    console.log(res);
  }
);
