// import { IDepositContract } from "./abi/IDepositContract.json";
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
// import { solidity } from "ethereum-waffle";

describe("SWNFT", async () => {
  const pubkey =
    "0xb57e2062d1512a64831462228453975326b65c7008faaf283d5e621e58725e13d10f87e0877e8325c2b1fe754f16b1ec";
  const withdrawal_credentials =
    "0x01000000000000000000000000000000219ab540356cbb839cbe05303d7705fa";
  const signature =
    "0xb224d558d829c245fe56bff9d28c7fd0d348d6795eb8faef8ce220c3657e373f8dc0a0c8512be589ecaa749fe39fc0371380a97aab966606ba7fa89c78dc1703858dfc5d3288880a813e7743f1ff379192e1f6b01a6a4a3affee1d50e5b3c849";
  const deposit_data_root =
    "0x81a814655bfc695f5f207d433b4d2e272d764857fee6efd58ba4677c076e60a9";
  const depositAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
  let swNFT, signer;

  before(async () => {
    [signer] = await ethers.getSigners();
    const SWNFT= await ethers.getContractFactory("SWNFT");
    swNFT = await SWNFT.deploy(depositAddress);
    await swNFT.deployed();
    console.log("swNFT deployed to:", swNFT.address);
  });

  it("cannot stake less than 1 ether", async function() {
    expect(
      swNFT.stake(
        pubkey,
        // withdrawal_credentials,
        signature,
        deposit_data_root,
        // "28899",
        { value: 0 }
      )
    ).to.be.revertedWith("Must send at least 1 ETH");
  });

  it("can emit LogStake", async function() {
    expect(
      swNFT.stake(
        pubkey,
        // withdrawal_credentials,
        signature,
        deposit_data_root,
        // "28899",
        { value: ethers.utils.parseEther("1") }
      )
    )
      .to.emit(swNFT, "LogStake")
      .withArgs(signer.address, "1", pubkey, ethers.utils.parseEther("1"));
  });

  it("can stake more than 1 ether", async function() {
    // let logStateEvent = new Promise<any>((resolve, reject) => {
    //   swNFT.on(
    //     "LogStake",
    //     (
    //       user,
    //       itemId,
    //       validatorIndex,
    //       deposit,
    //       event,
    //     ) => {
    //       event.removeListener();

    //       resolve({
    //         user: user,
    //         itemId: itemId,
    //         validatorIndex: validatorIndex,
    //         deposit: deposit,
    //       });
    //     },
    //   );

    //   setTimeout(() => {
    //     reject(new Error("timeout"));
    //   }, 60000);
    // });

    // let event = await logStateEvent;

    await swNFT.stake(
      pubkey,
      // withdrawal_credentials,
      signature,
      deposit_data_root,
      // "28899",
      { value: ethers.utils.parseEther("1") }
    );

    // expect(event.user).to.equal(signer.address);
    // expect(event.itemId).to.equal("1");
    // expect(event.validatorIndex).to.equal("28899");
    // expect(event.deposit).to.equal(ethers.utils.parseEther("1"));

    const tokenURI = await swNFT.tokenURI("1");
    expect(tokenURI).to.be.equal(
      "https://raw.githubusercontent.com/leckylao/Eth2S/main/metaData/"+pubkey+"/1000000000000000000.json"
    );

  });

  it("cannot stake more than 32 ether", async function() {
    expect(
      swNFT.stake(
        pubkey,
        // withdrawal_credentials,
        signature,
        deposit_data_root,
        // "28899",
        { value: ethers.utils.parseEther("32") }
      )
    ).to.be.revertedWith("cannot stake more than 32 ETH");
  });

  // it("Should be able to unstake when ETH2 phrase 1", async function() {
  //   const tx = await eTH2Staking.unstake(ether("1"), {from: sender});
  //   expectEvent(tx, "Transfer", {
  //     from: sender,
  //     to: constants.ZERO_ADDRESS,
  //     value: ether("1")
  //   })
  //   const balance = await eTH2Staking.balanceOf(sender);
  //   expect(balance).to.be.bignumber.equal("0");
  // });
});
