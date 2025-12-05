/**
 * ============================================
 * WEB3 HELPER
 * ============================================
 * Helper class for Ethereum blockchain interactions
 */

class Web3Helper {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.account = null;
        this.chainId = null;
    }

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }

    /**
     * Connect to MetaMask wallet
     */
    async connectWallet() {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask yüklü değil! Lütfen MetaMask yükleyin.');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Create ethers provider
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.account = accounts[0];

            // Get chain ID
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;

            // Initialize contract if config is loaded
            if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ABI) {
                this.initContract();
            }

            // Setup event listeners
            this.setupEventListeners();

            return {
                account: this.account,
                chainId: this.chainId
            };
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    /**
     * Initialize contract instance
     */
    initContract() {
        if (!CONFIG.CONTRACT_ADDRESS || !CONFIG.CONTRACT_ABI) {
            console.warn('Contract config not loaded');
            return null;
        }

        this.contract = new ethers.Contract(
            CONFIG.CONTRACT_ADDRESS,
            CONFIG.CONTRACT_ABI,
            this.signer
        );

        return this.contract;
    }

    /**
     * Setup MetaMask event listeners
     */
    setupEventListeners() {
        if (!window.ethereum) return;

        // Account changed
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected
                this.account = null;
                window.dispatchEvent(new CustomEvent('walletDisconnected'));
            } else {
                this.account = accounts[0];
                window.dispatchEvent(new CustomEvent('accountChanged', {
                    detail: { account: this.account }
                }));
            }
        });

        // Chain changed
        window.ethereum.on('chainChanged', (chainId) => {
            this.chainId = parseInt(chainId, 16);
            window.dispatchEvent(new CustomEvent('chainChanged', {
                detail: { chainId: this.chainId }
            }));
            // Reload page on chain change
            window.location.reload();
        });
    }

    /**
     * Get current connected account
     */
    async getAccount() {
        if (this.account) return this.account;
        
        const accounts = await window.ethereum.request({
            method: 'eth_accounts'
        });
        
        return accounts[0] || null;
    }

    /**
     * Get network name
     */
    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            31337: 'Localhost',
            1337: 'Ganache',
            73799: 'Volta Testnet'
        };
        return networks[chainId] || `Chain ID: ${chainId}`;
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Switch network
     */
    async switchNetwork(networkKey) {
        const network = CONFIG.NETWORKS[networkKey];
        if (!network) {
            throw new Error('Unknown network');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }]
            });
        } catch (switchError) {
            // Network not added, try to add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [network]
                });
            } else {
                throw switchError;
            }
        }
    }

    //  CONTRACT METHODS 

    /**
     * Get election status
     */
    async getElectionStatus() {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const status = await this.contract.getElectionStatus();
        return {
            name: status[0],
            description: status[1],
            candidateCount: status[2].toNumber(),
            voterCount: status[3].toNumber(),
            totalVotes: status[4].toNumber(),
            started: status[5],
            ended: status[6],
            startTime: status[7].toNumber(),
            endTime: status[8].toNumber()
        };
    }

    /**
     * Get all candidates
     */
    async getAllCandidates() {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const candidates = await this.contract.getAllCandidates();
        return candidates.map((c, index) => ({
            id: c.id.toNumber(),
            name: c.name,
            party: c.party,
            imageUrl: c.imageUrl,
            voteCount: c.voteCount.toNumber()
        }));
    }

    /**
     * Get voter status
     */
    async getVoterStatus(address) {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const status = await this.contract.getVoterStatus(address || this.account);
        return {
            isRegistered: status[0],
            hasVoted: status[1],
            votedCandidateId: status[2].toNumber()
        };
    }

    /**
     * Get remaining time
     */
    async getRemainingTime() {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const time = await this.contract.getRemainingTime();
        return time.toNumber();
    }

    /**
     * Check if voting is active
     */
    async isVotingActive() {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.isVotingActive();
    }

    /**
     * Get admin address
     */
    async getAdmin() {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.admin();
    }

    /**
     * Get winner
     */
    async getWinner() {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const winner = await this.contract.getWinner();
        return {
            id: winner[0].toNumber(),
            name: winner[1],
            voteCount: winner[2].toNumber()
        };
    }

    //  VOTER TRANSACTIONS 

    /**
     * Register as voter
     */
    async registerVoter() {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const tx = await this.contract.registerVoter();
        return tx;
    }

    /**
     * Cast vote
     */
    async vote(candidateId) {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const tx = await this.contract.vote(candidateId);
        return tx;
    }

    // ==================== ADMIN TRANSACTIONS ====================

    /**
     * Add candidate
     */
    async addCandidate(name, party, imageUrl) {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const tx = await this.contract.addCandidate(name, party, imageUrl || '');
        return tx;
    }

    /**
     * Start voting
     */
    async startVoting(durationInMinutes) {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const tx = await this.contract.startVoting(durationInMinutes);
        return tx;
    }

    /**
     * End voting
     */
    async endVoting() {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const tx = await this.contract.endVoting();
        return tx;
    }

    /**
     * Reset election
     */
    async resetElection(newName, newDescription) {
        if (!this.contract) throw new Error('Contract not initialized');
        
        const tx = await this.contract.resetElection(newName, newDescription);
        return tx;
    }
}

// Create global instance
const web3Helper = new Web3Helper();
window.web3Helper = web3Helper;
