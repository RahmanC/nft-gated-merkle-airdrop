const { expect } = require("chai");
const { ethers } = require("hardhat");
const keccak25 = require("keccak256");

describe("MerkleAirdrop", function () {
  let airdropToken: any,
    merkleAirdrop: any,
    // baycNFT,
    owner,
    user1: any,
    user2: any,
    merkleRoot,
    tree: any;

  const BAYC_CONTRACT_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AirdropToken = await ethers.getContractFactory("AirdropToken");
    airdropToken = await AirdropToken.deploy();
    await airdropToken.waitForDeployment();

    const claimants = [
      { address: user1.address, amount: ethers.parseEther("100") },
    ];

    const leaves = claimants.map((claimant) =>
      keccak25(
        ethers.defaultAbiCoder.encode(
          ["address", "uint256"],
          [claimant.address, claimant.amount]
        )
      )
    );

    tree = new MerkleTree(leaves, keccak25, { sortPairs: true });
    merkleRoot = tree.getHexRoot();

    // Deploy Merkle Airdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    merkleAirdrop = await MerkleAirdrop.deploy(
      airdropToken.address,
      merkleRoot,
      BAYC_CONTRACT_ADDRESS
    );
    await merkleAirdrop.deployed();

    // Transfer tokens to the Merkle Airdrop contract
    await airdropToken.transfer(
      merkleAirdrop.address,
      ethers.parseEther("1000")
    );
  });

  it("Should allow eligible user with BAYC NFT to claim airdrop", async function () {
    const proof = tree.getHexProof(
      keccak25(
        ethers.defaultAbiCoder.encode(
          ["address", "uint256"],
          [user1.address, ethers.parseEther("100")]
        )
      )
    );

    await expect(
      merkleAirdrop.connect(user1).claim(ethers.parseEther("100"), proof)
    )
      .to.emit(merkleAirdrop, "AirdropClaimed")
      .withArgs(user1.address, ethers.parseEther("100"));

    const userBalance = await airdropToken.balanceOf(user1.address);
    expect(userBalance).to.equal(ethers.parseEther("100"));
  });

  it("Should revert if user does not own BAYC NFT", async function () {
    const proof = tree.getHexProof(
      keccak256(
        ethers.defaultAbiCoder.encode(
          ["address", "uint256"],
          [user2.address, ethers.parseEther("100")]
        )
      )
    );

    await expect(
      merkleAirdrop.connect(user2).claim(ethers.parseEther("100"), proof)
    ).to.be.revertedWith("Must own a BAYC NFT to claim");
  });

  it("Should revert if Merkle proof is invalid", async function () {
    const wrongProof = tree.getHexProof(
      keccak256(
        ethers.defaultAbiCoder.encode(
          ["address", "uint256"],
          [user2.address, ethers.parseEther("100")]
        )
      )
    );

    await expect(
      merkleAirdrop.connect(user1).claim(ethers.parseEther("100"), wrongProof)
    ).to.be.revertedWith("Invalid merkle proof.");
  });

  it("Should revert if user tries to claim twice", async function () {
    const proof = tree.getHexProof(
      keccak256(
        ethers.defaultAbiCoder.encode(
          ["address", "uint256"],
          [user1.address, ethers.parseEther("100")]
        )
      )
    );

    // First claim should pass
    await merkleAirdrop.connect(user1).claim(ethers.parseEther("100"), proof);

    // Second claim should fail
    await expect(
      merkleAirdrop.connect(user1).claim(ethers.parseEther("100"), proof)
    ).to.be.revertedWith("Airdrop already claimed.");
  });
});
