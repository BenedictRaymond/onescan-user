// Add this struct for storing field history
struct FieldHistory {
    string[] fieldNames;
    string[] fieldValues;
    uint256 timestamp;
}

// Modify the mapping to store an array of CustomFields
mapping(address => FieldHistory[]) public userFieldsHistory;

// Add a function to get the field history
function getFieldsHistory(address user) public view returns (
    string[][] memory fieldNames,
    string[][] memory fieldValues,
    uint256[] memory timestamps
) {
    FieldHistory[] storage history = userFieldsHistory[user];
    uint256 length = history.length;
    
    fieldNames = new string[][](length);
    fieldValues = new string[][](length);
    timestamps = new uint256[](length);
    
    for(uint256 i = 0; i < length; i++) {
        fieldNames[i] = history[i].fieldNames;
        fieldValues[i] = history[i].fieldValues;
        timestamps[i] = history[i].timestamp;
    }
    
    return (fieldNames, fieldValues, timestamps);
}

// Modify the storeCustomFields function
function storeCustomFields(string[] memory fieldNames, string[] memory fieldValues) public {
    require(fieldNames.length == fieldValues.length, "Arrays length mismatch");
    require(fieldNames.length > 0, "Empty arrays not allowed");
    
    // Add new entry to history
    userFieldsHistory[msg.sender].push(FieldHistory({
        fieldNames: fieldNames,
        fieldValues: fieldValues,
        timestamp: block.timestamp
    }));
    
    emit CustomFieldsUpdated(msg.sender, block.timestamp);
} 