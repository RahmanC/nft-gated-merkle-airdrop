import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const LISK_RPC_URL = process.env.LISK_RPC_URL ?? "";
const ACCOUNT_PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY ?? "";

if (!LISK_RPC_URL || !ACCOUNT_PRIVATE_KEY) {
  throw new Error(
    "Please set LISK_RPC_URL and ACCOUNT_PRIVATE_KEY in your .env file"
  );
}

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    "lisk-sepolia": {
      url: LISK_RPC_URL,
      accounts: [ACCOUNT_PRIVATE_KEY],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": "123",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
