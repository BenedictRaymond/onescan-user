document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const walletPrompt = document.getElementById('walletPrompt');
    const uploadForm = document.getElementById('uploadForm');
    const documentForm = document.getElementById('documentForm');
    const fieldsForm = document.getElementById('fieldsForm');
    const documentTypeBtn = document.getElementById('documentTypeBtn');
    const fieldsTypeBtn = document.getElementById('fieldsTypeBtn');
    const addFieldBtn = document.getElementById('addFieldBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const responseSection = document.getElementById('responseSection');
    const responseDetails = document.getElementById('responseDetails');

    let currentUploadType = 'document';
    let selectedFile = null;

    // Initialize wallet connection handlers
    initializeWalletHandlers();

    // Initialize form handlers
    initializeFormHandlers();

    function initializeWalletHandlers() {
        // Check initial wallet state
        if (window.userWalletAddress) {
            showUploadForm();
        }

        // Listen for wallet connection events
        window.addEventListener('walletConnected', () => {
            showUploadForm();
        });

        window.addEventListener('walletDisconnected', () => {
            hideUploadForm();
        });
    }

    function initializeFormHandlers() {
        // Document form specific handlers
        initializeDocumentForm();

        // Fields form specific handlers
        initializeFieldsForm();

        // Upload button handler
        uploadBtn.addEventListener('click', handleUpload);
    }

    function switchUploadType(type) {
        currentUploadType = type;
        
        // Update button styles
        documentTypeBtn.classList.toggle('active-upload-type', type === 'document');
        fieldsTypeBtn.classList.toggle('active-upload-type', type === 'fields');
        
        // Show/hide appropriate form
        documentForm.classList.toggle('hidden', type !== 'document');
        fieldsForm.classList.toggle('hidden', type !== 'fields');
        
        // Update upload button text
        uploadBtn.querySelector('span').textContent = `Upload ${type === 'document' ? 'Document' : 'Fields'}`;
    }

    async function handleUpload(e) {
        e.preventDefault();

        if (currentUploadType === 'document') {
            await handleDocumentUpload();
        } else {
            await handleFieldsUpload();
        }
    }

    async function handleDocumentUpload() {
        if (!selectedFile || !docType.value || !docCategory.value) {
            showError('Please select a document type, category, and file.');
            return;
        }

        try {
            await ensureSepoliaNetwork();
            showProgress('Uploading document...');

            // Upload to IPFS via Pinata
            const pinata = new PinataAPI();
            const pinataResponse = await pinata.uploadFile(selectedFile);
            
            updateProgress(50, 'Storing in blockchain...');

            // Store in blockchain
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            const docId = web3.utils.sha3(Date.now().toString());
            
            const receipt = await contract.methods.addDocument(
                docId,
                selectedFile.name,
                'Uploaded via OneScan',
                docType.value,
                docCategory.value,
                pinataResponse.ipfsHash
            ).send({ from: window.userWalletAddress });

            showSuccess('Document uploaded successfully!', {
                docType: docType.value,
                category: docCategory.value,
                ipfsHash: pinataResponse.ipfsHash,
                txHash: receipt.transactionHash
            });

        } catch (error) {
            showError(error.message);
        }
    }

    async function handleFieldsUpload() {
        const fieldPairs = document.querySelectorAll('.field-pair');
        const fieldNames = [];
        const fieldValues = [];

        fieldPairs.forEach(pair => {
            const name = pair.querySelector('.field-name').value.trim();
            const value = pair.querySelector('.field-value').value.trim();
            
            if (name && value) {
                fieldNames.push(name);
                fieldValues.push(value);
            }
        });

        if (fieldNames.length === 0) {
            showError('Please add at least one field.');
            return;
        }

        try {
            await ensureSepoliaNetwork();
            showProgress('Storing fields in blockchain...');

            const contract = new web3.eth.Contract(contractABI, contractAddress);
            const receipt = await contract.methods.storeCustomFields(
                fieldNames,
                fieldValues
            ).send({ from: window.userWalletAddress });

            showSuccess('Fields stored successfully!', {
                fieldsCount: fieldNames.length,
                txHash: receipt.transactionHash
            });

        } catch (error) {
            showError(error.message);
        }
    }

    // Helper functions for UI management
    function showUploadForm() {
        walletPrompt.classList.add('hidden');
        uploadForm.classList.remove('hidden');
    }

    function hideUploadForm() {
        walletPrompt.classList.remove('hidden');
        uploadForm.classList.add('hidden');
    }

    function showProgress(message) {
        progressContainer.classList.remove('hidden');
        progressStatus.textContent = message;
        progressBar.style.width = '0%';
    }

    function updateProgress(percent, message) {
        progressBar.style.width = `${percent}%`;
        if (message) {
            progressStatus.textContent = message;
        }
    }

    function showSuccess(message, details) {
        progressContainer.classList.add('hidden');
        responseSection.classList.remove('hidden');
        
        let detailsHtml = '';
        for (const [key, value] of Object.entries(details)) {
            detailsHtml += `
                <div class="flex justify-between py-2">
                    <span class="text-sm font-medium text-gray-500">${key}:</span>
                    <span class="text-sm text-gray-900">${value}</span>
                </div>
            `;
        }

        responseDetails.innerHTML = `
            <div class="flex items-center mb-4">
                <svg class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="font-medium text-green-600">${message}</span>
            </div>
            ${detailsHtml}
        `;
    }

    function showError(message) {
        progressContainer.classList.add('hidden');
        responseSection.classList.remove('hidden');
        responseDetails.innerHTML = `
            <div class="flex items-center">
                <svg class="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="font-medium text-red-600">${message}</span>
            </div>
        `;
    }
}); 