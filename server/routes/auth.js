const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const winston = require('winston');
const path = require('path');

const { readData } = require('../utils/dataAccess');
const { generateToken, auth } = require('../middleware/auth');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * @route   POST api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Login validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      // Get users from JSON file
      const users = await readData('users.json');
      
      // Find user by username
      const user = users.find(user => user.username === username);
      
      if (!user) {
        logger.warn('Login failed: User not found', { username });
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Check if user is active
      if (!user.active) {
        logger.warn('Login failed: User account is inactive', { username });
        return res.status(400).json({ message: 'Account is inactive. Please contact an administrator.' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      
      if (!isMatch) {
        logger.warn('Login failed: Incorrect password', { username });
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // User matched, create token
      const token = generateToken(user);
      
      // Update last login time (would normally write to file here, but omitting for simplicity)
      logger.info('User logged in successfully', { userId: user.id });
      
      // Return token and user data (without password)
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      logger.error('Login error', { error: error.message });
      res.status(500).json({ message: 'Server error during login process' });
    }
  }
);

/**
 * @route   GET api/auth/user
 * @desc    Get current user data
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
  try {
    // Get users from JSON file
    const users = await readData('users.json');
    
    // Find user by id
    const user = users.find(user => user.id === req.user.id);
    
    if (!user) {
      logger.warn('Get user failed: User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data (without password)
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Get current user error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving user data' });
  }
});

module.exports = router; 