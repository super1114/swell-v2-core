const { expect } = require("chai");
const { deployments, ethers } = require("hardhat");
const { describe } = require("mocha");
const {
  NONFUNGIBLE_POSITION_MANAGER,
  UNISWAP_V3_FACTORY,
  WETH_ADDRESS,
  UNISWAP_V3_SWAP_ROUTER,
  IZUMI_LIQUID_BOX,
} = require("../../constants/addresses");
const { getTickRange } = require("../helpers/uniswap/getTickRange");

describe("Uniswap Izumi Vault", () => {
  describe("Uniswap Izumi Vault: deployment", () => {
    let swellVault, testToken, weth, positionManager;
    let alice;
    let pool;
    before(async () => {
      [, alice] = await ethers.getSigners();
    });
    const FEE = "100";
    const AddressZero = ethers.constants.AddressZero;

    beforeEach(async function () {
      await deployments.fixture([
        "_test_token",
        "_create_uniswap_pool",
        "_swell_izumi_vault",
      ]);
      swellVault = await ethers.getContract("SwellIzumiVault");
      testToken = await ethers.getContract("TestToken");
      weth = await ethers.getContractAt("IWETH", WETH_ADDRESS);
      positionManager = await ethers.getContractAt(
        "INonfungiblePositionManager",
        NONFUNGIBLE_POSITION_MANAGER
      );
      pool = await ethers.getContractAt(
        "IUniswapV3Pool",
        await (
          await ethers.getContractAt("IUniswapV3Factory", UNISWAP_V3_FACTORY)
        ).getPool(testToken.address, WETH_ADDRESS, FEE)
      );

      await weth.approve(swellVault.address, ethers.constants.MaxUint256);
      await testToken.approve(swellVault.address, ethers.constants.MaxUint256);
      await weth
        .connect(alice)
        .approve(swellVault.address, ethers.constants.MaxUint256);
      await testToken
        .connect(alice)
        .approve(swellVault.address, ethers.constants.MaxUint256);
      await weth
        .connect(alice)
        .approve(positionManager.address, ethers.constants.MaxUint256);
      await testToken
        .connect(alice)
        .approve(positionManager.address, ethers.constants.MaxUint256);
    });

    it("Should not deploy with invalid parameters", async () => {
      const { deploy } = deployments;
      const deployer = await ethers.getNamedSigner("deployer");
      const testTickSpacing = await getTickRange(pool.address, 100);
      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: AddressZero,
              swapRouter: UNISWAP_V3_SWAP_ROUTER,
              poolData: {
                pool: pool.address,
                counterToken: WETH_ADDRESS,
                fee: FEE,
                tickLower: testTickSpacing.tickLower,
                tickUpper: testTickSpacing.tickUpper,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: IZUMI_LIQUID_BOX,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid position manager");

      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: NONFUNGIBLE_POSITION_MANAGER,
              swapRouter: AddressZero,
              poolData: {
                pool: pool.address,
                counterToken: WETH_ADDRESS,
                fee: FEE,
                tickLower: testTickSpacing.tickLower,
                tickUpper: testTickSpacing.tickUpper,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: IZUMI_LIQUID_BOX,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid swap router");

      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: NONFUNGIBLE_POSITION_MANAGER,
              swapRouter: UNISWAP_V3_SWAP_ROUTER,
              poolData: {
                pool: AddressZero,
                counterToken: WETH_ADDRESS,
                fee: FEE,
                tickLower: testTickSpacing.tickLower,
                tickUpper: testTickSpacing.tickUpper,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: IZUMI_LIQUID_BOX,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid pool");

      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: NONFUNGIBLE_POSITION_MANAGER,
              swapRouter: UNISWAP_V3_SWAP_ROUTER,
              poolData: {
                pool: pool.address,
                counterToken: AddressZero,
                fee: FEE,
                tickLower: testTickSpacing.tickLower,
                tickUpper: testTickSpacing.tickUpper,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: IZUMI_LIQUID_BOX,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid token");

      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: NONFUNGIBLE_POSITION_MANAGER,
              swapRouter: UNISWAP_V3_SWAP_ROUTER,
              poolData: {
                pool: pool.address,
                counterToken: WETH_ADDRESS,
                fee: 0,
                tickLower: testTickSpacing.tickLower,
                tickUpper: testTickSpacing.tickUpper,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: IZUMI_LIQUID_BOX,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid fee");

      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: NONFUNGIBLE_POSITION_MANAGER,
              swapRouter: UNISWAP_V3_SWAP_ROUTER,
              poolData: {
                pool: pool.address,
                counterToken: WETH_ADDRESS,
                fee: FEE,
                tickLower: testTickSpacing.tickUpper,
                tickUpper: testTickSpacing.tickLower,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: IZUMI_LIQUID_BOX,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid tick range");

      await expect(
        deploy("SwellIzumiVault", {
          from: deployer.address,
          args: [
            {
              asset: testToken.address,
              name: "Test Swell Uniswap Vault Token",
              symbol: "TSUVT",
              positionManager: NONFUNGIBLE_POSITION_MANAGER,
              swapRouter: UNISWAP_V3_SWAP_ROUTER,
              poolData: {
                pool: pool.address,
                counterToken: WETH_ADDRESS,
                fee: FEE,
                tickLower: testTickSpacing.tickLower,
                tickUpper: testTickSpacing.tickUpper,
                liquidityPerTick: await pool.maxLiquidityPerTick(),
              },
              IzumiLiquidBox: AddressZero,
            },
          ],
          log: true,
          autoMine: true,
        })
      ).to.be.revertedWith("invalid liquid box");
    });
  });
});
