const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple authentication for testing
  if (username === 'admin' && password === 'admin123') {
    console.log('User logged in successfully');
    res.json({
      token: 'test-jwt-token',
      user: {
        id: '0291b0dd-4ccd-4d33-8a38-45bb64daaf09',
        name: 'System Administrator',
        email: 'admin@example.com',
        role: 'admin',
        lastLogin: new Date().toISOString()
      }
    });
  } else {
    console.log('Login failed: Invalid credentials');
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/user', (req, res) => {
  // For testing, always return a valid user
  res.json({
    id: '0291b0dd-4ccd-4d33-8a38-45bb64daaf09',
    name: 'System Administrator',
    email: 'admin@example.com',
    role: 'admin',
    lastLogin: new Date().toISOString()
  });
});

// Products stub
app.get('/api/products', (req, res) => {
  res.json([]);
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>Test Server</h1>
    <p>This is a simplified test server to verify connectivity.</p>
    <p>Try accessing the <a href="/api/test">/api/test</a> endpoint.</p>
  `);
});

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 