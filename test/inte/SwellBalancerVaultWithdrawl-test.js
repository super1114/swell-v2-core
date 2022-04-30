const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createBalancerPool } = require("../helpers/createBalancerPool");
const { VAULT } = require("../../constants/addresses");

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

/*///////////////////////////////////////////////////////////////
                    BALANCER VAULT TEST SUITE
    //////////////////////////////////////////////////////////////*/

describe("Swell Balancer Vault: withdrawal", function() {
  let swellVault, balancerVault, swETH, pool, weth;
  let owner, alice;
  let poolId;
  const amount = ethers.utils.parseEther("100");
  before(async function() {
    [owner, alice] = await ethers.getSigners();

    // we get an instantiated contract in the form of a ethers.js Contract instance:
    const SWETH = await ethers.getContractFactory("SWETH");
    swETH = await SWETH.deploy(owner.address);
    await swETH.deployed();
    await swETH.connect(owner).mint(ethers.utils.parseEther("100000000"));

    // get the test token and wrapped ether contracts
    const weth = await ethers.getContractAt("IWETH", wethAddress);

    // deposit one thousand ether from the deployer account into the wrapped ether contract
    await weth
      .connect(owner)
      .deposit({ value: ethers.utils.parseEther("1000") });

    // create a WETH/TEST balancer pool
    poolId = await createBalancerPool(
      owner.address,
      swETH.address,
      weth.address
    );

    const SwellBalancerVault = await ethers.getContractFactory(
      "SwellBalancerVault"
    );
    swellVault = await SwellBalancerVault.deploy(
      swETH.address,
      "Test Swell Balancer Vault Token",
      "TSBVT",
      VAULT,
      poolId
    );
    balancerVault = await ethers.getContractAt("IVault", VAULT);

    pool = await ethers.getContractAt(
      "IWeightedPool",
      (await balancerVault.getPool(poolId))[0]
    );

    // Setup network conditions
    await swETH.approve(swellVault.address, ethers.constants.MaxUint256);
    await swETH.transfer(alice.address, ethers.utils.parseEther("500"));
    await swETH
      .connect(alice)
      .approve(swellVault.address, ethers.constants.MaxUint256);

    await weth.deposit({ value: ethers.utils.parseEther("1000") });
    await weth
      .connect(alice)
      .deposit({ value: ethers.utils.parseEther("1000") });
    await weth.approve(balancerVault.address, ethers.constants.MaxUint256);
    await swETH.approve(balancerVault.address, ethers.constants.MaxUint256);
    await weth
      .connect(alice)
      .approve(balancerVault.address, ethers.constants.MaxUint256);
    await swETH
      .connect(alice)
      .approve(balancerVault.address, ethers.constants.MaxUint256);

    await balancerVault.joinPool(poolId, owner.address, owner.address, {
      assets: [swETH.address, wethAddress].sort((a, b) => {
        if (ethers.BigNumber.from(a).eq(ethers.BigNumber.from(b))) {
          return 0;
        }
        if (ethers.BigNumber.from(a).gt(ethers.BigNumber.from(b))) {
          1;
        }
        if (ethers.BigNumber.from(a).lt(ethers.BigNumber.from(b))) {
          -1;
        }
      }),
      maxAmountsIn: [amount, amount],
      userData: ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256[]", "uint256"],
        [1, [amount, amount], 0]
      ),
      fromInternalBalance: false
    });

    await balancerVault
      .connect(alice)
      .joinPool(poolId, alice.address, alice.address, {
        assets: [swETH.address, wethAddress].sort((a, b) => {
          if (ethers.BigNumber.from(a).eq(ethers.BigNumber.from(b))) {
            return 0;
          }
          if (ethers.BigNumber.from(a).gt(ethers.BigNumber.from(b))) {
            1;
          }
          if (ethers.BigNumber.from(a).lt(ethers.BigNumber.from(b))) {
            -1;
          }
        }),
        maxAmountsIn: [amount, amount],
        userData: ethers.utils.defaultAbiCoder.encode(
          ["uint256", "uint256[]", "uint256"],
          [1, [amount, amount], 0]
        ),
        fromInternalBalance: false
      });

    await swellVault.deposit(amount, owner.address);
    await swellVault.connect(alice).deposit(amount, alice.address);
  });

  it("should return the correct amount of swETH when redeeming shares", async () => {
    // Deposit into the vault
    const estimatedRecovery = await swellVault.previewRedeem(amount);
    const shares = await swellVault.balanceOf(owner.address);
    const balanceBefore = await swETH.balanceOf(owner.address);
    await swellVault.redeem(amount, owner.address, owner.address);
    expect(await swETH.balanceOf(owner.address)).to.closeTo(
      balanceBefore.add(estimatedRecovery),
      balanceBefore.add(estimatedRecovery).div(100)
    );
    expect(await swellVault.balanceOf(owner.address)).to.eq(shares.sub(amount));
  });
  it("should return the correct amount of swETH when withdrawing assets ", async () => {
    // Deposit into the vault
    const assets = await swellVault.previewRedeem(
      await swellVault.balanceOf(owner.address)
    );
    const balanceBefore = await swETH.balanceOf(owner.address);

    await swellVault.withdraw(assets, owner.address, owner.address);
    expect(await swETH.balanceOf(owner.address)).to.be.closeTo(
      balanceBefore.add(assets),
      balanceBefore.add(assets).div(100)
    );
    expect(await swellVault.balanceOf(owner.address)).to.eq(0);
  });
});
