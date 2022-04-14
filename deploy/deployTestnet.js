async function deployDepositContract() {
  const DepositContract = await ethers.getContractFactory("DepositContract");
  depositContract = await DepositContract.deploy();
  await depositContract.deployed();
  console.log("depositContract:", depositContract.address);
  return depositContract.address;
}

async function deploySWNFTUpgradeTestnet(swDAOAddress, depositContractAddress) {
  const nftDescriptorLibraryFactory = await ethers.getContractFactory(
    "NFTDescriptor"
  );
  const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy();
  console.log("nftDescriptorLibrary:", nftDescriptorLibrary.address);

  const SWNFTUpgradeTestnet = await ethers.getContractFactory(
    "SWNFTUpgradeTestnet",
    {
      libraries: {
        NFTDescriptor: nftDescriptorLibrary.address
      }
    }
  );
  swNFT = await upgrades.deployProxy(
    SWNFTUpgradeTestnet,
    [swDAOAddress, depositContractAddress],
    {
      kind: "uups",
      initializer: "initialize(address,address)",
      unsafeAllowLinkedLibraries: true
    }
  );
  return { swNFT, nftDescriptorLibrary };
}

async function deployMultiSenderContract() {
  const MultiSender = await ethers.getContractFactory("MultiSender");
  const multisender = await MultiSender.deploy();
  await multisender.deployed();
  console.log("multisender:", multisender.address);
  return multisender.address;
}

module.exports = {
  deployDepositContract,
  deploySWNFTUpgradeTestnet,
  deployMultiSenderContract
};
