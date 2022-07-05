const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);
const { IMPLEMENTATION_STORAGE_ADDRESS } = require("../constants/addresses");
const { retryWithDelay } = require("./utils");

const getTag = async () => {
    try {
        await execProm("git pull --tags");
    } catch { }
    let result = await execProm("git tag | sort -V | tail -1");
    return result.stdout.trim();
};

const getImplementation = async (proxyAddrss, hre) => {
    const implementation = await hre.ethers.provider.getStorageAt(
        proxyAddrss,
        IMPLEMENTATION_STORAGE_ADDRESS,
    );
    return hre.ethers.utils.hexValue(implementation);
}

const tryVerify = async (hre, address, path, constructorArguments) => {
    await retryWithDelay(async () => {
        try {
            console.log("verify");
            await hre.run("verify:verify", {
            address: address,
            contract: path,
            constructorArguments: constructorArguments,
            });
        } catch (e) {
            if (e.message.toLowerCase().includes("constructor arguments exceeds max accepted")) {
            // This error may be to do with the compiler, "constructor arguments exceeds max accepted (10k chars) length"
            // Possibly because the contract should have been compiled in isolation before deploying ie "compile:one"
            console.warn(`Couldn't verify contract at ${address}. Error: ${e.message}, skipping verification`);
            return;
            }
            if (!e.message.toLowerCase().includes("already verified")) {
            throw e;
            }
        }
    }, "Try Verify Failed: " + address);
};

module.exports = {
    getTag,
    getImplementation,
    tryVerify
};