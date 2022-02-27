require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("solidity-coverage");
require("./deploy/deploy");

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
      }
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + process.env.INFURA_API_KEY,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    kaleido: {
      url: "https://a0sv8enxlo:Kg4U1ZHfDPbe73AmOGrL1W5guN0ndXnUjcfZbfl5OqA@a0dvp0tprn-a0tyfit5m9-rpc.au0-aws.kaleido.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: false
        }
      },
    }
  },
  abiExporter: {
    clear: true,
    flat: true,
    runOnCompile: true,
    only: ["SWETH", "SWNFTUpgrade", "SWDAO", "Strategy", "SWNFTUpgradeTestnet"],
  },
  gasReporter: {
    showTimeSpent: true,
    gasPrice: 100,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
}