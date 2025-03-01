document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const documentsTableBody = document.getElementById('documentsTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const startRange = document.getElementById('startRange');
    const endRange = document.getElementById('endRange');
    const totalItems = document.getElementById('totalItems');
    const itemsPerPage = document.getElementById('itemsPerPage');
    const previewModal = document.getElementById('previewModal');
    const closePreview = document.getElementById('closePreview');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    const viewOnIPFS = document.getElementById('viewOnIPFS');
    const viewOnEtherscan = document.getElementById('viewOnEtherscan');
    const searchInput = document.getElementById('searchInput');
    const currentPageDisplay = document.getElementById('currentPageDisplay');
    const totalPagesDisplay = document.getElementById('totalPagesDisplay');
    const walletPrompt = document.getElementById('walletPrompt');

    // State
    let currentPage = 1;
    let currentFilters = {
        limit: 10,
        search: ''
    };
    let allDocuments = []; // Store all documents for client-side search
    let userWalletAddress = null;

    // Initialize
    init();

    async function init() {
        // Get page from URL if exists
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = parseInt(urlParams.get('page'));
        if (pageParam && !isNaN(pageParam)) {
            currentPage = pageParam;
        }

        const limitParam = parseInt(urlParams.get('limit'));
        if (limitParam && !isNaN(limitParam)) {
            currentFilters.limit = limitParam;
            itemsPerPage.value = limitParam;
        }

        // Check initial wallet state
        if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
            try {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    userWalletAddress = accounts[0];
                }
            } catch (error) {
                console.error('Error checking wallet:', error);
            }
        }

        setupEventListeners();
        fetchDocuments();
    }

    function updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('page', currentPage);
        url.searchParams.set('limit', currentFilters.limit);
        window.history.pushState({}, '', url);
    }

    function setupEventListeners() {
        // Items per page change
        itemsPerPage.addEventListener('change', function(e) {
            currentFilters.limit = parseInt(e.target.value);
            currentPage = 1;
            updateURL();
            fetchDocuments();
        });

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (!prevPageBtn.disabled) {
                currentPage--;
                updateURL();
                fetchDocuments();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (!nextPageBtn.disabled) {
                currentPage++;
                updateURL();
                fetchDocuments();
            }
        });

        // Modal
        closePreview.addEventListener('click', () => {
            previewModal.classList.add('hidden');
        });

        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.classList.add('hidden');
            }
        });

        // Search functionality
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value.toLowerCase();
                currentPage = 1;
                updateURL();
                if (currentFilters.search) {
                    filterAndDisplayDocuments();
                } else {
                    fetchDocuments(); // Fetch from API when search is cleared
                }
            }, 300);
        });
    }

    // Add wallet connection handlers
    window.addEventListener('walletConnected', (event) => {
        userWalletAddress = event.detail.address;
        walletPrompt.classList.add('hidden');
        fetchDocuments(); // Refresh documents with new wallet
    });

    window.addEventListener('walletDisconnected', () => {
        userWalletAddress = null;
        fetchDocuments(); // This will now show the wallet prompt
    });

    async function fetchDocuments() {
        // Always start by hiding all states
        hideLoading();
        hideEmpty();
        documentsTableBody.classList.add('hidden');
        paginationContainer.classList.add('hidden');

        // Check if wallet is connected first
        if (!userWalletAddress) {
            walletPrompt.classList.remove('hidden');
            return;
        }

        // If wallet is connected, proceed with fetching documents
        walletPrompt.classList.add('hidden');
        documentsTableBody.classList.remove('hidden');
        showLoading();

        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: currentFilters.limit
            });
            
            const response = await fetch(`http://localhost:3000/api/documents/owner/${userWalletAddress}?${params}`);
            const data = await response.json();

            if (data.success) {
                const documents = data.data?.transactions || [];
                allDocuments = documents;
                
                if (!documents || documents.length === 0) {
                    hideLoading();
                    showEmpty();
                    return;
                }

                renderDocuments(documents);
                hideEmpty();

                if (data.data.pagination) {
                    updatePagination(data.data.pagination);
                }
            } else {
                throw new Error('Failed to fetch documents');
            }
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            showError();
        }
    }

    function filterAndDisplayDocuments() {
        let filteredDocs = [...allDocuments];

        // Apply search filter
        if (currentFilters.search) {
            filteredDocs = filteredDocs.filter(doc => {
                const searchStr = currentFilters.search.toLowerCase();
                const docType = doc.decodedData.docType.toLowerCase();
                const category = doc.decodedData.category.toLowerCase();
                return docType.includes(searchStr) || category.includes(searchStr);
            });
        }

        // Calculate pagination
        const totalDocs = filteredDocs.length;
        const totalPages = Math.ceil(totalDocs / currentFilters.limit);
        const start = (currentPage - 1) * currentFilters.limit;
        const end = Math.min(start + currentFilters.limit, totalDocs);
        const currentPageDocs = filteredDocs.slice(start, end);

        if (currentPageDocs.length === 0) {
            showEmpty();
            // Keep pagination visible but update the info
            updatePagination({
                currentPage: 1,
                totalPages: 1,
                limit: currentFilters.limit,
                totalTransactions: 0,
                hasNextPage: false,
                hasPreviousPage: false
            });
            return;
        }

        // Update UI
        renderDocuments(currentPageDocs);
        hideEmpty();
        
        // Update pagination with calculated values
        updatePagination({
            currentPage,
            totalPages: Math.max(1, totalPages), // Ensure at least 1 page
            limit: currentFilters.limit,
            totalTransactions: totalDocs,
            hasNextPage: end < totalDocs,
            hasPreviousPage: currentPage > 1
        });
    }

    function formatDocumentTitle(docType) {
        // Remove underscores and convert to title case
        return docType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    function renderDocuments(documents) {
        if (!documents || !documents.length) {
            showEmpty();
            return;
        }

        hideLoading();
        hideEmpty();
        documentsTableBody.innerHTML = '';

        documents.forEach(doc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-semibold text-gray-900">${formatDocumentTitle(doc.decodedData.docType)}</div>
                            <div class="text-xs text-gray-500">${formatDate(doc.timeStamp)}</div>
                            <div class="text-xs text-gray-400 mt-1 font-mono">${doc.decodedData.fileCID.slice(0, 6)}...${doc.decodedData.fileCID.slice(-4)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${doc.decodedData.category}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="showPreview('${doc.hash}', ${JSON.stringify(doc.decodedData).replace(/"/g, '&quot;')})" 
                            class="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>View</span>
                    </button>
                </td>
            `;
            documentsTableBody.appendChild(tr);
        });
    }

    function updatePagination({ currentPage, totalPages, limit, totalTransactions, hasNextPage, hasPreviousPage }) {
        // Update text displays
        startRange.textContent = totalTransactions === 0 ? 0 : ((currentPage - 1) * limit) + 1;
        endRange.textContent = Math.min(currentPage * limit, totalTransactions);
        totalItems.textContent = totalTransactions;
        currentPageDisplay.textContent = currentPage;
        totalPagesDisplay.textContent = totalPages;

        // Update button states based on API response
        prevPageBtn.disabled = !hasPreviousPage;
        nextPageBtn.disabled = !hasNextPage;

        // Always show pagination container, but disable buttons if needed
        paginationContainer.classList.remove('hidden');

        // Update page numbers
        pageNumbers.innerHTML = '';
        
        // Show limited page numbers with ellipsis
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page if not visible
        if (startPage > 1) {
            addPageButton(1);
            if (startPage > 2) {
                addEllipsis();
            }
        }

        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i);
        }

        // Add last page if not visible
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                addEllipsis();
            }
            addPageButton(totalPages);
        }
    }

    function addPageButton(pageNum) {
        const button = document.createElement('button');
        button.className = `relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            pageNum === currentPage 
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }`;
        button.textContent = pageNum;
        button.onclick = () => {
            if (pageNum !== currentPage) {
                currentPage = pageNum;
                updateURL();
                fetchDocuments();
            }
        };
        pageNumbers.appendChild(button);
    }

    function addEllipsis() {
        const span = document.createElement('span');
        span.className = 'px-2 text-gray-500';
        span.textContent = '...';
        pageNumbers.appendChild(span);
    }

    function showPreview(hash, data) {
        previewTitle.textContent = formatDocumentTitle(data.docType);
        
        // Format date safely
        const formattedDate = data.timeStamp ? formatDate(data.timeStamp) : 'N/A';
        
        previewContent.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h4 class="font-medium text-gray-700 mb-4">Document Information</h4>
                    <dl class="grid grid-cols-2 gap-6">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Category</dt>
                            <dd class="mt-1 text-sm text-gray-900">${data.category || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Document Type</dt>
                            <dd class="mt-1 text-sm text-gray-900">${formatDocumentTitle(data.docType) || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Upload Date</dt>
                            <dd class="mt-1 text-sm text-gray-900">${formattedDate}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Transaction</dt>
                            <dd class="mt-1 text-sm text-gray-900 font-mono">${hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : 'N/A'}</dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-sm font-medium text-gray-500">IPFS Hash</dt>
                            <dd class="mt-1 text-sm text-gray-900 font-mono break-all">${data.fileCID || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm text-blue-900">Your document is stored on IPFS and can be accessed through multiple gateways. Choose your preferred method below:</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="https://gateway.pinata.cloud/ipfs/${data.fileCID}" target="_blank" 
                       class="flex items-center justify-center px-4 py-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                        <svg class="h-5 w-5 text-blue-500 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Download via Pinata</span>
                    </a>
                    <a href="https://ipfs.io/ipfs/${data.fileCID}" target="_blank"
                       class="flex items-center justify-center px-4 py-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                        <svg class="h-5 w-5 text-blue-500 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">View on IPFS.io</span>
                    </a>
                </div>
            </div>
        `;

        if (data.fileCID) {
            viewOnIPFS.href = `https://gateway.pinata.cloud/ipfs/${data.fileCID}`;
        }
        if (hash) {
            viewOnEtherscan.href = `https://sepolia.etherscan.io/tx/${hash}`;
        }
        previewModal.classList.remove('hidden');
    }

    function getDocumentTypeName(category, type) {
        if (documentTypes[category]) {
            const entry = Object.entries(documentTypes[category]).find(([_, value]) => value === type);
            if (entry) {
                // Convert snake_case to Title Case
                return entry[0].split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }
        }
        // Convert snake_case to Title Case if no match found
        return type.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp * 1000);
            if (isNaN(date.getTime())) return 'N/A';
            
            return new Intl.DateTimeFormat('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            }).format(date);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    }

    function showLoading() {
        loadingState.classList.remove('hidden');
        documentsTableBody.classList.add('hidden');
        emptyState.classList.add('hidden');
        paginationContainer.classList.add('hidden');
    }

    function hideLoading() {
        loadingState.classList.add('hidden');
        documentsTableBody.classList.remove('hidden');
    }

    function showEmpty() {
        // Only show empty state if wallet is connected
        if (userWalletAddress) {
            emptyState.classList.remove('hidden');
            documentsTableBody.classList.add('hidden');
            paginationContainer.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            walletPrompt.classList.remove('hidden');
        }
    }

    function hideEmpty() {
        emptyState.classList.add('hidden');
    }

    function showError() {
        // You can implement error state UI here
        hideLoading();
        documentsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-600">
                    Failed to load documents. Please try again later.
                </td>
            </tr>
        `;
    }

    // Expose the showPreview function globally
    window.showPreview = showPreview;
}); 