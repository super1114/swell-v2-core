const util = require("util");
const { getTag } = require("./helpers");
const { exec } = require("child_process");
const execProm = util.promisify(exec);

const getLastTagContractFactory = async () => {
  const tag = await getTag();
  await execProm(
    "git clone git@github.com:SwellNetwork/v2-core.git contracts/latest"
  );
  await execProm("cd contracts/latest");
  await execProm(
    `git checkout tags/${tag} -b automatic-latest-testing-${new Date().getTime()}`
  );
  await execProm("mv contracts ../latest-tag");
  await execProm("cd .. && rm -rf latest");
  await execProm(`npx hardhat compile`);
  console.log("--> old contract factory getting done");
};

module.exports = {
  getLastTagContractFactory
};
