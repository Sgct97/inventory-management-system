const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Initialize express app
const app = express();

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Check if data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir);
    logger.info('Created data directory');
  } catch (error) {
    logger.error('Failed to create data directory', { error: error.message });
    throw new Error(`Failed to create data directory: ${error.message}`);
  }
}

// Check if required data files exist, create them if they don't
const requiredFiles = ['products.json', 'suppliers.json', 'transactions.json', 'users.json'];
requiredFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, '[]', 'utf8');
      logger.info(`Created empty ${file} file`);
    } catch (error) {
      logger.error(`Failed to create ${file}`, { error: error.message });
      throw new Error(`Failed to create ${file}: ${error.message}`);
    }
  }
});

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.error(error.message);
  res.status(404);
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  logger.error(`${err.message}`, { 
    error: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Set port and listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason: reason.toString(), stack: reason.stack });
  console.error('Unhandled Promise Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.toString(), stack: error.stack });
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app; 