# OneScan

OneScan is a secure document verification system that combines QR code technology with blockchain-based verification to ensure document authenticity and integrity.

## Project Structure

```
OneScan/
├── OneScan-web3/     # Blockchain integration components
├── OneScan-main/     # Main application code
└── instance/         # Instance-specific configurations

uploads/              # Directory for uploaded documents
instance/            # Application instance data
```

## Features

- Secure document verification using QR codes
- Blockchain-based authenticity verification
- Document upload and management
- Real-time verification status

## Prerequisites

- Python (with virtual environment)
- Node.js and npm
- Git

## Website Images

![WhatsApp Image 2025-03-01 at 07 51 02_084d87df](https://github.com/user-attachments/assets/db5d8831-9d01-4c8f-98ba-9ddbf8de05b7)

![WhatsApp Image 2025-03-01 at 07 51 30_661fa4cb](https://github.com/user-attachments/assets/4830c16d-c76d-4473-9c51-07a794060713)

![WhatsApp Image 2025-03-01 at 07 53 52_72749490](https://github.com/user-attachments/assets/ed54e9d8-e31a-4988-afac-a84cee57a2e5)

![WhatsApp Image 2025-03-01 at 07 53 26_e3d4b6e8](https://github.com/user-attachments/assets/f569234c-b579-4508-bc62-8d51046defe9)


## Dependencies

### Python Dependencies
- Virtual environment (.venv)

### Node.js Dependencies
- circomlib (^2.0.5) - Zero-knowledge proof circuits library
- snarkjs (^0.7.5) - zk-SNARK implementation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/BenedictRaymond/onescan-user.git
cd onescan-user
```

2. Set up Python virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install Node.js dependencies:
```bash
npm install
```

## Configuration

1. Create a `.env` file in the root directory with necessary environment variables:
```
# Add your environment variables here
```

## Usage

[Add specific usage instructions here]

## Development

The project uses a `.gitignore` file to exclude:
- Python virtual environment (.venv/)
- Python cache files (__pycache__/, *.pyc)
- Environment variables (.env)
- System files (.DS_Store)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

[Add license information here]

## Contact

Project Link: [https://github.com/BenedictRaymond/onescan-user](https://github.com/BenedictRaymond/onescan-user) 
