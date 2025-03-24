/**
 * Script to create an initial admin user
 * 
 * Run with: node scripts/createAdminUser.js
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Configuration
const adminUser = {
  username: 'admin',
  password: 'admin123',  // This would be changed after first login in a real system
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@example.com',
  role: 'admin',
  permissions: ['all'],
  active: true
};

// File path
const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

async function createAdminUser() {
  try {
    console.log('Starting admin user creation...');
    
    // Check if users file exists
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
      console.log(`Found existing users file with ${users.length} users`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Users file does not exist, creating a new one');
      } else {
        throw error;
      }
    }
    
    // Check if admin user already exists
    const adminExists = users.some(user => 
      user.username === adminUser.username || 
      user.email === adminUser.email
    );
    
    if (adminExists) {
      console.log('Admin user already exists, skipping creation');
      return;
    }
    
    // Create admin user object
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    const newAdminUser = {
      id: uuidv4(),
      username: adminUser.username,
      passwordHash: hashedPassword,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions,
      active: adminUser.active,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add admin user to the array
    users.push(newAdminUser);
    
    // Write to file
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    
    console.log('Admin user created successfully');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: ${adminUser.password}`);
    console.log('Please change the password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Execute the function
createAdminUser(); 