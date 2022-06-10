const util = require("util");
const { getTag } = require("./helpers");
const { exec } = require("child_process");
const execProm = util.promisify(exec);

const getLastTagContractFactory = async () => {
  const tag = await getTag();
  console.log({ tag });
  await execProm(
    "git clone git@github.com:SwellNetwork/v2-core.git contracts/latest"
  );
  await execProm(
    `cd contracts/latest && git checkout tags/${tag} -b automatic-latest-testing-${new Date().getTime()}`
  );
  await execProm("mv contracts/latest/contracts contracts/latest-tag");
  await execProm("rm -rf contracts/latest");
  await execProm(`npx hardhat compile`);
  console.log("--> old contract factory getting done");
};

module.exports = {
  getLastTagContractFactory
};
