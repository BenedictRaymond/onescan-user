import Web3 from 'web3';
import DocumentStorageAPI from '../graphql/documentApi';

// Example of how to decode and view document transaction data
async function decodeDocumentExample() {
  try {
    // Initialize Web3 (you would need to replace this with your provider)
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
    
    // Initialize the DocumentStorageAPI
    // Option 1: Using Web3 provider
    const api = new DocumentStorageAPI(web3);
    
    // Option 2: Using Infura (uncomment and add your project ID)
    /*
    const api = new DocumentStorageAPI(null, {
      projectId: 'YOUR_INFURA_PROJECT_ID',
      network: 'sepolia' // or 'mainnet', 'polygon', etc.
    });
    */

    // Example transaction hash - replace with your actual transaction hash
    const txHash = '0xb38b93359be02ce941329d83e2d5f15becd180de51cdb9955b6a8fbdd692263c'; // Replace with your transaction hash

    // Method 1: Just decode the transaction data
    console.log('\n1. Decoding transaction data...');
    const decodedData = await api.decodeTransactionData(txHash);
    console.log('Decoded document data:', {
      docId: decodedData.docId,
      name: decodedData.name,
      description: decodedData.description,
      docType: decodedData.docType,
      category: decodedData.category,
      fileCID: decodedData.fileCID
    });

    // Method 2: Get both decoded data and current document state
    console.log('\n2. Getting full document information...');
    const fullDocInfo = await api.getDocumentFromTransaction(txHash);
    console.log('Original transaction data:', fullDocInfo.decodedTransaction);
    console.log('Current document state:', fullDocInfo.documentOnChain);

  } catch (error) {
    console.error('Error in decode example:', error);
  }
}

// Example of creating a document and then decoding its transaction
async function createAndDecodeExample() {
  try {
    // Initialize Web3 and get accounts
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
    const accounts = await web3.eth.getAccounts();
    const fromAddress = accounts[0];

    // Initialize API
    const api = new DocumentStorageAPI(web3);

    // 1. Create a new document
    console.log('\n1. Creating new document...');
    const createResult = await api.createDocument(
      'Example Document',
      'This is a test document',
      'PDF',
      'Test',
      'QmExample123',
      fromAddress
    );
    console.log('Document created:', createResult);

    // 2. Decode the transaction we just created
    console.log('\n2. Decoding the creation transaction...');
    const documentInfo = await api.getDocumentFromTransaction(createResult.transactionHash);
    console.log('Decoded document information:', documentInfo);

  } catch (error) {
    console.error('Error in create and decode example:', error);
  }
}

// Run the examples
const runExamples = async () => {
  console.log('Running decode example...');
  await decodeDocumentExample();
  
  console.log('\nRunning create and decode example...');
  await createAndDecodeExample();
};

// Execute if running directly
if (require.main === module) {
  runExamples().then(() => process.exit(0));
}

export { decodeDocumentExample, createAndDecodeExample }; 