/**
 * ============================================
 * FRONTEND CONFIGURATION
 * ============================================
 * Contract address and ABI configuration
 */

const CONFIG = {
    // Contract will be loaded from server
    CONTRACT_ADDRESS: null,
    CONTRACT_ABI: null,

    // Network configurations
    NETWORKS: {
        // Localhost (Hardhat/Ganache)
        localhost: {
            chainId: '0x7A69', // 31337
            chainName: 'Localhost',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
            }
        },
        // Ganache
        ganache: {
            chainId: '0x539', // 1337
            chainName: 'Ganache',
            rpcUrls: ['http://127.0.0.1:7545'],
            nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
            }
        },
        // Volta Testnet
        volta: {
            chainId: '0x12047', // 73799
            chainName: 'Volta Testnet',
            rpcUrls: ['https://volta-rpc.energyweb.org'],
            nativeCurrency: {
                name: 'VT',
                symbol: 'VT',
                decimals: 18
            },
            blockExplorerUrls: ['https://volta-explorer.energyweb.org']
        },
        // Sepolia Testnet
        sepolia: {
            chainId: '0xAA36A7', // 11155111
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'ETH',
                decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
        }
    },

    // Default avatars for candidates
    DEFAULT_AVATARS: ['👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍⚖️', '👩‍⚖️', '🧑‍💻', '👨‍🏫'],

    // API endpoints
    API: {
        CONTRACT: '/api/contract',
        ELECTION_STATUS: '/api/election/status',
        CANDIDATES: '/api/candidates',
        ELECTION_TIME: '/api/election/time',
        WINNER: '/api/election/winner'
    }
};

/**
 * Load contract configuration from server
 */
async function loadContractConfig() {
    try {
        const response = await fetch(CONFIG.API.CONTRACT);
        const data = await response.json();
        
        CONFIG.CONTRACT_ADDRESS = data.address;
        CONFIG.CONTRACT_ABI = data.abi;
        
        console.log('✅ Contract config loaded:', CONFIG.CONTRACT_ADDRESS);
        return true;
    } catch (error) {
        console.error('❌ Failed to load contract config:', error);
        return false;
    }
}

// Make available globally
window.CONFIG = CONFIG;
window.loadContractConfig = loadContractConfig;
