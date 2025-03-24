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
 * @route   GET api/products
 * @desc    Get all products
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { category, supplier, search, lowStock } = req.query;
    
    // Get all products
    let products = await readData('products.json');
    
    // Apply filters if provided
    if (category) {
      products = products.filter(product => product.category === category);
    }
    
    if (supplier) {
      products = products.filter(product => product.supplier === supplier);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm) || 
        product.sku.toLowerCase().includes(searchTerm)
      );
    }
    
    if (lowStock === 'true') {
      products = products.filter(product => product.quantity <= product.reorderLevel);
    }
    
    res.json(products);
  } catch (error) {
    logger.error('Get all products error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving products' });
  }
});

/**
 * @route   GET api/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Get product by ID
    const product = await getItemById('products.json', req.params.id);
    
    if (!product) {
      logger.warn('Get product by ID failed: Product not found', { productId: req.params.id });
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    logger.error('Get product by ID error', { productId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error retrieving product data' });
  }
});

/**
 * @route   POST api/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post(
  '/',
  [
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('price', 'Price is required and must be a number').isNumeric(),
      check('cost', 'Cost is required and must be a number').isNumeric(),
      check('quantity', 'Quantity is required and must be a number').isNumeric(),
      check('reorderLevel', 'Reorder level is required and must be a number').isNumeric(),
      check('supplier', 'Supplier is required').not().isEmpty(),
      check('sku', 'SKU is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Create product validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      cost,
      quantity,
      reorderLevel,
      supplier,
      location,
      sku,
      barcode,
      images,
      attributes
    } = req.body;

    try {
      // Get all products
      const products = await readData('products.json');
      
      // Check if SKU is already in use
      if (products.some(product => product.sku === sku)) {
        logger.warn('Create product failed: SKU already exists', { sku });
        return res.status(400).json({ message: 'SKU is already in use' });
      }

      // Create product object
      const newProduct = {
        id: uuidv4(),
        name,
        description,
        category,
        subcategory: subcategory || '',
        price: parseFloat(price),
        cost: parseFloat(cost),
        quantity: parseInt(quantity),
        reorderLevel: parseInt(reorderLevel),
        supplier,
        location: location || '',
        sku,
        barcode: barcode || '',
        images: images || [],
        attributes: attributes || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add product to array
      products.push(newProduct);
      
      // Write updated products array to file
      await writeData('products.json', products);
      
      logger.info('Product created successfully', { productId: newProduct.id });
      res.status(201).json(newProduct);
    } catch (error) {
      logger.error('Create product error', { error: error.message });
      res.status(500).json({ message: 'Server error creating product' });
    }
  }
);

/**
 * @route   PUT api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put('/:id', adminAuth, async (req, res) => {
  const {
    name,
    description,
    category,
    subcategory,
    price,
    cost,
    quantity,
    reorderLevel,
    supplier,
    location,
    sku,
    barcode,
    images,
    attributes
  } = req.body;
  
  try {
    // Get product by ID
    let product = await getItemById('products.json', req.params.id);
    
    if (!product) {
      logger.warn('Update product failed: Product not found', { productId: req.params.id });
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // If SKU is being changed, check if it's already in use by another product
    if (sku && sku !== product.sku) {
      const products = await readData('products.json');
      if (products.some(p => p.sku === sku && p.id !== req.params.id)) {
        logger.warn('Update product failed: SKU already exists', { sku });
        return res.status(400).json({ message: 'SKU is already in use by another product' });
      }
    }
    
    // Create updated product object
    const updatedProduct = {
      name: name || product.name,
      description: description || product.description,
      category: category || product.category,
      subcategory: subcategory !== undefined ? subcategory : product.subcategory,
      price: price !== undefined ? parseFloat(price) : product.price,
      cost: cost !== undefined ? parseFloat(cost) : product.cost,
      quantity: quantity !== undefined ? parseInt(quantity) : product.quantity,
      reorderLevel: reorderLevel !== undefined ? parseInt(reorderLevel) : product.reorderLevel,
      supplier: supplier || product.supplier,
      location: location !== undefined ? location : product.location,
      sku: sku || product.sku,
      barcode: barcode !== undefined ? barcode : product.barcode,
      images: images || product.images,
      attributes: attributes !== undefined ? attributes : product.attributes,
      updatedAt: new Date().toISOString()
    };
    
    // Update product
    product = await updateItem('products.json', req.params.id, updatedProduct);
    
    if (!product) {
      logger.warn('Update product failed: Product not found during update operation', { productId: req.params.id });
      return res.status(404).json({ message: 'Product not found' });
    }
    
    logger.info('Product updated successfully', { productId: product.id });
    res.json(product);
  } catch (error) {
    logger.error('Update product error', { productId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error updating product' });
  }
});

/**
 * @route   DELETE api/products/:id
 * @desc    Delete product
 * @access  Private/Admin
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Delete product
    const deleted = await deleteItem('products.json', req.params.id);
    
    if (!deleted) {
      logger.warn('Delete product failed: Product not found', { productId: req.params.id });
      return res.status(404).json({ message: 'Product not found' });
    }
    
    logger.info('Product deleted successfully', { productId: req.params.id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Delete product error', { productId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

/**
 * @route   PUT api/products/:id/adjust-quantity
 * @desc    Adjust product quantity
 * @access  Private
 */
router.put(
  '/:id/adjust-quantity',
  [
    auth,
    [
      check('adjustment', 'Adjustment value is required and must be a number').isNumeric(),
      check('reason', 'Reason is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Adjust quantity validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { adjustment, reason } = req.body;
    const adjustmentValue = parseInt(adjustment);

    try {
      // Get product by ID
      let product = await getItemById('products.json', req.params.id);
      
      if (!product) {
        logger.warn('Adjust quantity failed: Product not found', { productId: req.params.id });
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Calculate new quantity
      const newQuantity = product.quantity + adjustmentValue;
      
      // Prevent negative quantity
      if (newQuantity < 0) {
        logger.warn('Adjust quantity failed: Adjustment would result in negative quantity', { 
          productId: req.params.id, 
          currentQuantity: product.quantity,
          adjustment: adjustmentValue 
        });
        return res.status(400).json({ message: 'Adjustment would result in negative quantity' });
      }
      
      // Update product quantity
      product = await updateItem('products.json', req.params.id, {
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
      
      if (!product) {
        logger.warn('Adjust quantity failed: Product not found during update operation', { productId: req.params.id });
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Create an inventory adjustment transaction (in a real app, we would create a transaction record)
      logger.info('Product quantity adjusted', { 
        productId: product.id, 
        previousQuantity: product.quantity - adjustmentValue,
        newQuantity: product.quantity,
        adjustment: adjustmentValue,
        reason,
        userId: req.user.id
      });
      
      res.json(product);
    } catch (error) {
      logger.error('Adjust quantity error', { productId: req.params.id, error: error.message });
      res.status(500).json({ message: 'Server error adjusting product quantity' });
    }
  }
);

/**
 * @route   GET api/products/categories
 * @desc    Get all product categories
 * @access  Private
 */
router.get('/categories/all', auth, async (req, res) => {
  try {
    // Get all products
    const products = await readData('products.json');
    
    // Extract unique categories
    const categories = [...new Set(products.map(product => product.category))];
    
    res.json(categories);
  } catch (error) {
    logger.error('Get product categories error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving product categories' });
  }
});

module.exports = router; 