const { ethers, upgrades, network } = require("hardhat");
const { expect } = require("chai");
const { extractJSONFromURI } = require("../helpers/extractJSONFromURI");
const {
  getLastTagContractFactory,
} = require("../../deploy/swNFTContractFromLastTag");
const {
  NONFUNGIBLE_POSITION_MANAGER,
  UNISWAP_V3_SWAP_ROUTER,
  UNISWAP_V3_QUOTER,
  SWETH_ADDRESS,
  WETH_ADDRESS,
  DEPOSIT_CONTRACT_ADDRESS,
  ZERO_ADDRESS,
  SWNFT_ADDRESS,
  IZUMI_LIQUID_BOX,
  SWETH_WHALE,
  SWNFT_DEPLOYER,
  SWETH_WETH_POOL,
} = require("../../constants/goerliAddresses");
const { getTickRange } = require("../helpers/uniswap/getTickRange");
const {
  generateParams,
  isToken0,
} = require("../helpers/uniswap/generateBytesParams");

const pubKey =
  "0xac57f1f4fd02fa230de17fcc5aea546615f6c0ee25d6f9478d9ea1c8ff001b8ac567a8d9cd8dcaab129a78da0103c0f2";
const signature =
  "0x97c3b0c5a83a4b8843ee2dd8e17e65a4d7a9f3cb3487366089d9d7ec1e400e0a2fa7a54b44bfadf8ce3499df952a90f915f0184af274966ecc055cd3edff0c9e5dc10ef274dcda2714d6f93443f14d785d3690094e8a0ce5662d596ccec67afe";
const depositDataRoot =
  "0xcfdac744f8f2fdf50ff0db06c06c0faf9aa117fa3539306f37d33587ee51202c";

// 16 ETH
const pubKey2 =
  "0xac57f1f4fd02fa230de17fcc5aea546615f6c0ee25d6f9478d9ea1c8ff001b8ac567a8d9cd8dcaab129a78da0103c0f2";
const signature2 =
  "0x8c0e2482bcafb4f1416248d2972c169771919803553aa17cd20bec72d9448cc455b6426cb7b10e3f7abd6c8d236b41a505a7efa05bbd62b0ae1dc251f2e3fde997e66740b65ee84bac55d77f347b0471df482ab59cd7c7723e54904682ad2e2c";
const depositDataRoot2 =
  "0x0e79a2595ada9e3ff1a994d32777522bb46022bcc4f610bc9cec4cb7904a4f0f";

const depositAddress = DEPOSIT_CONTRACT_ADDRESS;
const zeroAddress = ZERO_ADDRESS;
const wethAddress = WETH_ADDRESS;
const referralCode = "test-referral";
let swNFT,
  swETH,
  wethToken,
  signer,
  bot,
  amount,
  user,
  strategy,
  pool,
  fee,
  tokenId,
  deployer;

describe("SWNFTUpgrade with IzumiVault", () => {
  before(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl:
              "https://eth-goerli.alchemyapi.io/v2/" +
              process.env.ALCHEMY_API_KEY,
            blockNumber: 7250570,
          },
          mining: {
            auto: true,
          },
        },
      ],
    });

    [signer, user, bot] = await ethers.getSigners();

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [SWETH_WHALE],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [SWNFT_DEPLOYER],
    });

    await getLastTagContractFactory();

    const nftDescriptorLibraryFactory = await ethers.getContractFactory(
      "contracts/libraries/NFTDescriptor.sol:NFTDescriptor"
    );
    const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy();
    const SWNFTUpgrade = await ethers.getContractFactory(
      "contracts/latest-tag/tests/swNFTUpgradeTestnet.sol:SWNFTUpgradeTestnet",
      {
        libraries: {
          NFTDescriptor: nftDescriptorLibrary.address,
        },
      }
    );

    deployer = await ethers.provider.getSigner(SWNFT_DEPLOYER);
    const oldswNFT = await upgrades.forceImport(SWNFT_ADDRESS, SWNFTUpgrade, {
      kind: "uups",
      libraries: {
        NFTDescriptor: nftDescriptorLibrary.address,
      },
      unsafeAllowLinkedLibraries: true,
      deployer,
    });

    const SWNFTUpgradeNew = await ethers.getContractFactory(
      "contracts/tests/swNFTUpgradeTestnet.sol:SWNFTUpgradeTestnet",
      {
        libraries: {
          NFTDescriptor: nftDescriptorLibrary.address,
        },
        signer: deployer,
      }
    );

    swNFT = await upgrades.upgradeProxy(oldswNFT.address, SWNFTUpgradeNew, {
      kind: "uups",
      libraries: {
        NFTDescriptor: nftDescriptorLibrary.address,
      },
      unsafeAllowLinkedLibraries: true,
      deployer,
    });
    await swNFT.deployed();
    tokenId = (await swNFT.tokenIds()).toNumber() + 1;
    console.log(tokenId);

    swETH = await ethers.getContractAt(
      "contracts/swETH.sol:SWETH",
      SWETH_ADDRESS
    );

    const whaleBalance = await swETH.balanceOf(SWETH_WHALE);
    const whale = await ethers.provider.getSigner(SWETH_WHALE);
    swETH.connect(whale).transfer(signer.address, whaleBalance);

    await swNFT.setswETHAddress(swETH.address);

    // get the test token and wrapped ether contracts
    wethToken = await ethers.getContractAt(
      "contracts/interfaces/IWETH.sol:IWETH",
      wethAddress
    );
    // deposit one thousand ether from the deployer account into the wrapped ether contract
    await wethToken
      .connect(signer)
      .deposit({ value: ethers.utils.parseEther("1000") });
  });

  describe("If operator", () => {
    it("cannot stake less than 1 Ether", async function () {
      amount = ethers.utils.parseEther("0.1");
      await expect(
        swNFT
          .connect(signer)
          .stake(
            [{ pubKey, signature, depositDataRoot, amount }],
            referralCode,
            {
              value: amount,
            }
          )
      ).to.be.revertedWith("Min 1 ETH");
    });

    it("Must send 16 ETH bond as first deposit (Operator) and it should not mint any swETH", async function () {
      amount = ethers.utils.parseEther("1");
      await expect(
        swNFT
          .connect(signer)
          .stake(
            [{ pubKey, signature, depositDataRoot, amount }],
            referralCode,
            {
              value: amount,
            }
          )
      ).to.be.revertedWith("16ETH required");
      amount = ethers.utils.parseEther("16");
      await expect(
        swNFT.connect(signer).stake(
          [
            {
              pubKey: pubKey2,
              signature: signature2,
              depositDataRoot: depositDataRoot2,
              amount,
            },
          ],
          referralCode,
          {
            value: amount,
          }
        )
      ).to.emit(swNFT, "LogStake");

      const tokenURI = await swNFT.tokenURI(tokenId);
      const decodeTokenURI = extractJSONFromURI(tokenURI);
      await expect(decodeTokenURI.name).to.be.equal(
        "Swell Network Validator - swETH - " + pubKey2 + " <> 16 Ether"
      );
      await expect(decodeTokenURI.description).to.be.equal(
        "This NFT represents a liquidity position in a Swell Network Validator. The owner of this NFT can modify or redeem the position.\n" +
          "swETH Address: " +
          swETH.address.toLowerCase() +
          "\n" +
          `Token ID: ${tokenId}\n\n` +
          "⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as token symbols may be imitated."
      );

      const owner = await swNFT.ownerOf(tokenId);
      await expect(owner).to.be.equal(signer.address);

      const validatorsLength = await swNFT.validatorsLength();
      const validator = await swNFT.validators(validatorsLength - 1);
      await expect(validator).to.be.equal(pubKey2);

      const position = await swNFT.positions(tokenId);
      await expect(position.pubKey).to.be.equal(pubKey2);
      await expect(position.value).to.be.equal("16000000000000000000");
      await expect(position.baseTokenBalance).to.be.equal("0");
      await expect(position.operator).to.be.equal(true);
    });

    it("Validator should be activated for second deposit", async function () {
      amount = ethers.utils.parseEther("16");
      await expect(
        swNFT.connect(signer).stake(
          [
            {
              pubKey: pubKey2,
              signature: signature2,
              depositDataRoot: depositDataRoot2,
              amount,
            },
          ],
          referralCode,
          {
            value: amount,
          }
        )
      ).to.be.revertedWith("Val inactive");

      // Owner makes the validator active by bot
      await expect(swNFT.connect(deployer).updateBotAddress(bot.address))
        .to.emit(swNFT, "LogUpdateBotAddress")
        .withArgs(bot.address);
      const address = await swNFT.botAddress();
      await expect(address).to.be.equal(bot.address);
      await expect(swNFT.connect(bot).updateIsValidatorActive(pubKey2))
        .to.emit(swNFT, "LogUpdateIsValidatorActive")
        .withArgs(bot.address, pubKey2, true);

      // Can stake when validator is activated
      await expect(
        swNFT.connect(signer).stake(
          [
            {
              pubKey: pubKey2,
              signature: signature2,
              depositDataRoot: depositDataRoot2,
              amount,
            },
          ],
          referralCode,
          {
            value: amount,
          }
        )
      ).to.emit(swNFT, "LogStake");

      const owner = await swNFT.ownerOf(tokenId + 1);
      await expect(owner).to.be.equal(signer.address);

      const validatorsLength = await swNFT.validatorsLength();
      const validator = await swNFT.validators(validatorsLength - 1);
      await expect(validator).to.be.equal(pubKey2);

      const position = await swNFT.positions(tokenId + 1);
      await expect(position.pubKey).to.be.equal(pubKey2);
      await expect(position.value).to.be.equal("16000000000000000000");
      await expect(position.baseTokenBalance).to.be.equal(
        "16000000000000000000"
      );
      await expect(position.operator).to.be.equal(false); //whitelist second deposit
    });

    it("create the strategy", async function () {
      const positionManager = await ethers.getContractAt(
        "INonfungiblePositionManager",
        NONFUNGIBLE_POSITION_MANAGER
      );

      pool = await ethers.getContractAt("IUniswapV3Pool", SWETH_WETH_POOL);
      fee = (await pool.fee()).toString();

      const testTickSpacing = await getTickRange(pool.address, 100);

      const swellVaultFactory = await ethers.getContractFactory(
        "SwellIzumiVault"
      );

      strategy = await swellVaultFactory.deploy({
        asset: swETH.address,
        swNFT: swNFT.address,
        name: "Test Swell Izumi Vault Token",
        symbol: "TSIVT",
        positionManager: NONFUNGIBLE_POSITION_MANAGER,
        swapRouter: UNISWAP_V3_SWAP_ROUTER,
        poolData: {
          pool: pool.address,
          counterToken: wethToken.address,
          fee: await pool.fee(),
          tickLower: testTickSpacing.tickLower,
          tickUpper: testTickSpacing.tickUpper,
          liquidityPerTick: await pool.maxLiquidityPerTick(),
        },
        IzumiLiquidBox: IZUMI_LIQUID_BOX,
      });
      await strategy.deployed();

      await swETH.approve(strategy.address, ethers.constants.MaxUint256);
      await wethToken.approve(strategy.address, ethers.constants.MaxUint256);
      await swETH
        .connect(user)
        .approve(strategy.address, ethers.constants.MaxUint256);
      await wethToken
        .connect(user)
        .approve(strategy.address, ethers.constants.MaxUint256);
      await swETH
        .connect(user)
        .approve(positionManager.address, ethers.constants.MaxUint256);
      await wethToken
        .connect(user)
        .approve(positionManager.address, ethers.constants.MaxUint256);
    });

    it("can withdraw 1 swETH", async function () {
      await expect(
        swNFT
          .connect(signer)
          .withdraw(tokenId + 1, ethers.utils.parseEther("1"))
      ).to.emit(swNFT, "LogWithdraw");

      const position = await swNFT.positions(tokenId);
      await expect(position.pubKey).to.be.equal(pubKey2);
      await expect(position.value).to.be.equal("16000000000000000000");
      await expect(position.baseTokenBalance).to.be.equal("0");
    });

    it("can add strategy", async function () {
      await expect(swNFT.addStrategy(zeroAddress)).to.be.revertedWith(
        "InvalidAddress"
      );

      await expect(
        swNFT.connect(user).addStrategy(depositAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(swNFT.addStrategy(depositAddress))
        .to.emit(swNFT, "LogAddStrategy")
        .withArgs(depositAddress);
      let strategyAddress = await swNFT.strategies(1);
      await expect(strategyAddress).to.be.equal(depositAddress);

      await expect(swNFT.addStrategy(strategy.address))
        .to.emit(swNFT, "LogAddStrategy")
        .withArgs(strategy.address);
      strategyAddress = await swNFT.strategies(2);
      await expect(strategyAddress).to.be.equal(strategy.address);
    });

    it("can enter strategy", async function () {
      const amountToDeposit = ethers.utils.parseEther("1");
      const amountIn = amountToDeposit.div(2);
      const swapParams = generateParams(
        amountIn,
        swETH,
        wethToken,
        fee,
        UNISWAP_V3_QUOTER,
        pool,
        strategy
      );

      await expect(
        swNFT
          .connect(signer)
          .enterStrategy(
            tokenId + 1,
            strategy.address,
            amountToDeposit,
            swapParams
          )
      )
        .to.emit(swNFT, "LogEnterStrategy")
        .withArgs(
          tokenId + 1,
          strategy.address,
          signer.address,
          amountToDeposit
        );
    });

    it("can exit strategy", async function () {
      let assetsToWithdraw = await strategy.previewRedeem(
        ethers.utils.parseEther("0.5")
      );
      let getRequiredLiquidity = await strategy.getRequiredLiquidity(
        assetsToWithdraw,
        isToken0(swETH.address, wethToken.address)
      );
      let amountWithdrawIn = (
        await strategy.getAmountsRequired(getRequiredLiquidity)
      )[2];
      let withdrawParams = generateParams(
        amountWithdrawIn,
        wethToken,
        swETH,
        fee,
        UNISWAP_V3_QUOTER,
        pool,
        strategy
      );

      await expect(
        swNFT.exitStrategy(
          tokenId + 1,
          strategy.address,
          ethers.utils.parseEther("0.5"),
          withdrawParams
        )
      ).to.be.revertedWith("Owner only");

      await expect(
        swNFT
          .connect(signer)
          .exitStrategy(
            tokenId + 1,
            strategy.address,
            ethers.utils.parseEther("0.5"),
            withdrawParams
          )
      )
        .to.emit(swNFT, "LogExitStrategy")
        .withArgs(
          tokenId + 1,
          strategy.address,
          signer.address,
          ethers.utils.parseEther("0.5")
        );

      await expect(
        swNFT
          .connect(signer)
          .exitStrategy(
            tokenId,
            strategy.address,
            ethers.utils.parseEther("1"),
            withdrawParams
          )
      ).to.be.revertedWith("Amount too big");
    });

    it("can remove strategy", async function () {
      await expect(
        swNFT.connect(user).removeStrategy(strategy.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(swNFT.removeStrategy(strategy.address))
        .to.emit(swNFT, "LogRemoveStrategy")
        .withArgs(strategy.address);

      await expect(swNFT.removeStrategy(depositAddress))
        .to.emit(swNFT, "LogRemoveStrategy")
        .withArgs(depositAddress);
    });
  });
});
