// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, upgrades } = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const SWNFTUpgradeGoerli = await ethers.getContractFactory("SWNFTUpgradeGoerli");
  // swNFT = await upgrades.deployProxy(SWNFTUpgradeGoerli, [], { kind: "uups" });
  // await swNFT.deployed();
  // console.log("swNFT:", swNFT.address);

  // const SWETH = await ethers.getContractFactory("SWETH");
  // swETH = await SWETH.deploy(swNFT.address);
  // await swETH.deployed();
  // await swNFT.setBaseTokenAddress(swETH.address);
  // console.log("swETH:", swETH.address);

  const Strategy = await ethers.getContractFactory("Strategy");
  strategy = await Strategy.deploy("0xAec0d87B79178E62B31e193178CBE01282BA652e");
  await strategy.deployed();
  console.log("strategy:", strategy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });