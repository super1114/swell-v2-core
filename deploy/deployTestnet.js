async function deployDepositContract() {
  const DepositContract = await ethers.getContractFactory("DepositContract");
  depositContract = await DepositContract.deploy();
  await depositContract.deployed();
  console.log("depositContract:", depositContract.address);
  return depositContract.address;
}

async function deploySWNFTUpgradeTestnet(swDAOAddress, depositContractAddress) {
  const nftDescriptorLibraryFactory = await ethers.getContractFactory('NFTDescriptor')
  const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy()

  const SWNFTUpgradeTestnet = await ethers.getContractFactory("SWNFTUpgradeTestnet", {
    libraries: {
      NFTDescriptor: nftDescriptorLibrary.address,
    },
  });
  swNFT = await upgrades.deployProxy(SWNFTUpgradeTestnet, [swDAOAddress, depositContractAddress], {
    kind: "uups",
    initializer: "initialize(address,address)",
    unsafeAllowLinkedLibraries: true
  });
  await swNFT.deployed();
  console.log("swNFT:", swNFT.address);
  return swNFT;
}

module.exports = {
  deployDepositContract,
  deploySWNFTUpgradeTestnet
};