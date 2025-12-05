/**
 * ============================================
 * VOTING PAGE JAVASCRIPT
 * ============================================
 * Main voting functionality for voters
 */

// State
let electionStatus = null;
let candidates = [];
let voterStatus = null;
let selectedCandidate = null;
let timerInterval = null;

// DOM Elements
const elements = {
    // Header
    connectWallet: document.getElementById('connectWallet'),
    networkBadge: document.getElementById('networkBadge'),
    
    // Election Info
    electionName: document.getElementById('electionName'),
    electionDescription: document.getElementById('electionDescription'),
    totalVoters: document.getElementById('totalVoters'),
    totalVotes: document.getElementById('totalVotes'),
    candidateCount: document.getElementById('candidateCount'),
    
    // Timer
    votingStatus: document.getElementById('votingStatus'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    
    // Registration
    registrationSection: document.getElementById('registrationSection'),
    registerBtn: document.getElementById('registerBtn'),
    registrationStatus: document.getElementById('registrationStatus'),
    
    // Candidates
    candidatesGrid: document.getElementById('candidatesGrid'),
    
    // Results
    resultsSection: document.getElementById('resultsSection'),
    winnerCard: document.getElementById('winnerCard'),
    
    // Modals
    voteModal: document.getElementById('voteModal'),
    selectedCandidateInfo: document.getElementById('selectedCandidateInfo'),
    confirmVote: document.getElementById('confirmVote'),
    cancelVote: document.getElementById('cancelVote'),
    closeModal: document.getElementById('closeModal'),
    
    // Transaction Modal
    txModal: document.getElementById('txModal'),
    txIcon: document.getElementById('txIcon'),
    txTitle: document.getElementById('txTitle'),
    txMessage: document.getElementById('txMessage'),
    txHash: document.getElementById('txHash')
};

// ==================== INITIALIZATION ====================

async function init() {
    console.log('🗳️ Initializing Voting DApp...');
    
    // Load contract config
    await loadContractConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if already connected
    const account = await web3Helper.getAccount();
    if (account) {
        await handleWalletConnected(account);
    }
    
    // Load initial data (even without wallet for display)
    await loadElectionData();
}

function setupEventListeners() {
    // Connect wallet
    elements.connectWallet.addEventListener('click', connectWallet);
    
    // Register voter
    elements.registerBtn.addEventListener('click', registerVoter);
    
    // Vote modal
    elements.confirmVote.addEventListener('click', confirmVote);
    elements.cancelVote.addEventListener('click', closeVoteModal);
    elements.closeModal.addEventListener('click', closeVoteModal);
    
    // Close modal on outside click
    elements.voteModal.addEventListener('click', (e) => {
        if (e.target === elements.voteModal) closeVoteModal();
    });
    
    // Web3 events
    window.addEventListener('accountChanged', (e) => {
        handleWalletConnected(e.detail.account);
    });
    
    window.addEventListener('walletDisconnected', () => {
        updateWalletUI(null);
        voterStatus = null;
    });
}

// ==================== WALLET FUNCTIONS ====================

async function connectWallet() {
    try {
        const { account, chainId } = await web3Helper.connectWallet();
        await handleWalletConnected(account);
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert(error.message);
    }
}

async function handleWalletConnected(account) {
    updateWalletUI(account);
    
    // Initialize contract
    web3Helper.initContract();
    
    // Load voter status
    await loadVoterStatus();
    
    // Refresh data
    await loadElectionData();
}

function updateWalletUI(account) {
    if (account) {
        elements.connectWallet.innerHTML = `
            <span class="wallet-icon">🦊</span>
            <span class="wallet-text">${web3Helper.formatAddress(account)}</span>
        `;
        
        elements.networkBadge.classList.remove('disconnected');
        elements.networkBadge.querySelector('.network-name').textContent = 
            web3Helper.getNetworkName(web3Helper.chainId);
    } else {
        elements.connectWallet.innerHTML = `
            <span class="wallet-icon">🦊</span>
            <span class="wallet-text">Cüzdan Bağla</span>
        `;
        
        elements.networkBadge.classList.add('disconnected');
        elements.networkBadge.querySelector('.network-name').textContent = 'Bağlantı Yok';
    }
}

// ==================== DATA LOADING ====================

async function loadElectionData() {
    try {
        // Try to load from contract first, fallback to API
        if (web3Helper.contract) {
            electionStatus = await web3Helper.getElectionStatus();
            candidates = await web3Helper.getAllCandidates();
        } else {
            // Load from API
            const statusRes = await fetch(CONFIG.API.ELECTION_STATUS);
            electionStatus = await statusRes.json();
            
            const candidatesRes = await fetch(CONFIG.API.CANDIDATES);
            candidates = await candidatesRes.json();
        }
        
        updateElectionUI();
        renderCandidates();
        startTimer();
        
    } catch (error) {
        console.error('Failed to load election data:', error);
        elements.electionName.textContent = 'Veri Yüklenemedi';
        elements.candidatesGrid.innerHTML = `
            <div class="loading-state">
                <p>❌ Blockchain bağlantısı kurulamadı</p>
                <p>Lütfen MetaMask ile bağlanın</p>
            </div>
        `;
    }
}

async function loadVoterStatus() {
    if (!web3Helper.contract || !web3Helper.account) return;
    
    try {
        voterStatus = await web3Helper.getVoterStatus();
        updateRegistrationUI();
    } catch (error) {
        console.error('Failed to load voter status:', error);
    }
}

// ==================== UI UPDATES ====================

function updateElectionUI() {
    if (!electionStatus) return;
    
    elements.electionName.textContent = electionStatus.name;
    elements.electionDescription.textContent = electionStatus.description;
    elements.totalVoters.textContent = electionStatus.voterCount;
    elements.totalVotes.textContent = electionStatus.totalVotes;
    elements.candidateCount.textContent = electionStatus.candidateCount;
    
    // Update voting status
    updateVotingStatus();
    
    // Show results if ended
    if (electionStatus.ended) {
        showResults();
    }
}

function updateVotingStatus() {
    const statusEl = elements.votingStatus;
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('.status-text');
    
    if (electionStatus.ended) {
        statusEl.classList.add('ended');
        statusEl.classList.remove('waiting');
        statusText.textContent = 'Oylama Sona Erdi';
    } else if (electionStatus.started) {
        statusEl.classList.remove('ended', 'waiting');
        statusText.textContent = 'Oylama Devam Ediyor';
    } else {
        statusEl.classList.add('waiting');
        statusEl.classList.remove('ended');
        statusText.textContent = 'Oylama Başlamadı';
    }
}

function updateRegistrationUI() {
    if (!voterStatus) {
        elements.registrationSection.style.display = 'block';
        return;
    }
    
    if (voterStatus.isRegistered) {
        elements.registrationSection.style.display = 'none';
    } else {
        elements.registrationSection.style.display = 'block';
    }
}

// ==================== TIMER ====================

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function updateTimer() {
    if (!electionStatus || !electionStatus.started || electionStatus.ended) {
        elements.days.textContent = '00';
        elements.hours.textContent = '00';
        elements.minutes.textContent = '00';
        elements.seconds.textContent = '00';
        return;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const endTime = electionStatus.endTime;
    let remaining = endTime - now;
    
    if (remaining <= 0) {
        remaining = 0;
        electionStatus.ended = true;
        updateVotingStatus();
        showResults();
    }
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    
    elements.days.textContent = String(days).padStart(2, '0');
    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');
}

// ==================== CANDIDATES ====================

function renderCandidates() {
    if (candidates.length === 0) {
        elements.candidatesGrid.innerHTML = `
            <div class="loading-state">
                <p>Henüz aday eklenmedi</p>
            </div>
        `;
        return;
    }
    
    const totalVotes = electionStatus ? electionStatus.totalVotes : 0;
    
    elements.candidatesGrid.innerHTML = candidates.map((candidate, index) => {
        const percentage = totalVotes > 0 
            ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) 
            : 0;
        
        const isVoted = voterStatus && voterStatus.hasVoted && 
                        voterStatus.votedCandidateId === candidate.id;
        
        const canVote = voterStatus && voterStatus.isRegistered && 
                        !voterStatus.hasVoted && 
                        electionStatus && electionStatus.started && 
                        !electionStatus.ended;
        
        const avatar = candidate.imageUrl || CONFIG.DEFAULT_AVATARS[index % CONFIG.DEFAULT_AVATARS.length];
        
        return `
            <div class="candidate-card ${isVoted ? 'voted' : ''} ${!canVote && !electionStatus?.ended ? 'disabled' : ''}" 
                 data-id="${candidate.id}">
                <div class="candidate-image">
                    ${candidate.imageUrl 
                        ? `<img src="${candidate.imageUrl}" alt="${candidate.name}">`
                        : avatar
                    }
                    <span class="candidate-rank">#${candidate.id}</span>
                </div>
                <div class="candidate-body">
                    <h3 class="candidate-name">${candidate.name}</h3>
                    <p class="candidate-party">${candidate.party || 'Bağımsız'}</p>
                    
                    <div class="candidate-votes">
                        <div class="votes-count">
                            <span class="votes-number">${candidate.voteCount}</span>
                            <span class="votes-label">Oy</span>
                        </div>
                        <span class="votes-percentage">${percentage}%</span>
                    </div>
                    
                    <div class="vote-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    
                    ${canVote ? `
                        <button class="vote-btn" onclick="selectCandidate(${candidate.id})">
                            Oy Ver
                        </button>
                    ` : isVoted ? `
                        <button class="vote-btn voted" disabled>
                            ✓ Oy Verildi
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==================== VOTING ====================

function selectCandidate(candidateId) {
    selectedCandidate = candidates.find(c => c.id === candidateId);
    if (!selectedCandidate) return;
    
    const avatar = selectedCandidate.imageUrl || 
        CONFIG.DEFAULT_AVATARS[(candidateId - 1) % CONFIG.DEFAULT_AVATARS.length];
    
    elements.selectedCandidateInfo.innerHTML = `
        <div class="candidate-avatar">${avatar}</div>
        <h4>${selectedCandidate.name}</h4>
        <p>${selectedCandidate.party || 'Bağımsız'}</p>
    `;
    
    elements.voteModal.classList.add('active');
}

function closeVoteModal() {
    elements.voteModal.classList.remove('active');
    selectedCandidate = null;
}

async function confirmVote() {
    if (!selectedCandidate) return;
    
    closeVoteModal();
    showTxModal('pending', 'İşlem Bekleniyor', 'Lütfen MetaMask\'ta işlemi onaylayın...');
    
    try {
        const tx = await web3Helper.vote(selectedCandidate.id);
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blockchain\'de işlem onaylanıyor...');
        
        const receipt = await tx.wait();
        
        showTxModal('success', 'Oy Kullanıldı! 🎉', 
            `${selectedCandidate.name} adayına oyunuz başarıyla kaydedildi.`);
        
        // Reload data
        await loadVoterStatus();
        await loadElectionData();
        
        // Auto close modal after 3 seconds
        setTimeout(closeTxModal, 3000);
        
    } catch (error) {
        console.error('Vote failed:', error);
        showTxModal('error', 'İşlem Başarısız', error.message || 'Bir hata oluştu');
    }
}

// ==================== REGISTRATION ====================

async function registerVoter() {
    if (!web3Helper.account) {
        alert('Lütfen önce cüzdanınızı bağlayın');
        return;
    }
    
    showTxModal('pending', 'Kayıt Yapılıyor', 'Lütfen MetaMask\'ta işlemi onaylayın...');
    
    try {
        const tx = await web3Helper.registerVoter();
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blockchain\'de işlem onaylanıyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Kayıt Başarılı! ✅', 'Artık oy kullanabilirsiniz.');
        
        // Reload voter status
        await loadVoterStatus();
        renderCandidates();
        
        setTimeout(closeTxModal, 3000);
        
    } catch (error) {
        console.error('Registration failed:', error);
        showTxModal('error', 'Kayıt Başarısız', error.message || 'Bir hata oluştu');
    }
}

// ==================== RESULTS ====================

async function showResults() {
    elements.resultsSection.style.display = 'block';
    
    try {
        const winner = web3Helper.contract 
            ? await web3Helper.getWinner()
            : await (await fetch(CONFIG.API.WINNER)).json();
        
        elements.winnerCard.innerHTML = `
            <span class="winner-badge">🏆 Kazanan</span>
            <h2 class="winner-name">${winner.name}</h2>
            <p class="winner-votes">${winner.voteCount} oy ile seçimi kazandı</p>
        `;
    } catch (error) {
        console.error('Failed to load winner:', error);
    }
}

// ==================== TRANSACTION MODAL ====================

function showTxModal(status, title, message) {
    const icons = {
        pending: '⏳',
        success: '✅',
        error: '❌'
    };
    
    elements.txIcon.textContent = icons[status] || '⏳';
    elements.txTitle.textContent = title;
    elements.txMessage.textContent = message;
    elements.txModal.classList.add('active');
    
    if (status === 'pending') {
        elements.txIcon.style.animation = 'bounce 1s ease infinite';
    } else {
        elements.txIcon.style.animation = 'none';
    }
}

function closeTxModal() {
    elements.txModal.classList.remove('active');
}

// Make functions available globally
window.selectCandidate = selectCandidate;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
