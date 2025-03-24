const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { check, validationResult } = require('express-validator');
const winston = require('winston');

const { readData, writeData, getItemById, updateItem, deleteItem } = require('../utils/dataAccess');
const { auth, adminAuth } = require('../middleware/auth');

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
 * @route   GET api/transactions
 * @desc    Get all transactions
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { type, status, startDate, endDate, search } = req.query;
    
    // Get all transactions
    let transactions = await readData('transactions.json');
    
    // Apply filters if provided
    if (type) {
      transactions = transactions.filter(transaction => transaction.type === type);
    }
    
    if (status) {
      transactions = transactions.filter(transaction => transaction.status === status);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      transactions = transactions.filter(transaction => new Date(transaction.date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      transactions = transactions.filter(transaction => new Date(transaction.date) <= end);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      transactions = transactions.filter(transaction => 
        transaction.reference.toLowerCase().includes(searchTerm) || 
        transaction.notes.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(transactions);
  } catch (error) {
    logger.error('Get all transactions error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving transactions' });
  }
});

/**
 * @route   GET api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Get transaction by ID
    const transaction = await getItemById('transactions.json', req.params.id);
    
    if (!transaction) {
      logger.warn('Get transaction by ID failed: Transaction not found', { transactionId: req.params.id });
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    logger.error('Get transaction by ID error', { transactionId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error retrieving transaction data' });
  }
});

/**
 * @route   POST api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('type', 'Transaction type is required').isIn(['purchase', 'sale', 'return', 'adjustment']),
      check('reference', 'Reference is required').not().isEmpty(),
      check('date', 'Date is required').isISO8601(),
      check('items', 'Items are required and must be an array').isArray(),
      check('items.*.productId', 'Product ID is required for each item').not().isEmpty(),
      check('items.*.quantity', 'Quantity is required for each item').isNumeric(),
      check('items.*.price', 'Price is required for each item').isNumeric(),
      check('totalAmount', 'Total amount is required').isNumeric(),
      check('status', 'Status is required').isIn(['pending', 'completed', 'cancelled']),
      check('paymentStatus', 'Payment status is required').isIn(['pending', 'partial', 'paid'])
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Create transaction validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type,
      reference,
      date,
      items,
      totalAmount,
      status,
      paymentStatus,
      notes
    } = req.body;

    try {
      // Validate product IDs
      const products = await readData('products.json');
      const invalidItems = items.filter(item => !products.some(product => product.id === item.productId));
      
      if (invalidItems.length > 0) {
        logger.warn('Create transaction failed: Invalid product IDs', { invalidItems });
        return res.status(400).json({ 
          message: `Invalid product IDs: ${invalidItems.map(item => item.productId).join(', ')}` 
        });
      }
      
      // For purchase or sale transactions, update inventory quantities
      if (type === 'purchase' || type === 'sale' || type === 'return') {
        // Get existing products data
        const productsMap = products.reduce((map, product) => {
          map[product.id] = product;
          return map;
        }, {});
        
        // Calculate new quantities for each product
        const updatedProducts = [...products];
        
        for (const item of items) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex === -1) continue;
          
          let quantityChange = parseInt(item.quantity);
          
          // Adjust quantity based on transaction type
          if (type === 'sale') {
            quantityChange = -quantityChange; // Decrease inventory for sales
          } else if (type === 'return') {
            // For returns, if it's a customer return, increase inventory; if it's a supplier return, decrease
            // Here we'll assume all returns are customer returns
            // In a real system, you'd have more context about the return type
          }
          
          const newQuantity = updatedProducts[productIndex].quantity + quantityChange;
          
          // Prevent negative quantities for sales
          if (newQuantity < 0 && type === 'sale') {
            logger.warn('Create transaction failed: Insufficient quantity', { 
              productId: item.productId, 
              requested: item.quantity, 
              available: updatedProducts[productIndex].quantity 
            });
            return res.status(400).json({ 
              message: `Insufficient quantity for product ${productsMap[item.productId].name}. Available: ${updatedProducts[productIndex].quantity}, Requested: ${item.quantity}` 
            });
          }
          
          // Update quantity
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          };
        }
        
        // Update product quantities
        await writeData('products.json', updatedProducts);
      }

      // Create transaction object
      const newTransaction = {
        id: uuidv4(),
        type,
        reference,
        date,
        items,
        totalAmount: parseFloat(totalAmount),
        status,
        paymentStatus,
        notes: notes || '',
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get all transactions and add new one
      const transactions = await readData('transactions.json');
      transactions.push(newTransaction);
      
      // Write updated transactions array to file
      await writeData('transactions.json', transactions);
      
      logger.info('Transaction created successfully', { 
        transactionId: newTransaction.id,
        type: newTransaction.type,
        totalAmount: newTransaction.totalAmount
      });
      
      res.status(201).json(newTransaction);
    } catch (error) {
      logger.error('Create transaction error', { error: error.message });
      res.status(500).json({ message: 'Server error creating transaction' });
    }
  }
);

/**
 * @route   PUT api/transactions/:id
 * @desc    Update transaction
 * @access  Private/Admin
 */
router.put(
  '/:id',
  [
    adminAuth,
    [
      check('status', 'Status must be valid').optional().isIn(['pending', 'completed', 'cancelled']),
      check('paymentStatus', 'Payment status must be valid').optional().isIn(['pending', 'partial', 'paid'])
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Update transaction validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, paymentStatus, notes } = req.body;
  
    try {
      // Get transaction by ID
      let transaction = await getItemById('transactions.json', req.params.id);
      
      if (!transaction) {
        logger.warn('Update transaction failed: Transaction not found', { transactionId: req.params.id });
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Prevent updating completed transactions to pending
      if (transaction.status === 'completed' && status === 'pending') {
        logger.warn('Update transaction failed: Cannot change status from completed to pending', { transactionId: req.params.id });
        return res.status(400).json({ message: 'Cannot change status from completed to pending' });
      }
      
      // Handle cancellation - reverse inventory changes if needed
      if (status === 'cancelled' && transaction.status !== 'cancelled') {
        // Only reverse inventory changes for purchase, sale, and return transactions
        if (['purchase', 'sale', 'return'].includes(transaction.type)) {
          // Get existing products data
          const products = await readData('products.json');
          const updatedProducts = [...products];
          
          for (const item of transaction.items) {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex === -1) continue;
            
            let quantityChange = parseInt(item.quantity);
            
            // Reverse the quantity change based on transaction type
            if (transaction.type === 'purchase') {
              quantityChange = -quantityChange; // Decrease inventory for cancelled purchases
            } else if (transaction.type === 'sale') {
              // Increase inventory for cancelled sales
            } else if (transaction.type === 'return') {
              quantityChange = -quantityChange; // Reverse the return adjustment
            }
            
            // Update quantity
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              quantity: updatedProducts[productIndex].quantity + quantityChange,
              updatedAt: new Date().toISOString()
            };
          }
          
          // Update product quantities
          await writeData('products.json', updatedProducts);
        }
      }
      
      // Create updated transaction object
      const updatedTransaction = {
        status: status || transaction.status,
        paymentStatus: paymentStatus || transaction.paymentStatus,
        notes: notes !== undefined ? notes : transaction.notes,
        updatedAt: new Date().toISOString()
      };
      
      // Update transaction
      transaction = await updateItem('transactions.json', req.params.id, updatedTransaction);
      
      if (!transaction) {
        logger.warn('Update transaction failed: Transaction not found during update operation', { transactionId: req.params.id });
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      logger.info('Transaction updated successfully', { 
        transactionId: transaction.id,
        type: transaction.type,
        status: transaction.status,
        paymentStatus: transaction.paymentStatus
      });
      
      res.json(transaction);
    } catch (error) {
      logger.error('Update transaction error', { transactionId: req.params.id, error: error.message });
      res.status(500).json({ message: 'Server error updating transaction' });
    }
  }
);

/**
 * @route   DELETE api/transactions/:id
 * @desc    Delete transaction
 * @access  Private/Admin
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Get transaction by ID to check status
    const transaction = await getItemById('transactions.json', req.params.id);
    
    if (!transaction) {
      logger.warn('Delete transaction failed: Transaction not found', { transactionId: req.params.id });
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Prevent deleting completed transactions
    if (transaction.status === 'completed') {
      logger.warn('Delete transaction failed: Cannot delete completed transaction', { transactionId: req.params.id });
      return res.status(400).json({ message: 'Cannot delete completed transactions. Use cancellation instead.' });
    }
    
    // For pending transactions, reverse inventory changes if needed
    if (['purchase', 'sale', 'return'].includes(transaction.type) && transaction.status === 'pending') {
      // Get existing products data
      const products = await readData('products.json');
      const updatedProducts = [...products];
      
      for (const item of transaction.items) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex === -1) continue;
        
        let quantityChange = parseInt(item.quantity);
        
        // Reverse the quantity change based on transaction type
        if (transaction.type === 'purchase') {
          quantityChange = -quantityChange; // Decrease inventory for deleted purchases
        } else if (transaction.type === 'sale') {
          // Increase inventory for deleted sales
        } else if (transaction.type === 'return') {
          quantityChange = -quantityChange; // Reverse the return adjustment
        }
        
        // Update quantity
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          quantity: updatedProducts[productIndex].quantity + quantityChange,
          updatedAt: new Date().toISOString()
        };
      }
      
      // Update product quantities
      await writeData('products.json', updatedProducts);
    }
    
    // Delete transaction
    const deleted = await deleteItem('transactions.json', req.params.id);
    
    if (!deleted) {
      logger.warn('Delete transaction failed: Transaction not found during delete operation', { transactionId: req.params.id });
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    logger.info('Transaction deleted successfully', { 
      transactionId: req.params.id,
      type: transaction.type,
      status: transaction.status
    });
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    logger.error('Delete transaction error', { transactionId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
});

/**
 * @route   GET api/transactions/summary/stats
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get('/summary/stats', auth, async (req, res) => {
  try {
    // Get all transactions
    const transactions = await readData('transactions.json');
    
    // Calculate summary statistics
    const summary = {
      total: transactions.length,
      byType: {
        purchase: transactions.filter(t => t.type === 'purchase').length,
        sale: transactions.filter(t => t.type === 'sale').length,
        return: transactions.filter(t => t.type === 'return').length,
        adjustment: transactions.filter(t => t.type === 'adjustment').length
      },
      byStatus: {
        pending: transactions.filter(t => t.status === 'pending').length,
        completed: transactions.filter(t => t.status === 'completed').length,
        cancelled: transactions.filter(t => t.status === 'cancelled').length
      },
      byPaymentStatus: {
        pending: transactions.filter(t => t.paymentStatus === 'pending').length,
        partial: transactions.filter(t => t.paymentStatus === 'partial').length,
        paid: transactions.filter(t => t.paymentStatus === 'paid').length
      },
      totalValue: {
        purchase: transactions.filter(t => t.type === 'purchase' && t.status !== 'cancelled')
          .reduce((total, t) => total + t.totalAmount, 0),
        sale: transactions.filter(t => t.type === 'sale' && t.status !== 'cancelled')
          .reduce((total, t) => total + t.totalAmount, 0),
        return: transactions.filter(t => t.type === 'return' && t.status !== 'cancelled')
          .reduce((total, t) => total + t.totalAmount, 0)
      }
    };
    
    res.json(summary);
  } catch (error) {
    logger.error('Get transaction statistics error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving transaction statistics' });
  }
});

module.exports = router; 