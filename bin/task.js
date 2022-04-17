const { abi } = require("../abi/MultiSender.json");
task("dispatch", "Dispatch ETH to testers")
  .addParam("value", "Total amount of ETH")
  .setAction(async taskArgs => {
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    const multicall = new ethers.Contract(
      "0x36dE991E7407e0140aEBd555C3Ff668D44a64F25",
      abi,
      signer
    );
    const data = [
      "0x9eEB110B5491985c259E3C91D321b1F8A4887061",
      "0x1a9821c73b8C2C573AD51e66D19A637FfcC7a2F5"
    ];
    const res = await multicall.multiSend(data, {
      value: ethers.utils.parseEther(taskArgs.value)
    });
  });
