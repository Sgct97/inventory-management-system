const jwt = require('jsonwebtoken');
const winston = require('winston');

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

// JWT secret should be in an environment variable in production
// For development, we're using a hardcoded string
const JWT_SECRET = process.env.JWT_SECRET || 'inventory-management-secret-key';

/**
 * Middleware to verify JWT authentication token
 */
function auth(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if token exists
  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication failed: Invalid token', {
      path: req.path,
      method: req.method,
      error: error.message
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      message: 'Invalid authentication token.' 
    });
  }
}

/**
 * Middleware to verify user has admin role
 */
function adminAuth(req, res, next) {
  // First verify the token
  auth(req, res, () => {
    // Check if user has admin role
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      logger.warn('Authorization failed: User not admin', {
        userId: req.user.id,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }
  });
}

/**
 * Function to generate a JWT token for a user
 * @param {Object} user - User object (without password)
 * @returns {String} - JWT token
 */
function generateToken(user) {
  // Remove sensitive data
  const userForToken = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };
  
  // Token expires in 24 hours
  return jwt.sign(userForToken, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = {
  auth,
  adminAuth,
  generateToken
}; 