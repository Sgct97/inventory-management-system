const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/authMiddleware');
const { readDataFromFile, writeDataToFile } = require('../utils/fileUtils');

/**
 * @route   GET /api/suppliers
 * @desc    Get all suppliers
 * @access  Private
 */
router.get('/', protect, (req, res) => {
  const suppliers = readDataFromFile('suppliers.json');
  res.json(suppliers);
});

/**
 * @route   GET /api/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private
 */
router.get('/:id', protect, (req, res) => {
  const suppliers = readDataFromFile('suppliers.json');
  const supplier = suppliers.find(s => s.id === req.params.id);
  
  if (!supplier) {
    return res.status(404).json({ message: 'Supplier not found' });
  }
  
  res.json(supplier);
});

/**
 * @route   POST /api/suppliers
 * @desc    Create a supplier
 * @access  Private
 */
router.post('/', protect, (req, res) => {
  try {
    const {
      name,
      contactName,
      email,
      phone,
      address,
      active,
      notes
    } = req.body;
    
    // Validation
    if (!name || !contactName || !email || !phone || !address) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, contactName, email, phone, address'
      });
    }
    
    const suppliers = readDataFromFile('suppliers.json');
    
    const newSupplier = {
      id: uuidv4(),
      name,
      contactName,
      email,
      phone,
      address,
      active: active !== undefined ? active : true,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    suppliers.push(newSupplier);
    
    if (writeDataToFile('suppliers.json', suppliers)) {
      console.log('Supplier created successfully', { supplierId: newSupplier.id });
      res.status(201).json(newSupplier);
    } else {
      res.status(500).json({ message: 'Failed to create supplier' });
    }
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Update a supplier
 * @access  Private
 */
router.put('/:id', protect, (req, res) => {
  try {
    const suppliers = readDataFromFile('suppliers.json');
    const index = suppliers.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    const updatedSupplier = {
      ...suppliers[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure id doesn't change
    updatedSupplier.id = req.params.id;
    
    suppliers[index] = updatedSupplier;
    
    if (writeDataToFile('suppliers.json', suppliers)) {
      res.json(updatedSupplier);
    } else {
      res.status(500).json({ message: 'Failed to update supplier' });
    }
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Delete a supplier
 * @access  Private
 */
router.delete('/:id', protect, (req, res) => {
  try {
    const suppliers = readDataFromFile('suppliers.json');
    const filteredSuppliers = suppliers.filter(s => s.id !== req.params.id);
    
    if (suppliers.length === filteredSuppliers.length) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    if (writeDataToFile('suppliers.json', filteredSuppliers)) {
      res.json({ message: 'Supplier removed' });
    } else {
      res.status(500).json({ message: 'Failed to delete supplier' });
    }
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 