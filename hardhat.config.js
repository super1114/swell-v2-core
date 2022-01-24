require( "@nomiclabs/hardhat-waffle" );
require( "hardhat-gas-reporter" );
require( "hardhat-abi-exporter" );
require( "@nomiclabs/hardhat-etherscan" );
require("dotenv").config();
require( "@openzeppelin/hardhat-upgrades" );
require("solidity-coverage");

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
      }
    }
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  abiExporter: {
    clear: true,
    flat: true,
    only: ["SWNFT"],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
}