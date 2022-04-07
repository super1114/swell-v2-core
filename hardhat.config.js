require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("solidity-coverage");
require("./deploy/deploy");
require("./deploy/upgrade");

const LOW_OPTIMIZER_COMPILER_SETTINGS = {
  version: "0.8.9",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 2_000,
      details: {
        yul: false
      }
    },
    metadata: {
      bytecodeHash: "none"
    }
  }
};

const LOWEST_OPTIMIZER_COMPILER_SETTINGS = {
  version: "0.8.9",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 1_000,
      details: {
        yul: false
      }
    },
    metadata: {
      bytecodeHash: "none"
    }
  }
};

const DEFAULT_COMPILER_SETTINGS = {
  version: "0.8.9",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 200,
      details: {
        yul: false
      }
    },
    metadata: {
      bytecodeHash: "none"
    }
  }
};

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url:
          "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY
      }
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + process.env.INFURA_API_KEY,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    kaleido: {
      url: process.env.KALEIDO_RPC_RUL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
    overrides: {
      "contracts/libraries/NFTDescriptor.sol": LOWEST_OPTIMIZER_COMPILER_SETTINGS
    }
  },
  abiExporter: {
    clear: true,
    flat: true,
    runOnCompile: true,
    only: ["SWETH", "SWNFTUpgrade", "SWDAO", "Strategy", "SWNFTUpgradeTestnet"]
  },
  gasReporter: {
    showTimeSpent: true,
    gasPrice: 100,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: "USD"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
};
