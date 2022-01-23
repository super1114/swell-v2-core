require( "@nomiclabs/hardhat-waffle" );
require( "hardhat-gas-reporter" );
require( "hardhat-abi-exporter" );
require( "@nomiclabs/hardhat-etherscan" );
require( "@nomiclabs/hardhat-solhint" );
require( "dotenv/config" );
require( "@openzeppelin/hardhat-upgrades" );

module.exports = {
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
    only: ["swNFT"],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
}