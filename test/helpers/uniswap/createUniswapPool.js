const { ethers } = require("hardhat");
const { UNISWAP_V3_FACTORY } = require("../../../constants/addresses");

const createUniswapPool = async (tokenA, tokenB) => {
  const factory = await ethers.getContractAt(
    "IUniswapV3Factory",
    UNISWAP_V3_FACTORY
  );

  const tx = await (await factory.createPool(tokenA, tokenB, "100")).wait();

  const pool = await ethers.getContractAt(
    "IUniswapV3Pool",
    tx.events.find((el) => el.event === "PoolCreated").args.pool
  );

  return pool;
};

module.exports = {
  createUniswapPool,
};
