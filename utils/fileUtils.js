const fs = require('fs');
const path = require('path');
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

// Path to data directory
const dataDir = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Read data from a JSON file
 * @param {string} fileName - The name of the file to read from
 * @returns {Array|Object} The parsed data
 */
const readDataFromFile = (fileName) => {
  const filePath = path.join(dataDir, fileName);
  
  // Create empty file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading ${fileName}:`, error);
    return [];
  }
};

/**
 * Write data to a JSON file
 * @param {string} fileName - The name of the file to write to
 * @param {Array|Object} data - The data to write
 * @returns {boolean} Success or failure
 */
const writeDataToFile = (fileName, data) => {
  const filePath = path.join(dataDir, fileName);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    logger.info(`Successfully wrote data to ${fileName}`);
    return true;
  } catch (error) {
    logger.error(`Error writing to ${fileName}:`, error);
    return false;
  }
};

module.exports = {
  readDataFromFile,
  writeDataToFile
}; 