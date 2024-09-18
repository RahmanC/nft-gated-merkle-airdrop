import hre, { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const claimList = require("./files/claimants.json");

async function main() {
  // Select a claimer from the claimants list
  const claimer = Object.keys(claimList)[0]; // Simulated claimer for testing
  const amount = claimList[claimer].amount;
  const proof = claimList[claimer].proof;

  await helpers.impersonateAccount(claimer);
  const impersonatedAccount = await ethers.getSigner(claimer);

  const ROOT =
    "0xfd7ab7a5c242aa57367def989f37dea7821df12d11d0172fff4f3d126fe7c921";
  const BAYC_CONTRACT_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

  // Deploy the Airdrop token contract
  const AirdropToken = await ethers.getContractFactory("AirdropToken");
  const airdropToken = await AirdropToken.deploy();
  await airdropToken.waitForDeployment();

  const token_address = await airdropToken.getAddress();

  console.log(`AirdropToken is deployed to`, token_address);

  // Deploy the ClaimAirdrop contract
  const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
  const merkleAirdrop = await MerkleAirdrop.deploy(
    token_address,
    ROOT,
    BAYC_CONTRACT_ADDRESS
  );
  await merkleAirdrop.waitForDeployment();

  const merkle_address = merkleAirdrop.target;

  console.log(`Merkle Airdrop is deployed to`, merkle_address);

  // Transfer tokens to the airdrop contract
  const transferAmount = ethers.parseEther("5000");
  await airdropToken.transfer(merkle_address, transferAmount);
  console.log("Tokens transferred to airdrop contract");

  // Claim the airdrop
  const claimAmount = ethers.parseEther(amount);
  // const signer = await ethers.getSigner(claimer);

  const claimTx = await merkleAirdrop
    .connect(impersonatedAccount)
    .claim(claimAmount, proof);
  await claimTx.wait();
  console.log("Airdrop claimed successfully");

  // Check balances
  const userBalance = await airdropToken.balanceOf(impersonatedAccount.address);
  console.log(`User's balance after claim: ${ethers.formatEther(userBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
