const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);

const getLastContractFactory = async () => {
  try {
    await execProm("git pull --tags");
  } catch {}
  const current = await execProm("git branch --show-current");
  const result = await execProm("git tag | sort -V | tail -1");
  const tag = result.stdout.trim();
  await execProm(
    `git checkout tags/${tag} -b automatic-latest-testing-${new Date().getTime()}`
  );
  await execProm(`npx hardhat compile`);
  console.log("--> old contract factory getting done");
  return current.stdout.trim();
};

const getCurrentContractFactory = async branch => {
  await execProm(`git checkout ${branch}`);
  await execProm(`npx hardhat compile`);
  console.log("--> current contract factory getting done");
};

module.exports = {
  getLastContractFactory,
  getCurrentContractFactory
};
