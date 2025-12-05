/**


 * npx hardhat run --network localhost scripts/deploy.js
 * npx hardhat run --network volta scripts/deploy.js
 */

const { ethers } = require("hardhat");

async function main() {
    
    console.log(" VOTING CONTRACT DEPLOYMENT");
   

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(" Deploying with account:", deployer.address);

    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    // Election details
    const electionName = "Genel Seçim 2024";
    const electionDescription = "Merkezi olmayan blockchain tabanlı güvenli oylama sistemi";

    console.log("Election Name:", electionName);
    console.log(" Description:", electionDescription, "\n");

    // Deploy contract
    console.log(" Deploying Voting contract...\n");
    
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(electionName, electionDescription);

    await voting.waitForDeployment();
    
    const contractAddress = await voting.getAddress();
    
  
    console.log(" DEPLOYMENT SUCCESS!");
  
    console.log(" Contract Address:         ");
    console.log(` ${contractAddress} `);
 

    console.log("Next steps:");
    console.log("1. Copy the contract address above");
    console.log("2. Paste it in your .env file as CONTRACT_ADDRESS");
    console.log("3. Run 'node index.js' to start the server");
    console.log("4. Open http://localhost:3000 in your browser\n");

    // Verify network
    const network = await ethers.provider.getNetwork();
    console.log(" Network:", network.name, "(Chain ID:", network.chainId.toString(), ")");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(" Deployment failed:", error);
        process.exit(1);
    });
