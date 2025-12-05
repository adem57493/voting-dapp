/**

 * Express.js server for serving the frontend
 * and providing blockchain interaction APIs
 */

const express = require('express');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//  BLOCKCHAIN SETUP
let provider;
let contract;
let contractABI;

// Load contract ABI
try {
    const contractArtifact = require('./artifacts/contracts/Voting.sol/Voting.json');
    contractABI = contractArtifact.abi;
} catch (error) {
    console.log('  Contract not compiled yet. Run: npx hardhat compile');
    contractABI = null;
}

// Initialize blockchain connection
function initializeBlockchain() {
    try {
        const rpcUrl = process.env.VOLTA_RPC_URL || 'http://127.0.0.1:8545';
        provider = new ethers.JsonRpcProvider(rpcUrl);
        
        if (process.env.CONTRACT_ADDRESS && contractABI) {
            contract = new ethers.Contract(
                process.env.CONTRACT_ADDRESS,
                contractABI,
                provider
            );
            console.log(' Connected to contract:', process.env.CONTRACT_ADDRESS);
        } else {
            console.log('  Contract address not set. Set CONTRACT_ADDRESS in .env');
        }
    } catch (error) {
        console.log(' Blockchain connection failed:', error.message);
    }
}

// API ROUTES
// Get contract address and ABI
app.get('/api/contract', (req, res) => {
    res.json({
        address: process.env.CONTRACT_ADDRESS || null,
        abi: contractABI
    });
});

// Get election status
app.get('/api/election/status', async (req, res) => {
    try {
        if (!contract) {
            return res.status(503).json({ error: 'Contract not connected' });
        }
        
        const status = await contract.getElectionStatus();
        res.json({
            name: status[0],
            description: status[1],
            candidateCount: status[2].toString(),
            voterCount: status[3].toString(),
            totalVotes: status[4].toString(),
            started: status[5],
            ended: status[6],
            startTime: status[7].toString(),
            endTime: status[8].toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all candidates
app.get('/api/candidates', async (req, res) => {
    try {
        if (!contract) {
            return res.status(503).json({ error: 'Contract not connected' });
        }
        
        const candidates = await contract.getAllCandidates();
        const formattedCandidates = candidates.map(c => ({
            id: c.id.toString(),
            name: c.name,
            party: c.party,
            imageUrl: c.imageUrl,
            voteCount: c.voteCount.toString()
        }));
        
        res.json(formattedCandidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get remaining time
app.get('/api/election/time', async (req, res) => {
    try {
        if (!contract) {
            return res.status(503).json({ error: 'Contract not connected' });
        }
        
        const remainingTime = await contract.getRemainingTime();
        const isActive = await contract.isVotingActive();
        
        res.json({
            remainingSeconds: remainingTime.toString(),
            isActive: isActive
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get winner )
app.get('/api/election/winner', async (req, res) => {
    try {
        if (!contract) {
            return res.status(503).json({ error: 'Contract not connected' });
        }
        
        const winner = await contract.getWinner();
        res.json({
            id: winner[0].toString(),
            name: winner[1],
            voteCount: winner[2].toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//SERVE FRONTEND 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// START SERVER 

initializeBlockchain();

app.listen(PORT, () => {
    console.log(`
   
          VOTING DAPP SERVER RUNNING       


          
   
     Status    : Online                           
     Port      : ${PORT}                             
     Frontend  : http://localhost:${PORT}            
     Admin     : http://localhost:${PORT}/admin      
    `);
});

module.exports = app;
