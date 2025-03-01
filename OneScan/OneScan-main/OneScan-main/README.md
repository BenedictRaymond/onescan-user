# **OneScan – Secure & Seamless Data Sharing**  
🚀 **No Forms. No Paper. Just Scan!**  

---

## **📌 About OneScan**  
In today's digital world, people still manually fill forms at banks, hospitals, and colleges. **OneScan** eliminates this hassle by allowing users to securely store and share their data with just a **QR scan**.  

🔒 **Blockchain-secured** | ⚡ **Instant Data Sharing** | 🔑 **User-Controlled Privacy**  

---
## **Demo**


![image](https://github.com/user-attachments/assets/ab76f010-7f38-44ce-8af0-9b4f4f755e19)


## **🛠 Tech Stack**

**Solidity** – Smart contract development
**IPFS (Pinata)** – Decentralized file storage
**HTML, CSS, JS **– Frontend / Backend technologies
**Truffle** – Smart contract testing & deployment
**Ganache** – Local blockchain for development
 

---

## **🎯 Key Features**  
✅ **Decentralized & Secure Storage** – Documents stored off-chain, while metadata is secured on **Ethereum Blockchain**.  
✅ **QR-Based Instant Data Transfer** – Organizations create forms as **QR codes**, and users **scan to share**.  
✅ **User Privacy & Control** – Users decide **what to share** and **who can access it**.  
✅ **Tamper-Proof** – Blockchain ensures **data integrity** and prevents unauthorized changes.  

---

## **📌 How OneScan Works?**  
![image](https://github.com/user-attachments/assets/7b61a3d5-bdd6-4b96-9cca-16e51befeb79)
  

---

## **🚀 Installation & Setup**  

### **1️⃣ Clone the Repository**  
```bash
git clone https://github.com/yourusername/OneScan.git
cd OneScan
```

### **2️⃣ Install Dependencies**  
#### **Backend (Flask)**
```bash
pip install -r requirements.txt
```
#### **Smart Contracts (Truffle)**
```bash
npm install -g truffle
npm install
```

### **3️⃣ Start Ganache & Deploy Smart Contracts**  
1. Open **Ganache** and create a workspace.  
2. Deploy contracts using Truffle:  
```bash
truffle migrate --network development
```

### **4️⃣ Run Backend Server**  
```bash
python app.py
```

### **5️⃣ Start Frontend**  
Open `index.html` in a browser or run a simple local server:  
```bash
python -m http.server 8000
```
Access at: **`http://localhost:8000`**  

---

## **📜 Smart Contracts Used**  
📌 **UserStorage.sol** – Stores **user identity & verification hash**.  
📌 **DocumentStorage.sol** – Handles **file hashes & categories**.  
📌 **DataRequest.sol** – Logs **organization requests & approvals**.  

---

## **🤝 Contributors**  
👨‍💻 **Maria Kevin** - [GitHub](https://github.com/kevinnadar22)
👨‍💻 **Benedict Raymond** - [GitHub](https://github.com/BenedictRaymond)

---

## **📜 License**  
MIT License - Free to use & modify.  

---
