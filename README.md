# Retail Inventory, Sales & Purchase Automation System

### **Team Members**
- **Kushal Kumar C S** — *PES1UG23CS320*
- **Kushal Jantli** — *PES1UG23CS319*

**College:** PES University  
**Department:** Computer Science & Engineering  
**Course:** UE23CS351A — Database Management Systems (DBMS)

---

## GitHub Repository
https://github.com/kushalkumarcs372/Retail-Inventory-Sales-Purchase-Automation-System

## 📌 Project Overview
This project implements a complete **Retail Inventory, Sales & Purchase Automation System** designed to automate major operations of a retail store. It supports customer management, product cataloging, inventory updates, sales processing, billing, supplier management, and employee operations.  
All core business logic is implemented in **MySQL** using *triggers, procedures, views,* and *functions*, while the backend uses **Node.js + Express**, and the frontend uses **React.js**.

---

## 🚀 Features

### 🛒 Sales & Billing
- Add items to cart  
- Automatic sale generation  
- Automatic bill creation  
- Stock deduction via triggers  
- Payment modes: Cash, Card, UPI  

### 📦 Inventory Management
- Auto-update stock on purchases and sales  
- Product catalog with brand, stock, price details  

### 🧾 Purchase Management
- Add purchase orders  
- Auto-restock inventory  

### 👥 Customer & Membership
- Customer database  
- Multiple emails per customer  
- Membership levels (Gold/Silver/Platinum)

### 👨‍💼 Employee Module
- Track employee details, salary, role  
- Supervisor hierarchy maintained  

### ⚙️ Database Automation
- Triggers (stock validation, salary validation, membership date validation)  
- Stored Procedures (cart handling, checkout system)  
- Functions (sale total, customer total spent)  
- Views (analytics)

---

## 🏗 Tech Stack

### **Frontend**
- React.js  
- Axios  

### **Backend**
- Node.js  
- Express.js  
- MySQL2 Driver  

### **Database**
- MySQL  
- Triggers  
- Stored Procedures  
- Functions  
- Views  

---

## 📂 Project Folder Structure
Retail-Inventory-Sales-Purchase-Automation-System/
│
├── backend/
│ ├── server.js
│ ├── db/connection.js
│ ├── routes/
│ ├── uploads/products/
│ └── package.json
│
├── frontend/
│ ├── src/
│ └── package.json
│
├── database/
│ ├── schema.sql
│ ├── data.sql
│ ├── triggers.sql
│ ├── procedures.sql
│ ├── functions.sql
│ ├── views.sql
│
├── docs/
│ └── er_diagram_screenshot.png
│
└── README.md
