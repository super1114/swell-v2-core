const { expect } = require("chai");

describe("Dispatch Test ETH", () => {
  let signer, user1, user2, MultiSender, multisender;
  before(async () => {
    [signer, user1, user2] = await ethers.getSigners();
  });
  it("Should transfer ETH", async () => {
    const val = ethers.utils.parseEther("10");
    MultiSender = await ethers.getContractFactory("MultiSender");
    multisender = await MultiSender.deploy();
    const data = [user1.getAddress(), user2.getAddress()];
    expect(multisender.connect(signer).multiSend(data, { value: val }))
      .to.emit(multisender, "MultiSend")
      .withArgs(signer.getAddress(), val);
  });
});
