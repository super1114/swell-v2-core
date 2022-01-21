import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "dotenv/config";
import '@openzeppelin/hardhat-upgrades';

import { HardhatUserConfig } from "hardhat/types";
const config: HardhatUserConfig = {
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

export default config
