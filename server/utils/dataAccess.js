const fs = require('fs').promises;
const path = require('path');
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

/**
 * Read data from a JSON file
 * @param {string} fileName - Name of the JSON file to read
 * @returns {Promise<Array>} - Promise that resolves to the parsed JSON data
 */
async function readData(fileName) {
  try {
    const filePath = path.join(__dirname, '..', 'data', fileName);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.error(`File not found: ${fileName}`, { error: error.message });
      throw new Error(`Data file ${fileName} does not exist. Please check the file path.`);
    } else if (error instanceof SyntaxError) {
      logger.error(`Invalid JSON in file: ${fileName}`, { error: error.message });
      throw new Error(`Invalid JSON format in ${fileName}. Please check the file content.`);
    } else {
      logger.error(`Error reading file: ${fileName}`, { error: error.message });
      throw new Error(`Failed to read data from ${fileName}: ${error.message}`);
    }
  }
}

/**
 * Write data to a JSON file
 * @param {string} fileName - Name of the JSON file to write to
 * @param {Array} data - Data to write to the file
 * @returns {Promise<void>} - Promise that resolves when data is written
 */
async function writeData(fileName, data) {
  try {
    const filePath = path.join(__dirname, '..', 'data', fileName);
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
    logger.info(`Successfully wrote data to ${fileName}`);
  } catch (error) {
    logger.error(`Error writing to file: ${fileName}`, { error: error.message, data });
    throw new Error(`Failed to write data to ${fileName}: ${error.message}`);
  }
}

/**
 * Get a single item by ID from a JSON file
 * @param {string} fileName - Name of the JSON file to read from
 * @param {string} id - ID of the item to get
 * @returns {Promise<Object|null>} - Promise that resolves to the item or null if not found
 */
async function getItemById(fileName, id) {
  try {
    const data = await readData(fileName);
    const item = data.find(item => item.id === id);
    
    if (!item) {
      logger.warn(`Item with ID ${id} not found in ${fileName}`);
      return null;
    }
    
    return item;
  } catch (error) {
    logger.error(`Error getting item by ID from ${fileName}`, { id, error: error.message });
    throw new Error(`Failed to get item with ID ${id} from ${fileName}: ${error.message}`);
  }
}

/**
 * Add a new item to a JSON file
 * @param {string} fileName - Name of the JSON file to add to
 * @param {Object} item - Item to add
 * @returns {Promise<Object>} - Promise that resolves to the added item
 */
async function addItem(fileName, item) {
  try {
    const data = await readData(fileName);
    data.push(item);
    await writeData(fileName, data);
    logger.info(`Added item to ${fileName}`, { itemId: item.id });
    return item;
  } catch (error) {
    logger.error(`Error adding item to ${fileName}`, { item, error: error.message });
    throw new Error(`Failed to add item to ${fileName}: ${error.message}`);
  }
}

/**
 * Update an existing item in a JSON file
 * @param {string} fileName - Name of the JSON file to update
 * @param {string} id - ID of the item to update
 * @param {Object} updatedItem - Updated item data
 * @returns {Promise<Object|null>} - Promise that resolves to the updated item or null if not found
 */
async function updateItem(fileName, id, updatedItem) {
  try {
    const data = await readData(fileName);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      logger.warn(`Item with ID ${id} not found in ${fileName} for update`);
      return null;
    }
    
    data[index] = { ...data[index], ...updatedItem, id };
    await writeData(fileName, data);
    logger.info(`Updated item in ${fileName}`, { itemId: id });
    return data[index];
  } catch (error) {
    logger.error(`Error updating item in ${fileName}`, { id, updatedItem, error: error.message });
    throw new Error(`Failed to update item with ID ${id} in ${fileName}: ${error.message}`);
  }
}

/**
 * Delete an item from a JSON file
 * @param {string} fileName - Name of the JSON file to delete from
 * @param {string} id - ID of the item to delete
 * @returns {Promise<boolean>} - Promise that resolves to true if deleted, false if not found
 */
async function deleteItem(fileName, id) {
  try {
    const data = await readData(fileName);
    const initialLength = data.length;
    const filteredData = data.filter(item => item.id !== id);
    
    if (filteredData.length === initialLength) {
      logger.warn(`Item with ID ${id} not found in ${fileName} for deletion`);
      return false;
    }
    
    await writeData(fileName, filteredData);
    logger.info(`Deleted item from ${fileName}`, { itemId: id });
    return true;
  } catch (error) {
    logger.error(`Error deleting item from ${fileName}`, { id, error: error.message });
    throw new Error(`Failed to delete item with ID ${id} from ${fileName}: ${error.message}`);
  }
}

module.exports = {
  readData,
  writeData,
  getItemById,
  addItem,
  updateItem,
  deleteItem
}; 