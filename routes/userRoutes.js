const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { readDataFromFile, writeDataToFile } = require('../utils/fileUtils');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, (req, res) => {
  // Return user data without password
  const { password, ...user } = req.user;
  res.json(user);
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    // Get users
    const users = readDataFromFile('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    users[userIndex].name = name || users[userIndex].name;
    users[userIndex].email = email || users[userIndex].email;

    // Check if password update is requested
    if (newPassword && currentPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, users[userIndex].password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      users[userIndex].password = await bcrypt.hash(newPassword, salt);
    }

    // Save updated user data
    if (writeDataToFile('users.json', users)) {
      // Return updated user without password
      const { password, ...updatedUser } = users[userIndex];
      res.json(updatedUser);
    } else {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 