const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/authMiddleware');
const { readDataFromFile, writeDataToFile } = require('../utils/fileUtils');

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions
 * @access  Private
 */
router.get('/', protect, (req, res) => {
  const transactions = readDataFromFile('transactions.json');
  res.json(transactions);
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/:id', protect, (req, res) => {
  const transactions = readDataFromFile('transactions.json');
  const transaction = transactions.find(t => t.id === req.params.id);
  
  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  
  res.json(transaction);
});

/**
 * @route   POST /api/transactions
 * @desc    Create a transaction
 * @access  Private
 */
router.post('/', protect, (req, res) => {
  try {
    const {
      type,
      productId,
      quantity,
      price,
      supplierId,
      date,
      notes
    } = req.body;
    
    // Validation
    if (!type || !productId || !quantity || !price) {
      return res.status(400).json({
        message: 'Please provide all required fields: type, productId, quantity, price'
      });
    }
    
    if (type === 'purchase' && !supplierId) {
      return res.status(400).json({
        message: 'Supplier ID is required for purchase transactions'
      });
    }
    
    const transactions = readDataFromFile('transactions.json');
    const products = readDataFromFile('products.json');
    
    // Find product
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // For sales, check inventory
    if (type === 'sale' && products[productIndex].quantity < quantity) {
      return res.status(400).json({
        message: `Not enough inventory. Available: ${products[productIndex].quantity}`
      });
    }
    
    // Calculate total amount
    const totalAmount = parseFloat(price) * parseInt(quantity);
    
    // Create transaction
    const newTransaction = {
      id: uuidv4(),
      type,
      productId,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      totalAmount,
      date: date || new Date().toISOString(),
      supplierId: type === 'purchase' ? supplierId : undefined,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    // Update product quantity
    if (type === 'purchase') {
      products[productIndex].quantity += parseInt(quantity);
    } else {
      products[productIndex].quantity -= parseInt(quantity);
    }
    
    // Save data
    const transactionSaved = writeDataToFile('transactions.json', [...transactions, newTransaction]);
    const productSaved = writeDataToFile('products.json', products);
    
    if (transactionSaved && productSaved) {
      console.log('Transaction created successfully', {
        type,
        transactionId: newTransaction.id,
        totalAmount
      });
      res.status(201).json(newTransaction);
    } else {
      res.status(500).json({ message: 'Failed to create transaction' });
    }
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete('/:id', protect, (req, res) => {
  try {
    const transactions = readDataFromFile('transactions.json');
    const products = readDataFromFile('products.json');
    
    // Find transaction
    const transaction = transactions.find(t => t.id === req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Find product
    const productIndex = products.findIndex(p => p.id === transaction.productId);
    if (productIndex === -1) {
      return res.status(500).json({ message: 'Associated product not found' });
    }
    
    // Revert product quantity
    if (transaction.type === 'purchase') {
      products[productIndex].quantity -= transaction.quantity;
    } else {
      products[productIndex].quantity += transaction.quantity;
    }
    
    // Remove transaction
    const filteredTransactions = transactions.filter(t => t.id !== req.params.id);
    
    // Save data
    const transactionSaved = writeDataToFile('transactions.json', filteredTransactions);
    const productSaved = writeDataToFile('products.json', products);
    
    if (transactionSaved && productSaved) {
      res.json({ message: 'Transaction removed and product quantity updated' });
    } else {
      res.status(500).json({ message: 'Failed to delete transaction' });
    }
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/transactions/summary/stats
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get('/summary/stats', protect, (req, res) => {
  try {
    const transactions = readDataFromFile('transactions.json');
    
    // Initial stats
    const stats = {
      total: transactions.length,
      byType: {
        purchase: 0,
        sale: 0
      },
      totalValue: {
        purchase: 0,
        sale: 0
      }
    };
    
    // Calculate stats
    transactions.forEach(transaction => {
      stats.byType[transaction.type]++;
      stats.totalValue[transaction.type] += transaction.totalAmount;
    });
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting transaction stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 