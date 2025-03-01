import requests

payload = {
    "name": "Test Doc",
    "description": "Test Description",
    "docType": "pdf", 
    "category": "test",
    "fileCID": "QmTest123"
}

response = requests.post(
    "http://localhost:3000/api/documents",
    json=payload,
    headers={"Content-Type": "application/json"}
)

print(response.json())
