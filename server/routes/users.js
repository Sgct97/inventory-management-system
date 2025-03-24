const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { check, validationResult } = require('express-validator');
const winston = require('winston');

const { readData, writeData, getItemById, updateItem, deleteItem } = require('../utils/dataAccess');
const { auth, adminAuth, generateToken } = require('../middleware/auth');

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
 * @route   POST api/users
 * @desc    Register a new user
 * @access  Private/Admin
 */
router.post(
  '/',
  [
    adminAuth,
    [
      check('username', 'Username is required').not().isEmpty(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('role', 'Role is required').isIn(['admin', 'manager', 'employee'])
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('User registration validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, firstName, lastName, email, role, permissions = [] } = req.body;

    try {
      // Get all users
      const users = await readData('users.json');
      
      // Check if username or email is already in use
      if (users.some(user => user.username === username)) {
        logger.warn('User registration failed: Username already exists', { username });
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      if (users.some(user => user.email === email)) {
        logger.warn('User registration failed: Email already exists', { email });
        return res.status(400).json({ message: 'Email is already registered' });
      }

      // Create user object
      const newUser = {
        id: uuidv4(),
        username,
        firstName,
        lastName,
        email,
        role,
        permissions,
        active: true,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Hash password
      const salt = await bcrypt.genSalt(10);
      newUser.passwordHash = await bcrypt.hash(password, salt);

      // Add user to array
      users.push(newUser);
      
      // Write updated users array to file
      await writeData('users.json', users);
      
      logger.info('User registered successfully', { userId: newUser.id });
      
      // Return user data (without password)
      const { passwordHash, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      logger.error('User registration error', { error: error.message });
      res.status(500).json({ message: 'Server error during user registration' });
    }
  }
);

/**
 * @route   GET api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    // Get all users
    const users = await readData('users.json');
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    logger.error('Get all users error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

/**
 * @route   GET api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    // Get user by ID
    const user = await getItemById('users.json', req.params.id);
    
    if (!user) {
      logger.warn('Get user by ID failed: User not found', { userId: req.params.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Get user by ID error', { userId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error retrieving user data' });
  }
});

/**
 * @route   PUT api/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/:id', adminAuth, async (req, res) => {
  const { username, firstName, lastName, email, role, permissions, active } = req.body;
  
  try {
    // Get user by ID
    let user = await getItemById('users.json', req.params.id);
    
    if (!user) {
      logger.warn('Update user failed: User not found', { userId: req.params.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if trying to update an admin (only allow if the requester is also an admin)
    if (user.role === 'admin' && req.user.role !== 'admin') {
      logger.warn('Update user failed: Non-admin trying to update admin user', { userId: req.params.id, requesterId: req.user.id });
      return res.status(403).json({ message: 'Not authorized to update admin users' });
    }
    
    // Create updated user object
    const updatedUser = {
      username: username || user.username,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      role: role || user.role,
      permissions: permissions || user.permissions,
      active: active !== undefined ? active : user.active,
      updatedAt: new Date().toISOString()
    };
    
    // Update user
    user = await updateItem('users.json', req.params.id, updatedUser);
    
    if (!user) {
      logger.warn('Update user failed: User not found during update operation', { userId: req.params.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    logger.info('User updated successfully', { userId: user.id });
    
    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Update user error', { userId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error updating user' });
  }
});

/**
 * @route   DELETE api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Get user to check if they're an admin
    const user = await getItemById('users.json', req.params.id);
    
    if (!user) {
      logger.warn('Delete user failed: User not found', { userId: req.params.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting an admin (only allow if the requester is also an admin)
    if (user.role === 'admin' && req.user.role !== 'admin') {
      logger.warn('Delete user failed: Non-admin trying to delete admin user', { userId: req.params.id, requesterId: req.user.id });
      return res.status(403).json({ message: 'Not authorized to delete admin users' });
    }
    
    // Delete user
    const deleted = await deleteItem('users.json', req.params.id);
    
    if (!deleted) {
      logger.warn('Delete user failed: User not found during delete operation', { userId: req.params.id });
      return res.status(404).json({ message: 'User not found' });
    }
    
    logger.info('User deleted successfully', { userId: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error', { userId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

/**
 * @route   PUT api/users/:id/change-password
 * @desc    Change user password
 * @access  Private/Admin or Self
 */
router.put(
  '/:id/change-password',
  [
    auth,
    [
      check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Change password validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Check if user is updating their own password or is an admin
      if (req.params.id !== req.user.id && req.user.role !== 'admin') {
        logger.warn('Change password failed: Unauthorized attempt', { userId: req.params.id, requesterId: req.user.id });
        return res.status(403).json({ message: 'Not authorized to change password for other users' });
      }
      
      // Get user by ID
      let user = await getItemById('users.json', req.params.id);
      
      if (!user) {
        logger.warn('Change password failed: User not found', { userId: req.params.id });
        return res.status(404).json({ message: 'User not found' });
      }

      // If it's not an admin, verify current password
      if (req.user.role !== 'admin') {
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        
        if (!isMatch) {
          logger.warn('Change password failed: Incorrect current password', { userId: req.params.id });
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update user's password
      user = await updateItem('users.json', req.params.id, {
        passwordHash,
        updatedAt: new Date().toISOString()
      });
      
      if (!user) {
        logger.warn('Change password failed: User not found during update operation', { userId: req.params.id });
        return res.status(404).json({ message: 'User not found' });
      }
      
      logger.info('Password changed successfully', { userId: user.id });
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error', { userId: req.params.id, error: error.message });
      res.status(500).json({ message: 'Server error changing password' });
    }
  }
);

/**
 * @route   PUT api/users/profile
 * @desc    Update user's own profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  
  try {
    // Get user from auth middleware
    const userId = req.user.id;
    
    // Get user by ID
    let user = await getItemById('users.json', userId);
    
    if (!user) {
      logger.warn('Update profile failed: User not found', { userId });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare updated user data
    const updatedData = {
      firstName: name ? name.split(' ')[0] : user.firstName,
      lastName: name ? name.split(' ').slice(1).join(' ') : user.lastName,
      email: email || user.email,
      updatedAt: new Date().toISOString()
    };
    
    // If password change is requested
    if (newPassword && currentPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isMatch) {
        logger.warn('Update profile failed: Incorrect current password', { userId });
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updatedData.passwordHash = await bcrypt.hash(newPassword, salt);
    }
    
    // Update user
    user = await updateItem('users.json', userId, updatedData);
    
    if (!user) {
      logger.warn('Update profile failed: User not found during update operation', { userId });
      return res.status(404).json({ message: 'User not found' });
    }
    
    logger.info('User profile updated successfully', { userId });
    
    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    // Create updated user object with full name for client
    const responseUser = {
      ...userWithoutPassword,
      name: `${user.firstName} ${user.lastName}`.trim()
    };
    
    res.json(responseUser);
  } catch (error) {
    logger.error('Update profile error', { userId: req.user.id, error: error.message });
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router; 