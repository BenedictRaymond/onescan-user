// Add these constants at the top of your file, before the DOMContentLoaded event
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // Chain ID for Sepolia testnet
const SEPOLIA_NETWORK_CONFIG = {
    chainId: SEPOLIA_CHAIN_ID,
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'SEP',
        decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// Initialize Web3 (will be set when needed)
let web3 = null;

// Function to initialize Web3
async function initializeWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        // Use the new recommended way to initialize Web3
        web3 = new Web3(window.ethereum);
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            return true;
        } catch (error) {
            console.error('User denied account access');
            return false;
        }
    } else {
        console.error('Please install MetaMask!');
        return false;
    }
}

// Add this function to check and switch networks
async function ensureSepoliaNetwork() {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        // Initialize Web3 if not already initialized
        if (!web3) {
            web3 = new Web3(window.ethereum);
        }

        // Check current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        if (chainId !== SEPOLIA_CHAIN_ID) {
            try {
                // Try to switch to Sepolia
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [SEPOLIA_NETWORK_CONFIG],
                        });
                    } catch (addError) {
                        throw new Error('Failed to add Sepolia network to MetaMask');
                    }
                } else {
                    throw new Error('Please switch to Sepolia Test Network in MetaMask');
                }
            }
        }
    } catch (error) {
        console.error('Network switch error:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Web3 when the page loads
    try {
        await initializeWeb3();
    } catch (error) {
        console.error('Failed to initialize Web3:', error);
    }

    const walletPrompt = document.getElementById('walletPrompt');
    const uploadForm = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const documentForm = document.getElementById('documentForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const responseSection = document.getElementById('responseSection');
    const responseDetails = document.getElementById('responseDetails');
    const docCategory = document.getElementById('docCategory');
    const docType = document.getElementById('docType');

    // Check initial wallet state
    checkWalletConnection();

    // Listen for wallet connection events
    window.addEventListener('walletConnected', (event) => {
        showUploadForm();
    });

    window.addEventListener('walletDisconnected', () => {
        hideUploadForm();
    });

    function checkWalletConnection() {
        if (window.userWalletAddress) {
            showUploadForm();
        } else {
            hideUploadForm();
        }
    }

    function showUploadForm() {
        walletPrompt.classList.add('hidden');
        uploadForm.classList.remove('hidden');
    }

    function hideUploadForm() {
        walletPrompt.classList.remove('hidden');
        uploadForm.classList.add('hidden');
    }

    // Initialize form state
        let selectedFile = null;
        let documentTypes = {};

        // Fetch document types from API
        fetch('/api/document-types')
            .then(response => response.json())
            .then(data => {
                documentTypes = data;
                // Populate categories dropdown
                Object.keys(data).forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    docCategory.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching document types:', error));

        // Handle category selection
    docCategory?.addEventListener('change', function (e) {
            const category = e.target.value;
        if (!docType) return;
        
            docType.innerHTML = '<option value="">Select Document Type</option>';
            docType.disabled = !category;

            if (category && documentTypes[category]) {
                Object.entries(documentTypes[category]).forEach(([name, value]) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = name;
                    docType.appendChild(option);
                });
            }
        });

    // Handle drag and drop
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

        function highlight(e) {
        dropZone?.classList.add('border-blue-500', 'bg-blue-50');
        }

        function unhighlight(e) {
        dropZone?.classList.remove('border-blue-500', 'bg-blue-50');
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFile(file);
        }

    // Handle file selection
    fileInput?.addEventListener('change', function(e) {
            const file = e.target.files[0];
            handleFile(file);
        });

        function handleFile(file) {
            if (!file) return;
        
        // Check file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showError('File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
            return;
        }

            selectedFile = file;
        updateFileInfo(file);
    }

    // Handle form submission
    documentForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!selectedFile || !docType.value || !docCategory.value) {
            showError('Please select a document type, category, and file.');
            return;
        }

        try {
            // Ensure Web3 is initialized and we're on Sepolia network
            await ensureSepoliaNetwork();

            if (!web3) {
                throw new Error('Web3 is not initialized');
            }

            uploadBtn.disabled = true;
            progressContainer.classList.remove('hidden');
            progressBar.style.width = '0%';
            progressStatus.textContent = 'Preparing upload...';

            // Initialize Pinata
            const pinata = new PinataAPI();
            
            // Step 1: Upload to IPFS via Pinata
            progressStatus.textContent = 'Uploading to IPFS...';
            progressBar.style.width = '30%';
            
            const pinataResponse = await pinata.uploadFile(selectedFile);
            if (!pinataResponse.success) {
                throw new Error('Failed to upload to IPFS');
            }

            progressBar.style.width = '60%';
            progressStatus.textContent = 'Storing in blockchain...';

            // Step 2: Store CID in blockchain
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Generate a unique document ID (using timestamp and random number)
            const timestamp = Date.now().toString();
            const randomNum = Math.floor(Math.random() * 1000000).toString();
            const docId = web3.utils.sha3(timestamp + randomNum);
            
            const receipt = await contract.methods.addDocument(
                docId,
                selectedFile.name,
                'Uploaded via OneScan',
                docType.value,
                docCategory.value,
                pinataResponse.ipfsHash
            ).send({ 
                from: window.userWalletAddress,
                gasLimit: 500000 // Set a reasonable gas limit
            });

            if (!receipt.status) {
                throw new Error('Blockchain transaction failed');
            }

            progressBar.style.width = '90%';
            progressStatus.textContent = 'Finalizing...';

            // Step 3: Create form data for backend record
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('docType', docType.value);
            formData.append('category', docCategory.value);
            formData.append('ipfsHash', pinataResponse.ipfsHash);
            formData.append('txHash', receipt.transactionHash);
            formData.append('docId', docId);

            // Step 4: Update backend
            const response = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Backend update failed');
            }

            // Show success
            progressBar.style.width = '100%';
            progressStatus.textContent = 'Upload complete!';
            showResponse({
                success: true,
                message: 'Document uploaded successfully',
                data: {
                    docType: docType.value,
                    category: docCategory.value,
                    ipfsHash: pinataResponse.ipfsHash,
                    ipfsUrl: pinataResponse.gatewayUrl,
                    txHash: receipt.transactionHash,
                    docId: docId
                }
            });

        } catch (error) {
            console.error('Upload error:', error);
            progressBar.classList.add('bg-red-500');
            progressBar.style.width = '100%';
            progressStatus.textContent = 'Error: ' + (error.message || 'Upload failed');
            showError(error.message || 'Failed to upload document');
        } finally {
            uploadBtn.disabled = false;
        }
    });

    // Helper functions
    function updateFileInfo(file) {
        if (!fileInfo) return;

        fileInfo.classList.remove('hidden');
            fileInfo.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">${file.name}</span>
                <span class="text-gray-500">(${formatFileSize(file.size)})</span>
                </div>
            `;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

    function showError(message) {
        if (!responseSection || !responseDetails) return;
        
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center">
                        <svg class="h-6 w-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="font-medium text-red-600">Error</span>
                    </div>
                <div class="bg-red-50 border border-red-200 p-4 rounded-lg text-sm">
                        <p class="text-red-700">${message}</p>
                    </div>
                </div>
            `;
        }

        function showResponse(response) {
        if (!responseSection || !responseDetails) return;
        
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center">
                        <svg class="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="font-medium text-green-600">Success!</span>
                    </div>
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg text-sm">
                    <p class="text-gray-700">${response.message}</p>
                    ${response.data ? `
                        <div class="mt-2 pt-2 border-t border-green-100">
                            <p class="text-sm text-gray-600">Document Type: ${response.data.docType}</p>
                            <p class="text-sm text-gray-600">Category: ${response.data.category}</p>
                            <p class="text-sm text-gray-600">IPFS Hash: ${response.data.ipfsHash}</p>
                            <p class="text-sm text-gray-600">
                                <a href="${response.data.ipfsUrl}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                    View on IPFS
                                </a>
                            </p>
                            <p class="text-sm text-gray-600">
                                <a href="https://sepolia.etherscan.io/tx/${response.data.txHash}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                    View Transaction
                            </a>
                        </p>
                        </div>
                    ` : ''}
                    </div>
                </div>
            `;
    }
}); 