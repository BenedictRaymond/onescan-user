import express from 'express';
import cors from 'cors';
import createDocument from './api/documentApiExample.js';
import DocumentStorageAPI from './api/documentApi.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// POST endpoint to create document
app.post('/api/documents', async (req, res) => {
    try {
        const { docType, category, fileCID } = req.body;
        const name = "";
        const description = "";
        
        // Validate required fields
        if (!docType || !category || !fileCID) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await createDocument(
            name,
            description,
            docType,
            category,
            fileCID
        );

        res.json(result);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET endpoint to get document details from transaction hash
app.get('/api/documents/transaction/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;

        if (!process.env.INFURA_PROJECT_ID) {
            return res.status(500).json({
                success: false,
                error: 'INFURA_PROJECT_ID not configured'
            });
        }

        // Initialize API with Infura
        const infuraConfig = {
            projectId: process.env.INFURA_PROJECT_ID,
            network: 'sepolia'
        };
        
        const api = new DocumentStorageAPI(null, infuraConfig);

        const result = await api.getDocumentFromTransaction(txHash);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting document details:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET endpoint to get all transactions by owner address
app.get('/api/documents/owner/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!process.env.INFURA_PROJECT_ID) {
            return res.status(500).json({
                success: false,
                error: 'INFURA_PROJECT_ID not configured'
            });
        }

        if (!process.env.ETHERSCAN_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'ETHERSCAN_API_KEY not configured'
            });
        }

        // Initialize API with Infura
        const infuraConfig = {
            projectId: process.env.INFURA_PROJECT_ID,
            network: 'sepolia'
        };
        
        const api = new DocumentStorageAPI(null, infuraConfig);

        const { transactions, pagination } = await api.getTransactionsByOwner(address, page, limit);

        // Try to decode input data for each transaction
        const decodedTransactions = await Promise.all(transactions.map(async (tx) => {
            try {
                const decodedData = await api.decodeTransactionDataByTx(tx);
                return {
                    ...tx,
                    decodedData
                };
            } catch (error) {
                // If decoding fails, return transaction without decoded data
                return tx;
            }
        }));

        res.json({
            success: true,
            data: {
                transactions: decodedTransactions,
                pagination
            }
        });
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 