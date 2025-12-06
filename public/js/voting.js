// State
let electionStatus = null;
let candidates = [];
let voterStatus = null;
let selectedCandidate = null;
let timerInterval = null;

// DOM Elements
const elements = {
    connectWallet: document.getElementById('connectWallet'),
    networkBadge: document.getElementById('networkBadge'),
    electionName: document.getElementById('electionName'),
    electionDescription: document.getElementById('electionDescription'),
    totalVoters: document.getElementById('totalVoters'),
    totalVotes: document.getElementById('totalVotes'),
    candidateCount: document.getElementById('candidateCount'),
    votingStatus: document.getElementById('votingStatus'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    registrationSection: document.getElementById('registrationSection'),
    registerBtn: document.getElementById('registerBtn'),
    registrationStatus: document.getElementById('registrationStatus'),
    candidatesGrid: document.getElementById('candidatesGrid'),
    resultsSection: document.getElementById('resultsSection'),
    winnerCard: document.getElementById('winnerCard'),
    voteModal: document.getElementById('voteModal'),
    selectedCandidateInfo: document.getElementById('selectedCandidateInfo'),
    confirmVote: document.getElementById('confirmVote'),
    cancelVote: document.getElementById('cancelVote'),
    closeModal: document.getElementById('closeModal'),
    txModal: document.getElementById('txModal'),
    txIcon: document.getElementById('txIcon'),
    txTitle: document.getElementById('txTitle'),
    txMessage: document.getElementById('txMessage'),
    txHash: document.getElementById('txHash')
};

async function init() {
    console.log('🗳️ Initializing Voting DApp (Mock Mode)...');
    
    // Load saved data first
    web3Helper.loadFromStorage();
    
    setupEventListeners();
    
    const account = await web3Helper.getAccount();
    if (account) {
        await handleWalletConnected(account);
    } else {
        // Still load election data even without wallet
        await loadElectionData();
    }
}

function setupEventListeners() {
    elements.connectWallet.addEventListener('click', connectWallet);
    elements.registerBtn.addEventListener('click', registerVoter);
    elements.confirmVote.addEventListener('click', confirmVote);
    elements.cancelVote.addEventListener('click', closeVoteModal);
    elements.closeModal.addEventListener('click', closeVoteModal);
    
    elements.voteModal.addEventListener('click', (e) => {
        if (e.target === elements.voteModal) closeVoteModal();
    });
}

async function connectWallet() {
    try {
        showTxModal('pending', 'Cüzdan Oluşturuluyor', 'Sahte cüzdan oluşturuluyor...');
        
        const { account, chainId } = await web3Helper.connectWallet();
        
        closeTxModal();
        await handleWalletConnected(account);
        
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        showTxModal('error', 'Bağlantı Hatası', error.message);
        setTimeout(closeTxModal, 2000);
    }
}

async function handleWalletConnected(account) {
    updateWalletUI(account);
    web3Helper.initContract();
    await loadVoterStatus();
    await loadElectionData();
}

function updateWalletUI(account) {
    if (account) {
        elements.connectWallet.innerHTML = `
            <span class="wallet-icon">💰</span>
            <span class="wallet-text">${web3Helper.formatAddress(account)}</span>
        `;
        elements.connectWallet.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        
        elements.networkBadge.classList.remove('disconnected');
        elements.networkBadge.querySelector('.network-name').textContent = 
            web3Helper.getNetworkName(web3Helper.chainId);
    } else {
        elements.connectWallet.innerHTML = `
            <span class="wallet-icon">💰</span>
            <span class="wallet-text">Cüzdan Oluştur</span>
        `;
        elements.connectWallet.style.background = '';
        
        elements.networkBadge.classList.add('disconnected');
        elements.networkBadge.querySelector('.network-name').textContent = 'Bağlantı Yok';
    }
}

async function loadElectionData() {
    try {
        // Reload from storage to get latest data
        web3Helper.loadFromStorage();
        
        electionStatus = await web3Helper.getElectionStatus();
        candidates = await web3Helper.getAllCandidates();
        
        console.log('Election Status:', electionStatus);
        console.log('Candidates:', candidates);
        
        updateElectionUI();
        renderCandidates();
        startTimer();
        
    } catch (error) {
        console.error('Failed to load election data:', error);
    }
}

async function loadVoterStatus() {
    if (!web3Helper.account) return;
    
    try {
        voterStatus = await web3Helper.getVoterStatus();
        updateRegistrationUI();
    } catch (error) {
        console.error('Failed to load voter status:', error);
    }
}

function updateElectionUI() {
    if (!electionStatus) return;
    
    elements.electionName.textContent = electionStatus.name || 'Genel Seçim 2024';
    elements.electionDescription.textContent = electionStatus.description || 'Blockchain tabanlı güvenli oylama sistemi';
    elements.totalVoters.textContent = electionStatus.voterCount || 0;
    elements.totalVotes.textContent = electionStatus.totalVotes || 0;
    elements.candidateCount.textContent = electionStatus.candidateCount || 0;
    
    updateVotingStatus();
    
    if (electionStatus.ended) {
        showResults();
    }
}

function updateVotingStatus() {
    const statusEl = elements.votingStatus;
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
    if (!web3Helper.account) {
        elements.registrationSection.style.display = 'block';
        elements.registerBtn.textContent = 'Önce Cüzdan Oluşturun';
        elements.registerBtn.disabled = true;
        return;
    }
    
    if (voterStatus && voterStatus.isRegistered) {
        elements.registrationSection.style.display = 'none';
    } else {
        elements.registrationSection.style.display = 'block';
        elements.registerBtn.textContent = 'Seçmen Olarak Kayıt Ol';
        elements.registerBtn.disabled = false;
    }
}

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

function renderCandidates() {
    if (!candidates || candidates.length === 0) {
        elements.candidatesGrid.innerHTML = `
            <div class="loading-state">
                <p>Henüz aday eklenmedi</p>
                <p style="font-size: 14px; margin-top: 8px;">Admin panelinden aday ekleyebilirsiniz</p>
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
        
        const canVote = web3Helper.account && 
                        voterStatus && voterStatus.isRegistered && 
                        !voterStatus.hasVoted && 
                        electionStatus && electionStatus.started && 
                        !electionStatus.ended;
        
        const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🧔', '👱'];
        const avatar = candidate.imageUrl || avatars[index % avatars.length];
        
        return `
            <div class="candidate-card ${isVoted ? 'voted' : ''}" data-id="${candidate.id}">
                <div class="candidate-image">
                    ${candidate.imageUrl 
                        ? `<img src="${candidate.imageUrl}" alt="${candidate.name}">`
                        : `<span style="font-size: 48px;">${avatar}</span>`
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

function selectCandidate(candidateId) {
    selectedCandidate = candidates.find(c => c.id === candidateId);
    if (!selectedCandidate) return;
    
    const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🧔', '👱'];
    const avatar = selectedCandidate.imageUrl || avatars[(candidateId - 1) % avatars.length];
    
    elements.selectedCandidateInfo.innerHTML = `
        <div class="candidate-avatar" style="font-size: 48px;">${avatar}</div>
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
    showTxModal('pending', 'İşlem Bekleniyor', 'Oy kaydediliyor...');
    
    try {
        const tx = await web3Helper.vote(selectedCandidate.id);
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blok oluşturuluyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Oy Kullanıldı! 🎉', 
            `${selectedCandidate.name} adayına oyunuz başarıyla kaydedildi.`);
        
        await loadVoterStatus();
        await loadElectionData();
        
        setTimeout(closeTxModal, 3000);
        
    } catch (error) {
        console.error('Vote failed:', error);
        showTxModal('error', 'İşlem Başarısız', error.message || 'Bir hata oluştu');
    }
}

async function registerVoter() {
    if (!web3Helper.account) {
        alert('Lütfen önce cüzdan oluşturun');
        return;
    }
    
    showTxModal('pending', 'Kayıt Yapılıyor', 'İşlem simüle ediliyor...');
    
    try {
        const tx = await web3Helper.registerVoter();
        
        showTxModal('pending', 'İşlem Onaylanıyor', 'Blok oluşturuluyor...');
        
        await tx.wait();
        
        showTxModal('success', 'Kayıt Başarılı! ✅', 'Artık oy kullanabilirsiniz.');
        
        await loadVoterStatus();
        await loadElectionData();
        
        setTimeout(closeTxModal, 3000);
        
    } catch (error) {
        console.error('Registration failed:', error);
        showTxModal('error', 'Kayıt Başarısız', error.message || 'Bir hata oluştu');
    }
}

async function showResults() {
    elements.resultsSection.style.display = 'block';
    
    try {
        const winner = await web3Helper.getWinner();
        
        elements.winnerCard.innerHTML = `
            <span class="winner-badge">🏆 Kazanan</span>
            <h2 class="winner-name">${winner.name}</h2>
            <p class="winner-votes">${winner.voteCount} oy ile seçimi kazandı</p>
        `;
    } catch (error) {
        console.error('Failed to load winner:', error);
    }
}

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

window.selectCandidate = selectCandidate;

document.addEventListener('DOMContentLoaded', init);