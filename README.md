# Enterprise-Grade Inventory Management System

A complete inventory management solution with a RESTful API backend and a modern React TypeScript frontend.

## Features

- **User Authentication**: Secure JWT-based authentication
- **Product Management**: Add, edit, view, and delete products
- **Supplier Management**: Maintain supplier information
- **Transaction Tracking**: Record purchases and sales
- **Dashboard**: Real-time business insights
- **Role-Based Access Control**: Admin and standard user roles
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js
- Express.js
- JWT Authentication
- Winston logging
- JSON file-based data storage

### Frontend
- React 18
- TypeScript
- Material UI
- Axios
- React Router

## Project Structure

```
inventory-management-system/
├── client/                # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable UI components
│       ├── contexts/      # React context providers
│       ├── pages/         # Page components
│       └── ...
├── data/                  # JSON data storage
├── middleware/            # Express middleware
├── routes/                # API routes
├── services/              # Business logic
├── utils/                 # Utility functions
└── server.js              # Main server file
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/inventory-management-system.git
   cd inventory-management-system
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

### Running the Application

1. Run both the server and client in development mode:
   ```
   npm run dev
   ```

2. Or run them separately:
   ```
   # Start the server
   npm run server
   
   # In another terminal, start the client
   npm run client
   ```

3. The server will run on http://localhost:5000 and the client on http://localhost:3000

### Default Login Credentials

- Admin User:
  - Email: admin@example.com
  - Password: password123

- Standard User:
  - Email: user@example.com
  - Password: password123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get a specific supplier
- `POST /api/suppliers` - Create a new supplier
- `PUT /api/suppliers/:id` - Update a supplier
- `DELETE /api/suppliers/:id` - Delete a supplier

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get a specific transaction
- `POST /api/transactions` - Create a new transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## License

MIT 