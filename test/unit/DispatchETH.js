const { ethers } = require("hardhat");
const { expect } = require("chai");
const { abi } = require("../../abi/MultiSender.json");

describe("Dispatch Test ETH", () => {
  let signer, user1, user2, MultiSender, multisender;
  before(async () => {
    [signer, user1, user2] = await ethers.getSigners();
    console.log(signer.getAddress(), user1.getAddress(), user2.getAddress());
  });
  it("Should transfer ETH", async () => {
    const balance = await signer.getBalance();
    const val = ethers.utils.parseEther("10");
    MultiSender = await ethers.getContractFactory("MultiSender");
    multisender = await MultiSender.deploy();
    const data = [user1.getAddress(), user2.getAddress()];
    await expect(multisender.connect(signer).multiSend(data, { value: val }))
      .to.emit(multisender, "MultiSend")
      .withArgs(signer.getAddress(), val);
  });
});
