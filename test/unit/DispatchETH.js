const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Dispatch Test ETH", () => {
  let signer;
  const testerAddr = "0x9eEB110B5491985c259E3C91D321b1F8A4887061";
  before(async () => {
    signer = await new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  });
  it("Should transfer ETH in KALEIDO network if balance is sufficient", async () => {
    const prevBalance = await signer.getBalance();

    const tx = {
      to: testerAddr,
      value: ethers.utils.parseEther("0.1")
    };
    if (prevBalance < parseInt(ethers.utils.parseEther("0.1").value)) {
      await expect(signer.sendTransaction(tx)).to.be.reverted;
    } else {
      await expect(signer.sendTransaction(tx)).to.not.be.reverted;
    }
  });
});
