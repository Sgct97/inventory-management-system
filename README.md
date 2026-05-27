[Your Project Logo/Banner Here - Optional but recommended]

# Enterprise-Grade Inventory Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A robust, full-stack inventory management solution designed for scalability and ease of use. Featuring a secure RESTful API backend built with Node.js/Express and a modern, responsive frontend powered by React and TypeScript.**

This system provides comprehensive tools for managing products, suppliers, and transactions, complete with role-based access control and real-time dashboard insights, making it ideal for businesses seeking efficient inventory oversight.

---

## ✨ Key Features

*   **Secure User Authentication**: Implements JWT (JSON Web Tokens) for secure login and session management, protecting sensitive data.
*   **Comprehensive Product Management**: Easily add, edit, view detailed information, and remove products from the inventory.
*   **Detailed Supplier Tracking**: Maintain an organized database of supplier information, crucial for supply chain management.
*   **Accurate Transaction Logging**: Record purchase orders and sales transactions with timestamps for clear financial tracking and history.
*   **Insightful Dashboard**: Presents key metrics and real-time data visualizations for quick business performance analysis.
*   **Role-Based Access Control (RBAC)**: Differentiates user permissions between Administrators (full access) and Standard Users (limited access) for enhanced security and operational structure.
*   **Responsive & Modern UI**: Built with React and Material UI, ensuring a seamless experience across desktops, tablets, and mobile devices.

---

## 🚀 Tech Stack

**Backend:**
*   Node.js
*   Express.js
*   JWT (JSON Web Tokens) for Authentication
*   Winston for Logging
*   JSON file-based data storage (Note: Consider migrating to a database like PostgreSQL or MongoDB for production environments)

**Frontend:**
*   React 18
*   TypeScript
*   Material UI (MUI)
*   Axios for API requests
*   React Router for navigation

---

## 📸 Screenshots

[Add Screenshot 1: Dashboard/Login Page]
_Description of screenshot 1_

[Add Screenshot 2: Product Management Page]
_Description of screenshot 2_

[Add Screenshot 3: Mobile Responsive View]
_Description of screenshot 3_

*(Consider adding a GIF showcasing the workflow)*

---

## ⚙️ Project Structure

```
inventory-management-system/
├── client/                # Frontend React application
│   ├── public/            # Static files (index.html, manifest.json, etc.)
│   └── src/               # React TypeScript source code
│       ├── assets/        # Images, fonts, etc.
│       ├── components/    # Reusable UI components (Buttons, Modals, etc.)
│       ├── contexts/      # React Context API for global state (e.g., AuthContext)
│       ├── hooks/         # Custom React hooks
│       ├── layouts/       # Structural components (Header, Sidebar, etc.)
│       ├── pages/         # Top-level page components (Dashboard, ProductsPage, etc.)
│       ├── services/      # API interaction logic (e.g., using Axios)
│       ├── styles/        # Global styles or theme configuration
│       ├── types/         # TypeScript type definitions
│       ├── App.tsx        # Main application component
│       └── index.tsx      # Entry point for the React app
├── data/                  # JSON files for data storage (products.json, users.json, etc.)
├── middleware/            # Custom Express middleware (e.g., authMiddleware, errorHandling)
├── routes/                # API route definitions (authRoutes, productRoutes, etc.)
├── utils/                 # Utility functions (e.g., helpers, constants)
├── .env.example           # Example environment variables
├── .gitignore             # Files and directories ignored by Git
├── package.json           # Server dependencies and scripts
├── README.md              # This file
└── server.js              # Main Node.js server entry point
```

---

## 🏁 Getting Started

### Prerequisites

*   Node.js (v14 or later recommended)
*   npm (v6 or later) or yarn
*   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Sgct97/inventory-management-system.git
    cd inventory-management-system
    ```

2.  **Install server dependencies:**
    ```bash
    npm install
    # or: yarn install
    ```

3.  **Install client dependencies:**
    ```bash
    cd client
    npm install
    # or: yarn install
    cd ..
    ```

4.  **Set up environment variables:**
    *   Create a `.env` file in the root directory.
    *   Copy the contents from `.env.example` into `.env`.
    *   Fill in the necessary values (e.g., `JWT_SECRET`).

### Running the Application

1.  **Run both server and client concurrently (recommended for development):**
    ```bash
    npm run dev
    # or: yarn dev
    ```
    This typically uses a tool like `concurrently` to start both the backend server and the frontend development server.

2.  **Or run them separately:**
    *   **Start the backend server:**
        ```bash
        npm run server
        # or: yarn server
        ```
    *   **In a separate terminal, start the frontend client:**
        ```bash
        npm run client
        # or: yarn client
        ```

3.  The backend server will typically run on `http://localhost:5000` (or your configured port).
4.  The frontend development server will typically run on `http://localhost:3001` (or the next available port).

### Default Login Credentials

*   **Admin User:**
    *   Username: `admin`
    *   Email: `admin@example.com`
    *   Password: `password123`
*   **Standard User:**
    *   Email: `user@example.com`
    *   Password: `password123`

*(These should be changed for any production or publicly accessible deployment)*

---

## 🌐 API Endpoints

*(See `routes/` directory for detailed implementation)*

### Authentication (`/api/auth`)
*   `POST /login`: User login, returns JWT.
*   `GET /user`: Get authenticated user's data (requires valid JWT).

### Products (`/api/products`)
*   `GET /`: Get all products.
*   `GET /:id`: Get a specific product by ID.
*   `POST /`: Create a new product (Admin only).
*   `PUT /:id`: Update an existing product (Admin only).
*   `DELETE /:id`: Delete a product (Admin only).

### Suppliers (`/api/suppliers`)
*   `GET /`: Get all suppliers.
*   `GET /:id`: Get a specific supplier by ID.
*   `POST /`: Create a new supplier (Admin only).
*   `PUT /:id`: Update a supplier (Admin only).
*   `DELETE /:id`: Delete a supplier (Admin only).

### Transactions (`/api/transactions`)
*   `GET /`: Get all transactions.
*   `GET /:id`: Get a specific transaction by ID.
*   `POST /`: Create a new transaction (Purchase or Sale).
*   `DELETE /:id`: Delete a transaction (Admin only).

### Users (`/api/users`)
*   `GET /profile`: Get the logged-in user's profile.
*   `PUT /profile`: Update the logged-in user's profile.

---

## 🛠️ Troubleshooting

*   **Connection Issues:** Ensure the backend server is running and accessible from the client (check `.env` or Axios base URL configuration in the client). Verify ports are correct (`5000` for server, `3001` for client by default).
*   **Authentication Errors:** Double-check JWT secret consistency between `.env` and usage. Ensure tokens are correctly sent in Authorization headers (`Bearer <token>`).
*   **Dependency Problems:** If `npm install` fails, try removing `node_modules` and `package-lock.json` (or `yarn.lock`) and reinstalling. Check Node.js/npm version compatibility.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Sgct97/inventory-management-system/issues).

*(Even for personal projects, this shows good practice)*

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if you have one). 