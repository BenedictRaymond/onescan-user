import DocumentStorageAPI from '../api/documentApi.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API function to create a document
async function createDocument(name, description, docType, category, fileCID) {
    try {
        if (!process.env.INFURA_PROJECT_ID) {
            throw new Error('Please set INFURA_PROJECT_ID in your .env file');
        }

        // Initialize with Infura
        const infuraConfig = {
            projectId: process.env.INFURA_PROJECT_ID,
            network: 'sepolia'
        };
        
        const api = new DocumentStorageAPI(null, infuraConfig);

        // Return the transaction data that needs to be signed by the user
        const txData = await api.getCreateDocumentTransaction(
            name,
            description, 
            docType,
            category,
            fileCID
        );

        return {
            success: true,
            txData
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

export default createDocument;