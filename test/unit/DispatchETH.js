const { ethers } = require("hardhat");
const { expect } = require("chai");
const { abi } = require("../../abi/MultiSender.json");

describe("Dispatch Test ETH", () => {
  let signer;
  const multisendAddr = "0x0Cc88CD9DfCB4661920FE63a3Df5C69Ac777Fb8d";
  before(async () => {
    signer = await new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  });
  it("Should transfer ETH in KALEIDO network if balance is sufficient", async () => {
    const balance = await signer.getBalance();
    const val = ethers.utils.parseEther("0.2");
    const multicall = new ethers.Contract(multisendAddr, abi, signer);
    const data = ethers.utils.defaultAbiCoder.encode(
      ["address[]"],
      [
        [
          "0x9eEB110B5491985c259E3C91D321b1F8A4887061",
          "0x1a9821c73b8C2C573AD51e66D19A637FfcC7a2F5"
        ]
      ]
    );
    if (balance < parseInt(val.value)) {
      await expect(multicall.multiSend(data, { value: val })).to.be.reverted;
    } else {
      await expect(multicall.multiSend(data, { value: val })).to.not.be
        .reverted;
    }
  });
});
