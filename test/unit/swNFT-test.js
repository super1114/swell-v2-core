const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const { it } = require("mocha");

describe("SWNFT", async () => {
  const pubKey =
    "0xb57e2062d1512a64831462228453975326b65c7008faaf283d5e621e58725e13d10f87e0877e8325c2b1fe754f16b1ec";
  const pubKey1 =
    "0xac07caeafcf198bf31280d60f62f918e814e440c5247bcc75dddae7ec099e9d76a2a429a80a81ee119e6abe887193480";
  const pubKey2 =
    "0xb916ca44a8708da6951172e30bda40f14082ca16cd29dbd7a123a38821ddaf0c8bd79bec21be1c44ce00c2c5e6379d8d068c6157f66aeecc5f5bf11265ff86b3ced16fa1cc1819d96a68e25518d11cc839773f905bcac784f8679655943b98bd";
  const signature =
    "0xb224d558d829c245fe56bff9d28c7fd0d348d6795eb8faef8ce220c3657e373f8dc0a0c8512be589ecaa749fe39fc0371380a97aab966606ba7fa89c78dc1703858dfc5d3288880a813e7743f1ff379192e1f6b01a6a4a3affee1d50e5b3c849";
  const depositDataRoot =
    "0x81a814655bfc695f5f207d433b4d2e272d764857fee6efd58ba4677c076e60a9";
  const depositAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let swNFT, swETH, signer, user, strategy, swDAO;

  before(async () => {
    [signer, user, bot] = await ethers.getSigners();

    const SWDAO = await ethers.getContractFactory("SWELL");
    swDAO = await SWDAO.deploy();
    await swDAO.deployed();

    // const SWNFTUpgrade = await ethers.getContractFactory("SWNFTUpgrade");
    const nftDescriptorLibraryFactory = await ethers.getContractFactory(
      "NFTDescriptor"
    );
    const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy();
    const SWNFTUpgrade = await ethers.getContractFactory("TestswNFTUpgrade", {
      libraries: {
        NFTDescriptor: nftDescriptorLibrary.address
      }
    });
    swNFT = await upgrades.deployProxy(
      SWNFTUpgrade,
      [swDAO.address, depositAddress],
      {
        kind: "uups",
        initializer: "initialize(address, address)",
        unsafeAllowLinkedLibraries: true
      }
    );
    await swNFT.deployed();

    const SWETH = await ethers.getContractFactory("SWETH");
    swETH = await SWETH.deploy(swNFT.address);
    await swETH.deployed();
    await swNFT.setswETHAddress(swETH.address);

    const Strategy = await ethers.getContractFactory("Strategy");
    strategy = await Strategy.deploy(swNFT.address);
    await strategy.deployed();
  });

  it("cannot stake when validator is not active", async function() {
    amount = ethers.utils.parseEther("1");
    await expect(
      swNFT.stake([{ pubKey, signature, depositDataRoot, amount }], {
        value: amount
      })
    ).to.be.revertedWith("validator is not active");
  });

  it("owner sets the bot address", async function() {
    const owner = await swNFT.owner();
    await expect(owner).to.be.equal(signer.address);

    await expect(swNFT.updateBotAddress(bot.address))
      .to.emit(swNFT, "LogUpdateBotAddress")
      .withArgs(bot.address);
  });

  it("bot sets the validator to active", async function() {
    const address = await swNFT.botAddress();
    await expect(address).to.be.equal(bot.address);

    await expect(swNFT.connect(bot).updateIsValidatorActive(pubKey))
      .to.emit(swNFT, "LogUpdateIsValidatorActive")
      .withArgs(bot.address, pubKey, true);
  });

  it("bot sets validators to active", async function() {
    const address = await swNFT.botAddress();
    await expect(address).to.be.equal(bot.address);

    await expect(
      swNFT.connect(bot).updateIsValidatorsActive([pubKey1, pubKey2])
    )
      .to.emit(swNFT, "LogUpdateIsValidatorActive")
      .withArgs(bot.address, pubKey2, true);
  });

  it("can add validator into white list", async function() {
    await expect(swNFT.addWhiteList(pubKey1)).to.emit(
      swNFT,
      "LogAddWhiteList",
      signer.address,
      pubKey1
    );
  });

  it("can add validator into white lists", async function() {
    await expect(swNFT.addWhiteLists([pubKey2])).to.emit(
      swNFT,
      "LogAddWhiteList",
      signer.address,
      pubKey2
    );
  });
});
