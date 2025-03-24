const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/authMiddleware');
const { readDataFromFile, writeDataToFile } = require('../utils/fileUtils');

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Private
 */
router.get('/', protect, (req, res) => {
  const products = readDataFromFile('products.json');
  res.json(products);
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/:id', protect, (req, res) => {
  const products = readDataFromFile('products.json');
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  res.json(product);
});

/**
 * @route   POST /api/products
 * @desc    Create a product
 * @access  Private
 */
router.post('/', protect, (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      quantity,
      reorderLevel,
      supplierId
    } = req.body;
    
    // Validation
    if (!name || !description || !category || !price || !supplierId) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, description, category, price, supplierId'
      });
    }
    
    const products = readDataFromFile('products.json');
    
    const newProduct = {
      id: uuidv4(),
      name,
      description,
      category,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      reorderLevel: parseInt(reorderLevel) || 5,
      supplierId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    if (writeDataToFile('products.json', products)) {
      console.log('Product created successfully', { productId: newProduct.id });
      res.status(201).json(newProduct);
    } else {
      res.status(500).json({ message: 'Failed to create product' });
    }
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private
 */
router.put('/:id', protect, (req, res) => {
  try {
    const products = readDataFromFile('products.json');
    const index = products.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const updatedProduct = {
      ...products[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure id doesn't change
    updatedProduct.id = req.params.id;
    
    // Ensure numeric types
    if (req.body.price) updatedProduct.price = parseFloat(req.body.price);
    if (req.body.quantity) updatedProduct.quantity = parseInt(req.body.quantity);
    if (req.body.reorderLevel) updatedProduct.reorderLevel = parseInt(req.body.reorderLevel);
    
    products[index] = updatedProduct;
    
    if (writeDataToFile('products.json', products)) {
      res.json(updatedProduct);
    } else {
      res.status(500).json({ message: 'Failed to update product' });
    }
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private
 */
router.delete('/:id', protect, (req, res) => {
  try {
    const products = readDataFromFile('products.json');
    const filteredProducts = products.filter(p => p.id !== req.params.id);
    
    if (products.length === filteredProducts.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (writeDataToFile('products.json', filteredProducts)) {
      res.json({ message: 'Product removed' });
    } else {
      res.status(500).json({ message: 'Failed to delete product' });
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 