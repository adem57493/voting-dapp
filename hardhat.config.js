

require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Solidity compiler version
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  // Default network
  defaultNetwork: "localhost",

  // Network configurations
  networks: {
    // Local Hardhat network
    localhost: {
      url: "http://127.0.0.1:8545"
    },

    // Ganache local network
    ganache: {
      url: process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },

    // Volta testnet (Energy Web Chain)
    volta: {
      url: process.env.VOLTA_RPC_URL || "https://volta-rpc.energyweb.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 73799
    },

    // Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },

  // Paths
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
