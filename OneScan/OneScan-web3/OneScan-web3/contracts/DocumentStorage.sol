// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentStorage {
    // Custom errors
    error DocumentAlreadyExists(bytes32 docId);
    error DocumentDoesNotExist(bytes32 docId);
    error InvalidInput();
    error UnauthorizedAccess();
    error EmptyArrayInput();
    error ArrayLengthMismatch();

    struct Document {
        string name;
        string description;
        string docType;
        string category;
        string fileCID; // IPFS/Filecoin CID
        uint256 createdAt;
        address owner;
        bool exists;  // To check if document exists
    }

    mapping(bytes32 => Document) public documents; // Store documents by unique hash
    event DocumentAdded(bytes32 indexed docId, address indexed owner, string name);

    // Mapping to store bank account numbers
    mapping(address => string) private bankAccountNumbers;

    // Structure for custom fields
    struct CustomFields {
        string[] fieldNames;
        string[] fieldValues;
        uint256 timestamp;
    }

    // Mapping to store custom fields for each user
    mapping(address => CustomFields) public userCustomFields;

    // Event for custom fields updates
    event CustomFieldsUpdated(address indexed user, uint256 timestamp);

    // Modifiers
    modifier documentExists(bytes32 _docId) {
        if (!documents[_docId].exists) {
            revert DocumentDoesNotExist(_docId);
        }
        _;
    }

    modifier documentDoesNotExist(bytes32 _docId) {
        if (documents[_docId].exists) {
            revert DocumentAlreadyExists(_docId);
        }
        _;
    }

    modifier validString(string memory str) {
        if (bytes(str).length == 0) {
            revert InvalidInput();
        }
        _;
    }

    function addDocument(
        bytes32 _docId,
        string memory _name,
        string memory _description,
        string memory _docType,
        string memory _category,
        string memory _fileCID
    ) public 
        documentDoesNotExist(_docId)
        validString(_name)
        validString(_docType)
        validString(_category)
        validString(_fileCID)
    {
        documents[_docId] = Document({
            name: _name,
            description: _description,
            docType: _docType,
            category: _category,
            fileCID: _fileCID,
            createdAt: block.timestamp,
            owner: msg.sender,
            exists: true
        });
        
        emit DocumentAdded(_docId, msg.sender, _name);
    }

    function getDocument(bytes32 _docId) public view 
        documentExists(_docId)
        returns (
            string memory name,
            string memory description,
            string memory docType,
            string memory category,
            string memory fileCID,
            uint256 createdAt,
            address owner
        ) 
    {
        Document storage doc = documents[_docId];
        return (
            doc.name,
            doc.description,
            doc.docType,
            doc.category,
            doc.fileCID,
            doc.createdAt,
            doc.owner
        );
    }

    function storeCustomFields(
        string[] memory fieldNames,
        string[] memory fieldValues
    ) public {
        // Input validation
        if (fieldNames.length == 0 || fieldValues.length == 0) {
            revert EmptyArrayInput();
        }
        if (fieldNames.length != fieldValues.length) {
            revert ArrayLengthMismatch();
        }

        // Validate each field name and value
        for (uint i = 0; i < fieldNames.length; i++) {
            if (bytes(fieldNames[i]).length == 0 || bytes(fieldValues[i]).length == 0) {
                revert InvalidInput();
            }
        }

        userCustomFields[msg.sender] = CustomFields({
            fieldNames: fieldNames,
            fieldValues: fieldValues,
            timestamp: block.timestamp
        });

        emit CustomFieldsUpdated(msg.sender, block.timestamp);
    }

    function getCustomFields(address user) public view returns (
        string[] memory fieldNames,
        string[] memory fieldValues,
        uint256 timestamp
    ) {
        CustomFields storage fields = userCustomFields[user];
        return (fields.fieldNames, fields.fieldValues, fields.timestamp);
    }

    // Optional: Add function to check if a document exists
    function isDocumentExists(bytes32 _docId) public view returns (bool) {
        return documents[_docId].exists;
    }

    // Optional: Add function to get document count for an owner
    function getDocumentCount(address owner) public view returns (uint256 count) {
        for (uint i = 0; i < type(uint256).max; i++) {
            bytes32 docId = bytes32(i);
            if (!documents[docId].exists) {
                break;
            }
            if (documents[docId].owner == owner) {
                count++;
            }
        }
        return count;
    }
} 