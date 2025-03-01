// Only define QRScanner if it hasn't been defined yet
if (typeof window.QRScanner === 'undefined') {
    window.QRScanner = class {
        constructor() {
            console.log('QRScanner constructor called');
            this.initializeElements();
        }

        async initializeElements() {
            console.log('Initializing elements...');
            this.video = document.getElementById('qrVideo');
            this.scanResult = document.getElementById('scanResult');
            this.scanResultText = document.getElementById('scanResultText');
            this.switchCameraBtn = document.getElementById('switchCamera');
            this.toggleFlashBtn = document.getElementById('toggleFlash');

            if (!this.video) {
                console.error('Video element not found during initialization');
                return;
            }

            this.stream = null;
            this.scanning = false;
            this.scanInterval = null;
            this.currentCamera = 'environment';

            // Initialize contract
            try {
                // Check if MetaMask is installed
                if (typeof window.ethereum === 'undefined') {
                    throw new Error('Please install MetaMask to use this feature');
                }

                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('Please connect your wallet to use this feature');
                }

                // Initialize contract
                this.contract = await initializeContract();
                if (!this.contract) {
                    throw new Error('Failed to initialize contract');
                }

                console.log('Contract initialized successfully');
                this.init();
            } catch (error) {
                console.error('Contract initialization error:', error);
                this.showError(`Wallet connection required: ${error.message}`);
                return;
            }
        }

        async init() {
            console.log('Initializing QR Scanner...');
            try {
                if (!this.video) {
                    console.error('Video element not found!');
                    return;
                }

                // Add camera control event listeners
                if (this.switchCameraBtn) {
                    this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
                }
                if (this.toggleFlashBtn) {
                    this.toggleFlashBtn.addEventListener('click', () => this.toggleFlash());
                }

                // Check for camera support
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera API is not supported in your browser');
                }

                // Start camera
                await this.startScanning();
                console.log('Camera started successfully');
            } catch (error) {
                console.error('Failed to initialize scanner:', error);
                this.showError(`Camera initialization failed: ${error.message}`);
            }
        }

        showError(message) {
            if (this.scanResultText) {
                this.scanResultText.innerHTML =
                    '<div class="text-center p-4">' +
                    '<svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>' +
                    '</svg>' +
                    `<p class="mt-2 text-lg font-semibold text-red-600">${message}</p>` +
                    '<button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Try Again</button>' +
                    '</div>';
            }
        }

        async startScanning() {
            console.log('Starting camera...');
            try {
                const constraints = {
                    video: {
                        facingMode: this.currentCamera,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };

                console.log('Requesting camera access with constraints:', constraints);
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);

                console.log('Camera access granted, setting up video stream');
                this.video.srcObject = this.stream;

                // Wait for video to be ready
                await new Promise((resolve) => {
                    this.video.onloadedmetadata = () => {
                        console.log('Video metadata loaded');
                        resolve();
                    };
                });

                console.log('Starting video playback');
                await this.video.play();

                this.scanning = true;
                console.log('Starting QR code scanning');

                // Start continuous scanning
                this.scanInterval = setInterval(() => {
                    if (this.scanning) {
                        this.scan();
                    }
                }, 200);

            } catch (error) {
                console.error('Camera access error:', error);
                let errorMessage = 'Unable to access camera. ';

                if (error.name === 'NotAllowedError') {
                    errorMessage += 'Please grant camera permissions and reload the page.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage += 'No camera found on your device.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage += 'Camera is already in use by another application.';
                } else {
                    errorMessage += error.message;
                }

                this.showError(errorMessage);
                throw new Error(errorMessage);
            }
        }

        async stopScanning() {
            this.scanning = false;
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
        }

        async scan() {
            if (!this.video || !this.scanning) return;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;

            // Draw current video frame
            context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

            try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    // Stop scanning once we find a QR code
                    await this.stopScanning();
                    await this.handleQRData(code.data);
                }
            } catch (error) {
                console.error('QR scanning error:', error);
            }
        }

        async handleQRData(data) {
            try {
                // Ensure wallet is connected
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('Please connect your wallet first');
                }

                // Parse the QR code data
                const jsonData = JSON.parse(data);
                console.log('Scanned data:', jsonData);

                // Show the result section
                if (this.scanResult) {
                    this.scanResult.classList.remove('hidden');
                }

                // Get blockchain data
                const blockchainData = await this.getBlockchainData();

                // Show data preview UI
                if (this.scanResultText) {
                    // Create a mapping of blockchain field names to values
                    const blockchainFieldMap = {};
                    if (blockchainData.fieldNames) {
                        blockchainData.fieldNames.forEach((name, index) => {
                            blockchainFieldMap[name.toLowerCase()] = blockchainData.fieldValues[index];
                        });
                    }

                    this.scanResultText.innerHTML = `
                        <div class="p-6 bg-white rounded-lg shadow-lg">
                            <h2 class="text-2xl font-bold mb-4 text-gray-800">Blockchain Data Preview</h2>
                            
                            <!-- Form Details Section -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold mb-2 text-gray-700">Wallet Information</h3>
                                <div class="bg-gray-50 p-4 rounded-md">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="col-span-2">
                                            <span class="font-medium text-gray-600">Wallet Address:</span>
                                            <span class="ml-2 text-gray-800">${accounts[0]}</span>
                                        </div>
                                        <div class="col-span-2">
                                            <span class="font-medium text-gray-600">Last Updated:</span>
                                            <span class="ml-2 text-gray-800">${new Date(blockchainData.timestamp * 1000).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Blockchain Data Section -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold mb-2 text-gray-700">Stored Fields</h3>
                                <div class="bg-gray-50 rounded-md">
                                    <div class="grid grid-cols-1">
                                        ${blockchainData.fieldNames ? 
                                            blockchainData.fieldNames.map((name, index) => `
                                                <div class="p-4 border-b border-gray-200">
                                                    <div class="grid grid-cols-2 gap-4">
                                                        <div class="text-gray-600 font-medium">${name}</div>
                                                        <div class="text-gray-800">${blockchainData.fieldValues[index] || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            `).join('') 
                                            : 
                                            '<div class="p-4 text-center text-gray-500">No data found in blockchain</div>'
                                        }
                                    </div>
                                </div>
                            </div>

                            <!-- Scanned QR Data Section -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold mb-2 text-gray-700">New Scanned Data</h3>
                                <div class="bg-gray-50 rounded-md">
                                    <div class="grid grid-cols-1">
                                        ${jsonData.fields ? 
                                            jsonData.fields.map(field => `
                                                <div class="p-4 border-b border-gray-200">
                                                    <div class="grid grid-cols-2 gap-4">
                                                        <div class="text-gray-600 font-medium">${field.name}</div>
                                                        <div class="text-gray-800">${field.value || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            `).join('')
                                            :
                                            '<div class="p-4 text-center text-gray-500">No data in QR code</div>'
                                        }
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex justify-center space-x-4 mt-6">
                                <button onclick="location.reload()" class="px-8 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-lg">
                                    Cancel
                                </button>
                                <button id="confirmTransfer" class="px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-lg">
                                    Update Data
                                </button>
                            </div>
                        </div>
                    `;

                    // Add event listener for confirm button
                    document.getElementById('confirmTransfer').addEventListener('click', async () => {
                        try {
                            // Show processing state
                            this.scanResultText.innerHTML = `
                                <div class="p-4">
                                    <div class="animate-pulse flex space-x-4 items-center justify-center">
                                        <div class="h-3 w-3 bg-blue-500 rounded-full"></div>
                                        <div class="h-3 w-3 bg-blue-500 rounded-full"></div>
                                        <div class="h-3 w-3 bg-blue-500 rounded-full"></div>
                                    </div>
                                    <p class="mt-2 text-center text-gray-600">Storing data in database...</p>
                                </div>
                            `;

                            // Send data to organization's database
                            const response = await fetch('/api/transfer-data', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    formData: jsonData,
                                    blockchainData: blockchainData,
                                    walletAddress: accounts[0]
                                })
                            });

                            const result = await response.json();
                            if (!result.success) {
                                throw new Error(result.error || 'Failed to store data in database');
                            }

                            // Show success message
                            this.scanResultText.innerHTML = `
                                <div class="text-center p-4">
                                    <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <p class="mt-2 text-lg font-semibold">Success!</p>
                                    <p class="text-gray-600">Data has been stored in the database.</p>
                                    <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                        Scan Another
                                    </button>
                                </div>
                            `;
                        } catch (error) {
                            console.error('Error storing data:', error);
                            this.showError(error.message);
                        }
                    });
                }

            } catch (error) {
                console.error('Error processing QR data:', error);
                if (this.scanResultText) {
                    this.scanResultText.innerHTML =
                        '<div class="text-center p-4">' +
                        '<svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>' +
                        '</svg>' +
                        `<p class="mt-2 text-lg font-semibold text-red-600">Error: ${error.message}</p>` +
                        '<button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Try Again</button>' +
                        '</div>';
                }
            }
        }

        async getBlockchainData() {
            if (!this.contract) {
                // Try to get the contract from the window object
                if (window.contract) {
                    this.contract = window.contract;
                } else {
                    throw new Error('Contract not initialized. Please connect your wallet first.');
                }
            }

            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('No wallet connected. Please connect your wallet first.');
                }
                const userAddress = accounts[0];

                // Get user's custom fields from blockchain
                const fields = await this.contract.methods.getCustomFields(userAddress).call();
                return fields;
            } catch (error) {
                console.error('Error fetching blockchain data:', error);
                throw new Error('Failed to fetch data from blockchain: ' + error.message);
            }
        }

        async switchCamera() {
            this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
            await this.stopScanning();
            await this.startScanning();
        }

        async toggleFlash() {
            if (!this.stream) return;

            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();

            if (capabilities.torch) {
                const torchState = !track.getSettings().torch;
                try {
                    await track.applyConstraints({
                        advanced: [{ torch: torchState }]
                    });
                    this.toggleFlashBtn.classList.toggle('bg-blue-200', torchState);
                } catch (error) {
                    console.error('Flash control error:', error);
                }
            } else {
                alert('Your device does not support flash control');
            }
        }
    };
}

// Initialize QR Scanner when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask to use this feature');
        }

        // Initialize wallet first
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error('Please connect your wallet to use this feature');
        }

        // Initialize QR Scanner
        if (typeof window.QRScanner !== 'undefined') {
            window.qrScanner = new window.QRScanner();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        const scanResultText = document.getElementById('scanResultText');
        if (scanResultText) {
            scanResultText.innerHTML = `
                <div class="text-center p-4">
                    <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <p class="mt-2 text-lg font-semibold text-red-600">${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Try Again</button>
                </div>
            `;
        }
    }
}); 