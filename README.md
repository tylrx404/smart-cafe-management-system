☕ Smart Cafe Management System
Digital Point of Sale & Cafe Operations Platform

🏆 Developed during the Adani × Odoo National Hackathon

A modern full-stack restaurant management platform that digitizes cafe operations through secure authentication, order management, kitchen workflow automation, payment tracking, analytics, and intelligent menu recommendations.

📖 Overview

Traditional cafes often rely on manual workflows for taking orders, managing tables, and coordinating between customers, kitchen staff, and administrators. These processes can lead to delays, order errors, and limited operational insights.

The Smart Cafe Management System provides a centralized digital platform that streamlines the complete cafe workflow while improving efficiency, security, and customer experience.

🚀 Problem Statement

Modern cafeterias require:

Faster order processing
Digital customer experience
Efficient kitchen management
Secure staff authentication
Business analytics
Better operational visibility

Most small and medium cafes still depend on manual processes that increase service time and reduce operational efficiency.

💡 Solution

The platform connects customers, kitchen staff, and administrators through a unified digital system.

Key capabilities include:

Secure customer authentication
Digital ordering system
Kitchen workflow management
Order tracking
Table management
Payment management
Dashboard analytics
Intelligent food recommendations

## 🏗️ System Architecture

```text
                    Customer
                        │
                        ▼
          React + TypeScript Frontend
                        │
                 REST API Requests
                        ▼
             Express.js Backend
      ┌──────────┼──────────┐
      ▼          ▼          ▼
 Authentication SQLite DB Recommendation
      │          │         Engine
      └──────────┴──────────┘
               │
               ▼
     Admin & Kitchen Dashboard
```

✨ Features
👤 Customer
-Secure Signup & Login
-Browse Digital Menu
-Place Orders
View Order History
Intelligent Menu Recommendations
Personalized Dashboard
👨‍🍳 Kitchen Staff
Kitchen Display System
Live Incoming Orders
Update Order Status
Order Queue Management
👨‍💼 Administrator
Dashboard Analytics
Revenue Overview
Order Management
Table Management
Payment Monitoring
Business Insights
🔒 Security Features
JWT Authentication
Password Hashing using bcrypt
PIN-based Staff Authentication
Role-Based Access Control
Protected API Routes
Secure Session Management
📊 Dashboard Features
Revenue Analytics
Order Statistics
Active Orders
Table Status
Payment Overview
Customer Insights
🛠️ Tech Stack
### Frontend

- React
- TypeScript
- Vite
- React Router
- Context API
Backend
Node.js
Express.js
Database
SQLite
Authentication
JWT
bcrypt
Development Tools
npm
Git
GitHub
