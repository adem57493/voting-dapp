/**
 * ============================================
 * WEB3 HELPER - MOCK VERSION
 * ============================================
 * Simulated blockchain - No MetaMask needed!
 * Tamamen sahte cüzdan ve blockchain simülasyonu
 */

class Web3Helper {
    constructor() {
        this.account = null;
        this.chainId = 31337;
        this.balance = 10000;
        
        // Simulated blockchain state
        this.mockData = {
            election: {
                name: 'Genel Seçim 2024',
                description: 'Merkezi olmayan blockchain tabanlı güvenli oylama sistemi',
                candidateCount: 0,
                voterCount: 0,
                totalVotes: 0,
                started: false,
                ended: false,
                startTime: 0,
                endTime: 0
            },
            candidates: [],
            voters: {},
            admin: null
        };
        
        // Load saved data from localStorage
        this.loadFromStorage();
    }

    saveToStorage() {
        localStorage.setItem('votingDappData', JSON.stringify(this.mockData));
        localStorage.setItem('votingDappAccount', this.account);
    }

    loadFromStorage() {
        const saved = localStorage.getItem('votingDappData');
        const savedAccount = localStorage.getItem('votingDappAccount');
        
        if (saved) {
            this.mockData = JSON.parse(saved);
        }
        if (savedAccount) {
            this.account = savedAccount;
        }
    }

    generateAddress() {
        const chars = '0123456789abcdef';
        let address = '0x';
        for (let i = 0; i < 40; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        return address;
    }

    isMetaMaskInstalled() {
        return true;
    }

    async connectWallet() {
        await this.delay(500);
        
        if (!this.account) {
            this.account = this.generateAddress();
            
            if (!this.mockData.admin) {
                this.mockData.admin = this.account;
            }
        }
        
        this.saveToStorage();

        return {
            account: this.account,
            chainId: this.chainId
        };
    }

    initContract() {
        console.log('✅ Mock contract initialized');
        this.contract = null;
        return true;
    }

    async getAccount() {
        return this.account;
    }

    getNetworkName(chainId) {
        return 'Simülasyon Ağı (Test)';
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async simulateTransaction() {
        await this.delay(1000 + Math.random() * 1000);
        return {
            hash: '0x' + Array(64).fill(0).map(() => 
                '0123456789abcdef'[Math.floor(Math.random() * 16)]
            ).join(''),
            wait: async () => {
                await this.delay(500);
                return { status: 1 };
            }
        };
    }

    async getElectionStatus() {
        await this.delay(200);
        
        if (this.mockData.election.started && !this.mockData.election.ended) {
            const now = Math.floor(Date.now() / 1000);
            if (now > this.mockData.election.endTime) {
                this.mockData.election.ended = true;
                this.saveToStorage();
            }
        }
        
        return this.mockData.election;
    }

    async getAllCandidates() {
        await this.delay(200);
        return this.mockData.candidates;
    }

    async getVoterStatus(address) {
        await this.delay(100);
        const addr = address || this.account;
        const voter = this.mockData.voters[addr];
        
        return {
            isRegistered: voter ? voter.isRegistered : false,
            hasVoted: voter ? voter.hasVoted : false,
            votedCandidateId: voter ? voter.votedCandidateId : 0
        };
    }

    async getRemainingTime() {
        if (!this.mockData.election.started || this.mockData.election.ended) {
            return 0;
        }
        const now = Math.floor(Date.now() / 1000);
        const remaining = this.mockData.election.endTime - now;
        return remaining > 0 ? remaining : 0;
    }

    async isVotingActive() {
        const status = await this.getElectionStatus();
        return status.started && !status.ended;
    }

    async getAdmin() {
        return this.mockData.admin || this.account;
    }

    async getWinner() {
        await this.delay(200);
        
        if (this.mockData.candidates.length === 0) {
            return { id: 0, name: 'Henüz aday yok', voteCount: 0 };
        }
        
        let winner = this.mockData.candidates[0];
        for (const candidate of this.mockData.candidates) {
            if (candidate.voteCount > winner.voteCount) {
                winner = candidate;
            }
        }
        
        return {
            id: winner.id,
            name: winner.name,
            voteCount: winner.voteCount
        };
    }

    async registerVoter() {
        if (!this.account) throw new Error('Cüzdan bağlı değil');
        
        if (this.mockData.voters[this.account]?.isRegistered) {
            throw new Error('Zaten kayıtlısınız');
        }
        
        const tx = await this.simulateTransaction();
        
        this.mockData.voters[this.account] = {
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0
        };
        this.mockData.election.voterCount++;
        
        this.saveToStorage();
        return tx;
    }

    async vote(candidateId) {
        if (!this.account) throw new Error('Cüzdan bağlı değil');
        
        const voter = this.mockData.voters[this.account];
        if (!voter?.isRegistered) throw new Error('Kayıtlı değilsiniz');
        if (voter.hasVoted) throw new Error('Zaten oy kullandınız');
        if (!this.mockData.election.started) throw new Error('Oylama başlamadı');
        if (this.mockData.election.ended) throw new Error('Oylama bitti');
        
        const candidate = this.mockData.candidates.find(c => c.id === candidateId);
        if (!candidate) throw new Error('Geçersiz aday');
        
        const tx = await this.simulateTransaction();
        
        voter.hasVoted = true;
        voter.votedCandidateId = candidateId;
        candidate.voteCount++;
        this.mockData.election.totalVotes++;
        
        this.saveToStorage();
        return tx;
    }

    async addCandidate(name, party, imageUrl) {
        if (!this.account) throw new Error('Cüzdan bağlı değil');
        if (this.mockData.election.started) throw new Error('Oylama başladı, aday eklenemez');
        
        const tx = await this.simulateTransaction();
        
        const newId = this.mockData.candidates.length + 1;
        this.mockData.candidates.push({
            id: newId,
            name: name,
            party: party || 'Bağımsız',
            imageUrl: imageUrl || '',
            voteCount: 0
        });
        this.mockData.election.candidateCount++;
        
        this.saveToStorage();
        return tx;
    }

    async startVoting(durationInMinutes) {
        if (!this.account) throw new Error('Cüzdan bağlı değil');
        if (this.mockData.candidates.length < 2) throw new Error('En az 2 aday olmalı');
        if (this.mockData.election.started) throw new Error('Oylama zaten başladı');
        
        const tx = await this.simulateTransaction();
        
        const now = Math.floor(Date.now() / 1000);
        this.mockData.election.started = true;
        this.mockData.election.ended = false;
        this.mockData.election.startTime = now;
        this.mockData.election.endTime = now + (durationInMinutes * 60);
        
        this.saveToStorage();
        return tx;
    }

    async endVoting() {
        if (!this.account) throw new Error('Cüzdan bağlı değil');
        if (!this.mockData.election.started) throw new Error('Oylama başlamadı');
        if (this.mockData.election.ended) throw new Error('Oylama zaten bitti');
        
        const tx = await this.simulateTransaction();
        
        this.mockData.election.ended = true;
        this.mockData.election.endTime = Math.floor(Date.now() / 1000);
        
        this.saveToStorage();
        return tx;
    }

    async resetElection(newName, newDescription) {
        if (!this.account) throw new Error('Cüzdan bağlı değil');
        
        const tx = await this.simulateTransaction();
        
        this.mockData.election = {
            name: newName,
            description: newDescription,
            candidateCount: 0,
            voterCount: 0,
            totalVotes: 0,
            started: false,
            ended: false,
            startTime: 0,
            endTime: 0
        };
        this.mockData.candidates = [];
        this.mockData.voters = {};
        
        this.saveToStorage();
        return tx;
    }
}

const web3Helper = new Web3Helper();
window.web3Helper = web3Helper;