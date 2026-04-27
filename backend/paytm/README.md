# Paytm Backend

## 🎯 Objective
A full-stack banking application backend that handles user authentication, balance management, and secure money transfers between accounts using MongoDB transactions.

## 🛠 Tech Stack
- **Languages:** JavaScript (Node.js)
- **Frameworks/Libraries:** Express.js, JSON Web Tokens (JWT), Zod (Validation), Mongoose
- **Tools:** MongoDB, Postman

## 🧠 Key Learnings
- **Auth Patterns:** Secure signup/signin using JWT and middleware protection.
- **Data Integrity:** Implementing MongoDB sessions and transactions to ensure atomicity in financial transfers.
- **Schema Design:** Linking User and Account schemas with proper ObjectId references.

## 🚀 Run Instructions

### Prerequisites
- Node.js v18+
- MongoDB (Running locally or on Atlas)

### Setup
1. Navigate to this directory:
   ```bash
   cd backend/paytm
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Execution
- Run the application:
   ```bash
   node index.js
   ```

---
*Generated using the SDE2 Learning-chunk Template.*
