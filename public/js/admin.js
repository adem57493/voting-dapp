

// State
let electionStatus = null;
let candidates = [];
let isAdmin = false;

// DOM Elements
const elements = {
    // Header
    connectWallet: document.getElementById('connectWallet'),
    networkBadge: document.getElementById('networkBadge'),
    
    // Status Card
    adminStatusCard: document.getElementById('adminStatusCard'),
    adminAddress: document.getElementById('adminAddress'),
    adminDashboard: document.getElementById('adminDashboard'),
    
    // Election Status
    electionBadge: document.getElementById('electionBadge'),
    electionName: document.getElementById('electionName'),
    candidateCount: document.getElementById('candidateCount'),
    voterCount: document.getElementById('voterCount'),
    voteCount: document.getElementById('voteCount'),
    
    // Forms
    addCandidateForm: document.getElementById('addCandidateForm'),
    startVotingForm: document.getElementById('startVotingForm'),
    resetElectionForm: document.getElementById('resetElectionForm'),
    
    // Buttons
    startVotingBtn: document.getElementById('startVotingBtn'),
    endVotingBtn: document.getElementById('endVotingBtn'),
    refreshCandidates: document.getElementById('refreshCandidates'),
    
    // Table
    candidatesTableBody: document.getElementById('candidatesTableBody'),
    
    // Transaction Modal
    txModal: document.getElementById('txModal'),
    txIcon: document.getElementById('txIcon'),
    txTitle: document.getElementById('txTitle'),
    txMessage: document.getElementById('txMessage'),
    closeTxModal: document.getElementById('closeTxModal')
};


async function init() {
    console.log('Initializing Admin Panel...');
    
    // Load contract config  
    await loadContractConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if already connected
    const account = await web3Helper.getAccount();
    if (account) {
        await handleWalletConnected(account);
    }
}

function setupEventListeners() {
    // Connect wallet
    elements.connectWallet.addEventListener('click', connectWallet);
    
    // Forms
    elements.addCandidateForm.addEventListener('submit', handleAddCandidate);
    elements.startVotingForm.addEventListener('submit', handleStartVoting);
    elements.resetElectionForm.addEventListener('submit', handleResetElection);
    
    // Buttons
    elements.endVotingBtn.addEventListener('click', handleEndVoting);
    elements.refreshCandidates.addEventListener('click', loadCandidates);
    elements.closeTxModal.addEventListener('click', closeTxModal);
    
    // Duration presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('votingDuration').value = btn.dataset.minutes;
        });
    });
    
    // Web3 events
    window.addEventListener('accountChanged', (e) => {
        handleWalletConnected(e.detail.account);
    });
    
    window.addEventListener('walletDisconnected', () => {
        updateWalletUI(null);
        showAdminStatus();
    });
}

//  WALLET FUNCTIONS 

async function connectWallet() {
    try {
        const { account } = await web3Helper.connectWallet();
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
    
    // Check if admin
    await checkAdminStatus();
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

//  ADMIN CHECK 

async function checkAdminStatus() {
    if (!web3Helper.contract) {
        showAdminStatus();
        return;
    }
    
    try {
        const adminAddress = await web3Helper.getAdmin();
        elements.adminAddress.textContent = adminAddress;
        
        isAdmin = web3Helper.account.toLowerCase() === adminAddress.toLowerCase();
        
        if (isAdmin) {
            showAdminDashboard();
            await loadElectionData();
        } else {
            showAdminStatus();
        }
    } catch (error) {
        console.error('Failed to check admin status:', error);
        showAdminStatus();
    }
}

function showAdminStatus() {
    elements.adminStatusCard.style.display = 'block';
    elements.adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    elements.adminStatusCard.style.display = 'none';
    elements.adminDashboard.style.display = 'flex';
}

//  DATA LOADING 

async function loadElectionData() {
    try {
        electionStatus = await web3Helper.getElectionStatus();
        updateElectionStatusUI();
        await loadCandidates();
    } catch (error) {
        console.error('Failed to load election data:', error);
    }
}

async function loadCandidates() {
    try {
        candidates = await web3Helper.getAllCandidates();
        renderCandidatesTable();
    } catch (error) {
        console.error('Failed to load candidates:', error);
    }
}

//  UI UPDATES 

function updateElectionStatusUI() {
    if (!electionStatus) return;
    
    elements.electionName.textContent = electionStatus.name;
    elements.candidateCount.textContent = electionStatus.candidateCount;
    elements.voterCount.textContent = electionStatus.voterCount;
    elements.voteCount.textContent = electionStatus.totalVotes;
    
    // Update badge
    const badge = elements.electionBadge;
    badge.classList.remove('waiting', 'active', 'ended');
    
    if (electionStatus.ended) {
        badge.textContent = 'Sona Erdi';
        badge.classList.add('ended');
        elements.startVotingBtn.disabled = true;
        elements.endVotingBtn.disabled = true;
    } else if (electionStatus.started) {
        badge.textContent = 'Aktif';
        badge.classList.add('active');
        elements.startVotingBtn.disabled = true;
        elements.endVotingBtn.disabled = false;
    } else {
        badge.textContent = 'Bekliyor';
        badge.classList.add('waiting');
        elements.startVotingBtn.disabled = false;
        elements.endVotingBtn.disabled = true;
    }
}

function renderCandidatesTable() {
    if (candidates.length === 0) {
        elements.candidatesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">Henüz aday eklenmedi</td>
            </tr>
        `;
        return;
    }
    
    const totalVotes = electionStatus ? electionStatus.totalVotes : 0;
    
    elements.candidatesTableBody.innerHTML = candidates.map((candidate, index) => {
        const percentage = totalVotes > 0 
            ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) 
            : 0;
        
        const avatar = candidate.imageUrl || 
            CONFIG.DEFAULT_AVATARS[index % CONFIG.DEFAULT_AVATARS.length];
        
        return `
            <tr>
                <td>${candidate.id}</td>
                <td>
                    <div class="candidate-photo">
                        ${candidate.imageUrl 
                            ? `<img src="${candidate.imageUrl}" alt="${candidate.name}">`
                            : avatar
                        }
                    </div>
                </td>
                <td>${candidate.name}</td>
                <td>${candidate.party || 'Bağımsız'}</td>
                <td>${candidate.voteCount}</td>
                <td>
                    <div class="vote-bar">
                        <div class="vote-bar-track">
                            <div class="vote-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="vote-bar-percentage">${percentage}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== ADMIN ACTIONS ====================

async function handleAddCandidate(e) {
    e.preventDefault();
    
    const name = document.getElementById('candidateName').value.trim();
    const party = document.getElementById('candidateParty').value.trim();
    const imageUrl = document.getElementById('candidateImage').value.trim();
    
    if (!name) {
        alert('Aday adı gerekli');
        return;
    }
    
    showTxModal('pending', 'Aday Ekleniyor', 'Lütfen MetaMask\'ta işlemi onaylayın...');
    
    try {
        const tx = await web3Helper.addCandidate(name, party, imageUrl);
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blockchain\'de işlem onaylanıyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Aday Eklendi! ✅', `${name} başarıyla eklendi.`);
        
        // Clear form
        e.target.reset();
        
        // Reload data
        await loadElectionData();
        
    } catch (error) {
        console.error('Add candidate failed:', error);
        showTxModal('error', 'İşlem Başarısız', error.message || 'Bir hata oluştu');
    }
}

async function handleStartVoting(e) {
    e.preventDefault();
    
    const duration = parseInt(document.getElementById('votingDuration').value);
    
    if (!duration || duration < 1) {
        alert('Geçerli bir süre girin');
        return;
    }
    
    showTxModal('pending', 'Oylama Başlatılıyor', 'Lütfen MetaMask\'ta işlemi onaylayın...');
    
    try {
        const tx = await web3Helper.startVoting(duration);
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blockchain\'de işlem onaylanıyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Oylama Başladı! 🚀', `${duration} dakikalık oylama başlatıldı.`);
        
        // Reload data
        await loadElectionData();
        
    } catch (error) {
        console.error('Start voting failed:', error);
        showTxModal('error', 'İşlem Başarısız', error.message || 'Bir hata oluştu');
    }
}

async function handleEndVoting() {
    if (!confirm('Oylamayı sonlandırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        return;
    }
    
    showTxModal('pending', 'Oylama Sonlandırılıyor', 'Lütfen MetaMask\'ta işlemi onaylayın...');
    
    try {
        const tx = await web3Helper.endVoting();
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blockchain\'de işlem onaylanıyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Oylama Sona Erdi! ⏹️', 'Seçim sonuçları kesinleşti.');
        
        // Reload data
        await loadElectionData();
        
    } catch (error) {
        console.error('End voting failed:', error);
        showTxModal('error', 'İşlem Başarısız', error.message || 'Bir hata oluştu');
    }
}

async function handleResetElection(e) {
    e.preventDefault();
    
    const newName = document.getElementById('newElectionName').value.trim();
    const newDesc = document.getElementById('newElectionDesc').value.trim();
    
    if (!newName) {
        alert('Yeni seçim adı gerekli');
        return;
    }
    
    if (!confirm('Seçimi sıfırlamak istediğinizden emin misiniz? Tüm veriler silinecek.')) {
        return;
    }
    
    showTxModal('pending', 'Seçim Sıfırlanıyor', 'Lütfen MetaMask\'ta işlemi onaylayın...');
    
    try {
        const tx = await web3Helper.resetElection(newName, newDesc || '');
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blockchain\'de işlem onaylanıyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Seçim Sıfırlandı! 🔄', 'Yeni seçim oluşturuldu.');
        
        // Clear form
        e.target.reset();
        
        // Reload data
        await loadElectionData();
        
    } catch (error) {
        console.error('Reset election failed:', error);
        showTxModal('error', 'İşlem Başarısız', error.message || 'Bir hata oluştu');
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
        elements.closeTxModal.style.display = 'none';
    } else {
        elements.txIcon.style.animation = 'none';
        elements.closeTxModal.style.display = 'block';
    }
}

function closeTxModal() {
    elements.txModal.classList.remove('active');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
