# OneScan Web3 API

OneScan is a decentralized document sharing platform that leverages blockchain technology to ensure secure, transparent, and immutable document storage. This repository contains the Web3 integration component that enables interaction with the blockchain network.

## 🌟 Features

| Feature | Description |
|---------|------------|
| Document Creation | Store documents on the blockchain with metadata |
| Document Retrieval | Fetch documents using various search criteria |
| Ownership Tracking | Track document ownership through blockchain addresses |
| Category Management | Organize documents by categories |
| Type Classification | Classify documents by types |

## 📄 Document Properties

Each document in the system contains the following properties:

| Property | Description |
|----------|------------|
| `docId` | Unique identifier for the document |
| `name` | Name of the document |
| `description` | Description of the document content |
| `docType` | Type classification of the document |
| `category` | Category the document belongs to |
| `fileCID` | Content Identifier for the document file |
| `owner` | Blockchain address of the document owner |
| `createdAt` | Timestamp of document creation |

## 🔍 Available Operations

The API supports the following operations:

| Operation | Description |
|-----------|------------|
| Create Document | Add a new document to the blockchain |
| Get All Documents | Retrieve all documents stored in the system |
| Get Document by ID | Fetch a specific document using its ID |
| Get Documents by Owner | Retrieve all documents owned by a specific address |


## 🔗 Blockchain Integration

The system is integrated with:
- Ethereum-compatible networks (Mainnet, Goerli, Sepolia)
- Polygon networks (Mainnet, Mumbai)
- TheGraph for efficient data indexing and querying

## 📊 Data Structure

Documents are stored with a robust data structure that ensures:
- Unique identification through keccak256 hashing
- Secure ownership verification
- Efficient retrieval through indexed properties
- Permanent storage on the blockchain 