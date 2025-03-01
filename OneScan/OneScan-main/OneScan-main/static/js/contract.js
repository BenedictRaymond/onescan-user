// Contract ABI
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_docId",
                "type": "bytes32"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_docType",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_category",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_fileCID",
                "type": "string"
            }
        ],
        "name": "addDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string[]",
                "name": "fieldNames",
                "type": "string[]"
            },
            {
                "internalType": "string[]",
                "name": "fieldValues",
                "type": "string[]"
            }
        ],
        "name": "storeCustomFields",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "getCustomFields",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "fieldNames",
                "type": "string[]"
            },
            {
                "internalType": "string[]",
                "name": "fieldValues",
                "type": "string[]"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Contract address (keep your deployed address)
const contractAddress = "0xe564aba6f771fc9b2f0c2b13abbdd09549b41c1a";

// Initialize Web3 and Contract
async function initializeContract() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask!');
    }

    try {
        const web3 = new Web3(window.ethereum);

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Try to switch to Sepolia
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }] // Sepolia chain ID
            });
        } catch (switchError) {
            // Handle chain switch error or chain not added
            if (switchError.code === 4902) {
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
            }
        }

        // Create contract instance
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    } catch (error) {
        console.error('Contract initialization error:', error);
        throw error;
    }
} 