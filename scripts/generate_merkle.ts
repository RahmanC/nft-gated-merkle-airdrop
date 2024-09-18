const fs = require("fs");
const csv = require("csv-parser");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

// Array to store the leaf nodes
let leafNodes: any[] = [];
let claimants: any = {};

const file = __dirname + "/csv/claimants.csv";
const output = __dirname + "/files/merkleTree.json";
const rootFile = __dirname + "/files/merkleRoot.json";
const claimantsFile = __dirname + "/files/claimants.json";

// Function to hash each address and amount
function hashEntry(address: string, amount: string) {
  return keccak256(address + amount).toString("hex");
}

// Read the CSV file and generate the leaves and claimants list
fs.createReadStream(file)
  .pipe(csv())
  .on("data", (row: { address: string; amount: string }) => {
    const leaf = hashEntry(row.address, row.amount);
    leafNodes.push(leaf);

    // Store claimants with their addresses and amounts
    claimants[row.address] = {
      leaf: leaf,
      amount: row.amount,
    };
  })
  .on("end", () => {
    // Create a Merkle tree from the hashed leaves
    const merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });

    // Get the Merkle root
    const root = merkleTree.getRoot().toString("hex");

    Object.keys(claimants).forEach((address) => {
      const leaf = claimants[address].leaf;
      const proof = merkleTree.getHexProof(leaf);
      claimants[address].proof = proof;
    });

    fs.writeFileSync(output, JSON.stringify(merkleTree.toString(), null, 2));
    fs.writeFileSync(rootFile, JSON.stringify({ root }, null, 2));
    fs.writeFileSync(claimantsFile, JSON.stringify(claimants, null, 2));

    console.log("Merkle tree and claimants JSON files generated successfully.");
  });
