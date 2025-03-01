// Initialize variables
let walletDisplay, walletStatus, walletAddress, toast, toastMessage;

// Initialize elements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    walletDisplay = document.getElementById('walletDisplay');
    walletStatus = document.getElementById('walletStatus');
    walletAddress = document.getElementById('walletAddress');
    toast = document.getElementById('toast');
    toastMessage = document.getElementById('toastMessage');
    
    // Initialize wallet handler
    const walletHandler = new WalletHandler();

    // Add click handler to wallet button
    walletDisplay?.addEventListener('click', async () => {
        if (!walletHandler.isConnected) {
            try {
                await walletHandler.connectWallet();
            } catch (error) {
                console.error("Failed to connect wallet:", error);
                // Show error to user
                alert(error.message);
            }
        }
    });

    // Initialize when page loads
    checkMetaMask();
});

// Check if MetaMask is installed and initialize wallet
async function checkMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                updateWalletDisplay(accounts[0]);
            } else {
                showDisconnectedState();
            }
        } catch (error) {
            console.error("Error checking MetaMask:", error);
            showDisconnectedState();
        }
    } else {
        showMetaMaskNotInstalledState();
    }
}

// Update wallet display with address
function updateWalletDisplay(address) {
    if (!walletDisplay || !walletStatus || !walletAddress) return;
    
    walletStatus.textContent = "Connected";
    walletAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    walletDisplay.classList.remove('bg-red-50');
    walletDisplay.classList.add('bg-blue-50');
    
    // Store the address globally
    window.userWalletAddress = address;
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address } }));
}

class WalletHandler {
    constructor() {
        this.isConnected = false;
        this.userAddress = null;
        this.init();
    }

    async init() {
        if (typeof window.ethereum !== 'undefined') {
            // Handle account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    this.userAddress = accounts[0];
                    this.isConnected = true;
                    this.updateUI(true, accounts[0]);
                } else {
                    this.isConnected = false;
                    this.userAddress = null;
                    this.updateUI(false);
                }
            });

            // Handle chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                // Reload the page when chain changes
                window.location.reload();
            });

            // Check if already connected
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.userAddress = accounts[0];
                    this.isConnected = true;
                    this.updateUI(true, accounts[0]);
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
            }
        }
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Switch to Sepolia network
                await this.switchToSepolia();

                this.userAddress = accounts[0];
                this.isConnected = true;
                this.updateUI(true, accounts[0]);
                return accounts[0];
            } catch (error) {
                console.error("Error connecting wallet:", error);
                throw error;
            }
        } else {
            throw new Error('Please install MetaMask!');
        }
    }

    async switchToSepolia() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia Test Network',
                            nativeCurrency: {
                                name: 'SepoliaETH',
                                symbol: 'SEP',
                                decimals: 18
                            },
                            rpcUrls: ['https://rpc.sepolia.org'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                } catch (addError) {
                    throw addError;
                }
            }
            throw switchError;
        }
    }

    updateUI(isConnected, address = null) {
        const walletBtn = document.getElementById('walletDisplay');
        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');

        if (isConnected && address) {
            walletStatus.textContent = 'Connected';
            walletAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
            walletBtn.classList.add('connected');
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address } }));
        } else {
            walletStatus.textContent = 'Connect Wallet';
            walletAddress.textContent = 'Not Connected';
            walletBtn.classList.remove('connected');
            window.dispatchEvent(new CustomEvent('walletDisconnected'));
        }
    }
}

// Show toast message
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Clear any existing timeouts
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }

    toastMessage.textContent = message;

    // Show toast
    toast.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');

    // Set timeout to hide the toast
    window.toastTimeout = setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    }, duration);
}

// Show disconnected state
function showDisconnectedState() {
    walletStatus.textContent = "Connect Wallet";
    walletAddress.textContent = "Not Connected";
    walletDisplay.classList.remove('bg-blue-50');
    walletDisplay.classList.add('bg-red-50');

    // Update the tooltip text
    const walletActionText = document.getElementById('walletActionText');
    if (walletActionText) {
        walletActionText.textContent = 'connect';
    }

    window.userWalletAddress = null;

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
}

// Show MetaMask not installed state
function showMetaMaskNotInstalledState() {
    walletStatus.textContent = "MetaMask Not Installed";
    walletAddress.textContent = "Not Available";
    walletDisplay.classList.remove('bg-blue-50');
    walletDisplay.classList.add('bg-red-50');
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
            updateWalletDisplay(accounts[0]);
        } else {
            // If user disconnected through MetaMask
            showDisconnectedState();
        }
    });

    // Handle chain changes
    window.ethereum.on('chainChanged', function () {
        // Refresh the page on chain change
        window.location.reload();
    });
} 