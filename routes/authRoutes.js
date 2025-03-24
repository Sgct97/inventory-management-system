const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'ultra_secure_secret_key';

// Load users data
const getUsersFromFile = () => {
  const usersPath = path.join(__dirname, '../data/users.json');
  if (!fs.existsSync(usersPath)) {
    // Create initial users if file doesn't exist
    const initialUsers = [
      {
        id: '0291b0dd-4ccd-4d33-8a38-45bb64daaf09',
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$rrm2sjVJAHeSwhpComi0teK1/5qxNn2dQpYOLI3sIfZQIQQQJAoQa', // password123
        role: 'admin',
        lastLogin: null
      },
      {
        id: '7b844c1b-ab1c-4c3d-b59c-d5c8ac0c21a',
        name: 'Standard User',
        email: 'user@example.com',
        password: '$2a$10$rrm2sjVJAHeSwhpComi0teK1/5qxNn2dQpYOLI3sIfZQIQQQJAoQa', // password123
        role: 'user',
        lastLogin: null
      }
    ];
    fs.writeFileSync(usersPath, JSON.stringify(initialUsers, null, 2));
    return initialUsers;
  }
  
  return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Get users
    const users = getUsersFromFile();

    // Find user by email
    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = new Date().toISOString();
    fs.writeFileSync(
      path.join(__dirname, '../data/users.json'),
      JSON.stringify(users, null, 2)
    );

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    logger.info('User logged in successfully', { userId: user.id });

    // Send response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/user
 * @desc    Get logged in user data
 * @access  Private
 */
router.get('/user', protect, (req, res) => {
  // Return user data without password
  const { password, ...user } = req.user;
  res.json(user);
});

module.exports = router; 