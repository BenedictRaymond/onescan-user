document.addEventListener('DOMContentLoaded', function () {
    const fieldsContainer = document.getElementById('fieldsContainer');
    const addFieldBtn = document.getElementById('addFieldBtn');
    const customFieldsForm = document.getElementById('customFieldsForm');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const responseSection = document.getElementById('responseSection');
    const responseDetails = document.getElementById('responseDetails');

    let contract = null;

    // Initialize contract when needed
    async function getContract() {
        if (!contract) {
            contract = await initializeContract();
        }
        return contract;
    }

    // Add new field button handler
    addFieldBtn.addEventListener('click', () => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'flex space-x-4 items-start';
        const fieldCount = fieldsContainer.children.length;

        fieldDiv.innerHTML = `
            <div class="flex-1">
                <input type="text" name="field_name_${fieldCount}" placeholder="Field Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
            </div>
            <div class="flex-1">
                <input type="text" name="field_value_${fieldCount}" placeholder="Field Value" class="w-full p-3 border border-gray-300 rounded-lg" required>
            </div>
            <button type="button" class="text-red-500 p-3" onclick="this.parentElement.remove()">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        fieldsContainer.appendChild(fieldDiv);
    });

    // Form submission
    customFieldsForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            progressContainer.classList.remove('hidden');
            progressBar.style.width = '30%';
            progressStatus.textContent = 'Connecting to wallet...';

            // Get contract instance
            const contractInstance = await getContract();

            // Get field values
            const fieldNames = [];
            const fieldValues = [];
            const inputs = fieldsContainer.getElementsByTagName('input');

            for (let i = 0; i < inputs.length; i += 2) {
                fieldNames.push(inputs[i].value);
                fieldValues.push(inputs[i + 1].value);
            }

            if (fieldNames.length === 0) {
                throw new Error('Please add at least one field');
            }

            progressBar.style.width = '60%';
            progressStatus.textContent = 'Storing fields...';

            // Get current account
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            const account = accounts[0];

            // Store custom fields
            const result = await contractInstance.methods.storeCustomFields(fieldNames, fieldValues)
                .send({ from: account });

            // Show success
            progressBar.style.width = '100%';
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="text-green-600">
                    <p>Transaction successful!</p>
                    <p>Transaction hash: ${result.transactionHash}</p>
                    <a href="https://sepolia.etherscan.io/tx/${result.transactionHash}" 
                       target="_blank" 
                       class="text-blue-500 hover:text-blue-600">
                        View on Etherscan
                    </a>
                </div>
            `;

        } catch (error) {
            console.error('Error:', error);
            progressBar.style.width = '100%';
            progressBar.classList.add('bg-red-500');
            responseSection.classList.remove('hidden');
            responseDetails.innerHTML = `
                <div class="text-red-600">
                    <p>Error: ${error.message || 'Transaction failed'}</p>
                </div>
            `;
        }
    });
}); 