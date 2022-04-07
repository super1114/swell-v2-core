// import { BigNumber, constants, Wallet } from 'ethers'
// import { waffle, ethers } from 'hardhat'
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
// import { Fixture } from 'ethereum-waffle'

describe("SWNFT", () => {
  const depositAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
  let swNFT, swETH, signer, user;

  before(async () => {
    [signer, user] = await ethers.getSigners();

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
  });

  it("can update OpRate", async function() {
    await swNFT.connect(user).updateOpRate("100");
    const opRate = await swNFT.opRate(user.address);
    expect(opRate).to.be.equal("100");
  });
});
