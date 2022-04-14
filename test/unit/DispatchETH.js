const { ethers } = require("hardhat");
const { expect } = require("chai");
const { abi } = require("../../abi/MultiSender.json");

describe("Dispatch Test ETH", () => {
  let signer, user1, user2, MultiSender, multisender;
  before(async () => {
    [signer, user1, user2] = await ethers.getSigners();
    console.log(signer.getAddress(), user1.getAddress(), user2.getAddress());
  });
  it("Should transfer ETH in KALEIDO network if balance is sufficient", async () => {
    const balance = await signer.getBalance();
    const val = ethers.utils.parseEther("0.2");
    const MultiSender = await ethers.getContractFactory("MultiSender");
    const multisender = await MultiSender.deploy();
    const data = [user1.getAddress(), user2.getAddress()];
    console.log(data);
    if (balance < parseInt(val.value)) {
      await expect(multisender.connect(signer).multiSend(data, { value: val }))
        .to.be.reverted;
    } else {
      await expect(multisender.connect(signer).multiSend(data, { value: val }))
        .to.not.be.reverted;
    }
  });
});
