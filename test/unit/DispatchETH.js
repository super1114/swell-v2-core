const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dispatch Test ETH", async () => {
  let signer, user1, MultiSender, multisender;
  beforeEach(async () => {
    [signer, user1] = await ethers.getSigners();
    MultiSender = await ethers.getContractFactory("MultiSender");
    multisender = await MultiSender.deploy();
    await multisender.deployed();
  });
  it("Should transfer ETH", async () => {
    const val = ethers.utils.parseEther("10");
    const data = [user1.address];
    // expect(multisender.connect(signer).multiSend(data, { value: val }))
    //   .to.emit(multisender, "MultiSend")
    //   .withArgs(signer.getAddress(), val);
  });
});
