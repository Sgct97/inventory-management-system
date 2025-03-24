const express = require('express');
const cors = require('cors');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

// Test route for auth
app.post('/test-login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    return res.json({ 
      message: 'Login successful',
      token: 'test-token',
      user: {
        username: 'admin',
        role: 'admin'
      }
    });
  }
  
  return res.status(400).json({ message: 'Invalid credentials' });
});

// Set port and listen
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 