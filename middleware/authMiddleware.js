const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'ultra_secure_secret_key';

/**
 * Middleware to protect routes that require authentication
 */
const protect = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists
    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    const user = users.find(user => user.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Middleware to check if user is admin
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }

  next();
};

module.exports = { protect, admin }; 