// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {
    address public token;
    bytes32 public merkleRoot;
    IERC721 public baycContract;
    mapping(address => bool) public claimed;

    event AirdropClaimed(address indexed claimer, uint256 amount);
    event MerkleRootUpdated(bytes32 newMerkleRoot);

    constructor(address _token, bytes32 _merkleRoot, address _baycAddress) {
        token = _token;
        merkleRoot = _merkleRoot;
        baycContract = IERC721(_baycAddress); //BAYC contract address
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!claimed[msg.sender], "Airdrop already claimed."); // Check if the user already claimed

        require(baycContract.balanceOf(msg.sender) > 0, "Must own a BAYC NFT to claim"); // Check if the user owns a BAYC NFT

        // Compute the leaf node for the sender
        bytes32 node = keccak256(abi.encodePacked(msg.sender, amount));

        // Verify the proof against the Merkle root
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "Invalid merkle proof.");

        // Mark as claimed
        claimed[msg.sender] = true;

        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed.");

        // Transfer the tokens to the claimer
        emit AirdropClaimed(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 _merkleRoot) external {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    function withdrawTokens(uint256 amount) external {
        require(IERC20(token).transfer(msg.sender, amount), "Withdraw failed.");
    }
}
