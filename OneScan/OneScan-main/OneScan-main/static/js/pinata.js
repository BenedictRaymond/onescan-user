class PinataAPI {
    constructor() {
        this.baseUrl = 'https://api.pinata.cloud';
        // You'll need to replace these with your actual Pinata API keys
        this.apiKey = '1b0d045e1102e876c826';
        this.apiSecret = 'f55bd5e05d74ebbd12088acbea371810af07d33b40d867b561f25e65c20d4995';
        this.JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwZDJmM2MyZC05MWQzLTQwMGUtYjNlYi03MTY3YzJiNzU4NTYiLCJlbWFpbCI6ImJlbmVkaWN0cmF5bW9uZDIxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIxYjBkMDQ1ZTExMDJlODc2YzgyNiIsInNjb3BlZEtleVNlY3JldCI6ImY1NWJkNWUwNWQ3NGViYmQxMjA4OGFjYmVhMzcxODEwYWYwN2QzM2I0MGQ4NjdiNTYxZjI1ZTY1YzIwZDQ5OTUiLCJleHAiOjE3NzIyODk4Nzh9.2TaxmkBpcW8Dsfiax7HYqDN_8u6O-LNisTaFbNuDvcw';
    }

    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            formData.append('pinataMetadata', JSON.stringify({
                name: file.name,
                keyvalues: {
                    type: file.type,
                    size: file.size
                }
            }));

            const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                ipfsHash: data.IpfsHash,
                gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading to Pinata:', error);
            throw error;
        }
    }

    async testAuthentication() {
        try {
            const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
                headers: {
                    'Authorization': `Bearer ${this.JWT}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Authentication test failed:', error);
            return false;
        }
    }
} 