async function deployDepositContract() {
  const DepositContract = await ethers.getContractFactory("DepositContract");
  depositContract = await DepositContract.deploy();
  await depositContract.deployed();
  console.log("depositContract:", depositContract.address);
  return depositContract.address;
}

async function deploySWNFTUpgradeTestnet(swDAOAddress, depositContractAddress) {
  const SWNFTUpgradeTestnet = await ethers.getContractFactory("SWNFTUpgradeTestnet");
  swNFT = await upgrades.deployProxy(SWNFTUpgradeTestnet, [swDAOAddress, depositContractAddress], {
    kind: "uups",
    initializer: "initialize(address,address)",
  });
  await swNFT.deployed();
  console.log("swNFT:", swNFT.address);
  return swNFT;
}

module.exports = {
    deployDepositContract,
    deploySWNFTUpgradeTestnet
};