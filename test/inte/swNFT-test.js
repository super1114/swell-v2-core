// import { IDepositContract } from "./abi/IDepositContract.json";
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const { extractJSONFromURI } = require("../helpers/extractJSONFromURI");
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
  let swNFT, swETH, signer;

  before(async () => {
    [signer] = await ethers.getSigners();
    const SWNFT= await ethers.getContractFactory("SWNFT");
    swNFT = await SWNFT.deploy(depositAddress);
    await swNFT.deployed();
    console.log("swNFT deployed to:", swNFT.address);
    const SWETH= await ethers.getContractFactory("SWETH");
    swETH = await SWETH.deploy(swNFT.address);
    await swETH.deployed();
    console.log("swETH deployed to:", swETH.address);
    await swNFT.setBaseTokenAddress(swETH.address);
  });

  it("cannot deposit less than 1 ether", async function() {
    expect(
      swNFT.deposit(
        pubkey,
        // withdrawal_credentials,
        signature,
        deposit_data_root,
        // "28899",
        { value: 0 }
      )
    ).to.be.revertedWith("Must send at least 1 ETH");
  });

  it("can emit LogDeposit", async function() {
    expect(
      swNFT.deposit(
        pubkey,
        // withdrawal_credentials,
        signature,
        deposit_data_root,
        // "28899",
        { value: ethers.utils.parseEther("1") }
      )
    )
      .to.emit(swNFT, "LogDeposit")
      .withArgs(signer.address, "1", pubkey, ethers.utils.parseEther("1"));
  });

  it("can deposit more than 1 ether", async function() {
    // let logStateEvent = new Promise<any>((resolve, reject) => {
    //   swNFT.on(
    //     "LogDeposit",
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

    await swNFT.deposit(
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
    const decodeTokenURI = extractJSONFromURI(tokenURI);
    expect(decodeTokenURI.name).to.be.equal("SwellNetwork Validator - 0xb57e2062d1512a64831462228453975326b65c7008faaf283d5e621e58725e13d10f87e0877e8325c2b1fe754f16b1ec - 1 Ether");
    expect(decodeTokenURI.description).to.be.equal("This NFT represents a position in a SwellNetwork Validator. The owner of this NFT can modify or redeem position. \n\n⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as token symbols may be imitated.");
    expect(decodeTokenURI.image).to.be.equal("data:image/svg+xml;base64,");

    const position = await swNFT.positions("1");
    expect(position.pubKey).to.be.equal(pubkey);
    expect(position.value).to.be.equal('1000000000000000000');
    expect(position.baseTokenBalance).to.be.equal('1000000000000000000');
  });

  it("cannot deposit more than 32 ether", async function() {
    expect(
      swNFT.deposit(
        pubkey,
        // withdrawal_credentials,
        signature,
        deposit_data_root,
        // "28899",
        { value: ethers.utils.parseEther("32") }
      )
    ).to.be.revertedWith("cannot deposit more than 32 ETH");
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
