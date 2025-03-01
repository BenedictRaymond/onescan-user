document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const walletPrompt = document.getElementById('walletPrompt');
    const mainContent = document.getElementById('mainContent');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const noFieldsState = document.getElementById('noFieldsState');
    const fieldsDisplay = document.getElementById('fieldsDisplay');
    const fieldsTableBody = document.getElementById('fieldsTableBody');
    const refreshButton = document.getElementById('refreshButton');

    // Initialize state
    let isLoading = false;

    // Listen for wallet connection events
    window.addEventListener('walletConnected', (event) => {
        walletPrompt.classList.add('hidden');
        mainContent.classList.remove('hidden');
        fetchFields();
    });

    window.addEventListener('walletDisconnected', () => {
        walletPrompt.classList.remove('hidden');
        mainContent.classList.add('hidden');
    });

    // Add refresh button handler
    refreshButton?.addEventListener('click', () => {
        if (!isLoading) {
            fetchFields();
        }
    });

    // Check initial wallet state
    if (window.userWalletAddress) {
        walletPrompt.classList.add('hidden');
        mainContent.classList.remove('hidden');
        fetchFields();
    }

    async function fetchFields() {
        if (!window.userWalletAddress) return;

        showLoadingState();

        try {
            // Initialize Web3 and contract
            const web3 = new Web3(window.ethereum);
            
            // Ensure the address is properly formatted
            let formattedAddress;
            try {
                formattedAddress = web3.utils.toChecksumAddress(window.userWalletAddress);
            } catch (error) {
                console.error('Invalid address format:', error);
                showErrorState('Invalid wallet address format');
                return;
            }

            // Initialize contract with ABI and address
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            // Get custom fields for the connected wallet
            const result = await contract.methods.getCustomFields(formattedAddress).call();

            console.log('Contract response:', result); // Debug log

            // Process the results
            const fieldNames = result.fieldNames || []; // Using property names from the contract
            const fieldValues = result.fieldValues || [];
            const timestamp = result.timestamp || '0';

            if (!fieldNames || fieldNames.length === 0) {
                showNoFieldsState();
                return;
            }

            // Display the fields
            displayFields(fieldNames, fieldValues, timestamp);
            showFieldsDisplay();

        } catch (error) {
            console.error('Error fetching fields:', error);
            let errorMsg = 'Failed to load fields. ';
            if (error.message.includes('call revert exception')) {
                errorMsg += 'No fields found for this address.';
            } else {
                errorMsg += error.message;
            }
            showErrorState(errorMsg);
        }
    }

    function displayFields(fieldNames, fieldValues, timestamp) {
        fieldsTableBody.innerHTML = '';

        fieldNames.forEach((name, index) => {
            // Create a new row for each field
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${fieldValues[index]}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatTimestamp(timestamp)}
                </td>
            `;
            fieldsTableBody.appendChild(row);
        });

        // If no fields were added, show no fields state
        if (fieldNames.length === 0) {
            showNoFieldsState();
        }
    }

    function formatTimestamp(timestamp) {
        if (!timestamp || timestamp === '0') return 'N/A';
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // State management functions
    function showLoadingState() {
        isLoading = true;
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        noFieldsState.classList.add('hidden');
        fieldsDisplay.classList.add('hidden');
    }

    function showErrorState(message) {
        isLoading = false;
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        noFieldsState.classList.add('hidden');
        fieldsDisplay.classList.add('hidden');
        errorMessage.textContent = message || 'Failed to load fields. Please try again.';
    }

    function showNoFieldsState() {
        isLoading = false;
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        noFieldsState.classList.remove('hidden');
        fieldsDisplay.classList.add('hidden');
    }

    function showFieldsDisplay() {
        isLoading = false;
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        noFieldsState.classList.add('hidden');
        fieldsDisplay.classList.remove('hidden');
    }
}); 