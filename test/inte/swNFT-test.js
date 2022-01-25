// import { IDepositContract } from "./abi/IDepositContract.json";
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
// import { solidity } from "ethereum-waffle";

describe("SWNFT", async () => {
  const pubkey =
    "0xa5e7f4a06080b860d376871ce0798aa7677e7a4b117a5bd0909f15fee02f28a62388496982c133fef1eba087d8a06005";
  const withdrawal_credentials =
    "0x00479ca39024528497e333bceed04026a3b6573846c7c449e5a5ef26dfe7fde1";
  const signature =
    "0x81786c544c8746d274d292e2decb634165f36641e51d3cd9ea022c27591e5fd6d5cb25072df96b9d4b06ecf4766f7682140ba5e618506c79539799953d9a273f1b7663e30a34dbc33010bac8ccda26341113b26fe26d639a616d106241745f8a";
  const deposit_data_root =
    "0xcf55433ed2ceb04c0d96780245339bea1af9ec60c946c11b4c01f297b7140cd9";
  const depositAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
  let swNFT, signer;

  before(async () => {
    [signer] = await ethers.getSigners();
    const SWNFT = await ethers.getContractFactory("SWNFT");
    swNFT = await upgrades.deployProxy(SWNFT, ["Swell NFT", "swNFT"], {kind: "uups"});
    await swNFT.deployed();
    console.log("swNFT deployed to:", swNFT.address);
  });

  it("cannot stake less than 1 ether", async function() {
    expect(
      swNFT.stake(
        pubkey,
        withdrawal_credentials,
        signature,
        deposit_data_root,
        "28899",
        { value: 0 }
      )
    ).to.be.revertedWith("Must send at least 1 ETH");
  });

  it("can emit LogStake", async function() {
    expect(
      swNFT.stake(
        pubkey,
        withdrawal_credentials,
        signature,
        deposit_data_root,
        "28899",
        { value: ethers.utils.parseEther("1") }
      )
    )
      .to.emit(swNFT, "LogStake")
      .withArgs(signer.address, "1", "28899", ethers.utils.parseEther("1"));
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
      withdrawal_credentials,
      signature,
      deposit_data_root,
      "28899",
      { value: ethers.utils.parseEther("1") }
    );

    // expect(event.user).to.equal(signer.address);
    // expect(event.itemId).to.equal("1");
    // expect(event.validatorIndex).to.equal("28899");
    // expect(event.deposit).to.equal(ethers.utils.parseEther("1"));

    const tokenURI = await swNFT.tokenURI("1");
    expect(tokenURI).to.be.equal(
      "https://raw.githubusercontent.com/leckylao/Eth2S/main/metaData/28899/1000000000000000000.json"
    );

    const token = await swNFT.tokens("1");
    expect(token.pubKey).to.be.equal(
      "0xa5e7f4a06080b860d376871ce0798aa7677e7a4b117a5bd0909f15fee02f28a62388496982c133fef1eba087d8a06005"
    );
    expect(token.validatorIndex).to.be.equal("28899");
    expect(token.deposit).to.equal(ethers.utils.parseEther("1"));
  });

  it("cannot stake more than 32 ether", async function() {
    expect(
      swNFT.stake(
        pubkey,
        withdrawal_credentials,
        signature,
        deposit_data_root,
        "28899",
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
