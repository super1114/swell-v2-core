const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithDelay = async (
    fn,
    functionType = "Function",
    retries = 30,
    interval = 10000,
    finalErr = Error("Retry failed"),
) => {
    try {
        return await fn();
    } catch (err) {
        console.log(`${functionType} call failed: ${err.message}`);
        if (retries <= 0) {
            return Promise.reject(finalErr);
        }
        await wait(interval);
        return retryWithDelay(fn, functionType, retries - 1, interval, finalErr);
    }
};

module.exports = {
    retryWithDelay
}