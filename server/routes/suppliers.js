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
 * @route   GET api/suppliers
 * @desc    Get all suppliers
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { active, category, search } = req.query;
    
    // Get all suppliers
    let suppliers = await readData('suppliers.json');
    
    // Apply filters if provided
    if (active === 'true') {
      suppliers = suppliers.filter(supplier => supplier.active === true);
    } else if (active === 'false') {
      suppliers = suppliers.filter(supplier => supplier.active === false);
    }
    
    if (category) {
      suppliers = suppliers.filter(supplier => 
        supplier.productCategories && supplier.productCategories.includes(category)
      );
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      suppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) || 
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json(suppliers);
  } catch (error) {
    logger.error('Get all suppliers error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving suppliers' });
  }
});

/**
 * @route   GET api/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Get supplier by ID
    const supplier = await getItemById('suppliers.json', req.params.id);
    
    if (!supplier) {
      logger.warn('Get supplier by ID failed: Supplier not found', { supplierId: req.params.id });
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    logger.error('Get supplier by ID error', { supplierId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error retrieving supplier data' });
  }
});

/**
 * @route   POST api/suppliers
 * @desc    Create a new supplier
 * @access  Private/Admin
 */
router.post(
  '/',
  [
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone number is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Create supplier validation failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      productCategories,
      paymentTerms,
      leadTime,
      minimumOrderQuantity,
      notes
    } = req.body;

    try {
      // Get all suppliers
      const suppliers = await readData('suppliers.json');
      
      // Check if email is already in use
      if (suppliers.some(supplier => supplier.email === email)) {
        logger.warn('Create supplier failed: Email already exists', { email });
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }

      // Create supplier object
      const newSupplier = {
        id: uuidv4(),
        name,
        contactPerson: contactPerson || '',
        email,
        phone,
        address: address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        productCategories: productCategories || [],
        paymentTerms: paymentTerms || '',
        leadTime: leadTime ? parseInt(leadTime) : 0,
        minimumOrderQuantity: minimumOrderQuantity ? parseInt(minimumOrderQuantity) : 0,
        active: true,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add supplier to array
      suppliers.push(newSupplier);
      
      // Write updated suppliers array to file
      await writeData('suppliers.json', suppliers);
      
      logger.info('Supplier created successfully', { supplierId: newSupplier.id });
      res.status(201).json(newSupplier);
    } catch (error) {
      logger.error('Create supplier error', { error: error.message });
      res.status(500).json({ message: 'Server error creating supplier' });
    }
  }
);

/**
 * @route   PUT api/suppliers/:id
 * @desc    Update supplier
 * @access  Private/Admin
 */
router.put('/:id', adminAuth, async (req, res) => {
  const {
    name,
    contactPerson,
    email,
    phone,
    address,
    productCategories,
    paymentTerms,
    leadTime,
    minimumOrderQuantity,
    active,
    notes
  } = req.body;
  
  try {
    // Get supplier by ID
    let supplier = await getItemById('suppliers.json', req.params.id);
    
    if (!supplier) {
      logger.warn('Update supplier failed: Supplier not found', { supplierId: req.params.id });
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // If email is being changed, check if it's already in use by another supplier
    if (email && email !== supplier.email) {
      const suppliers = await readData('suppliers.json');
      if (suppliers.some(s => s.email === email && s.id !== req.params.id)) {
        logger.warn('Update supplier failed: Email already exists', { email });
        return res.status(400).json({ message: 'Email is already in use by another supplier' });
      }
    }
    
    // Create updated supplier object
    const updatedSupplier = {
      name: name || supplier.name,
      contactPerson: contactPerson !== undefined ? contactPerson : supplier.contactPerson,
      email: email || supplier.email,
      phone: phone || supplier.phone,
      address: address || supplier.address,
      productCategories: productCategories || supplier.productCategories,
      paymentTerms: paymentTerms !== undefined ? paymentTerms : supplier.paymentTerms,
      leadTime: leadTime !== undefined ? parseInt(leadTime) : supplier.leadTime,
      minimumOrderQuantity: minimumOrderQuantity !== undefined ? parseInt(minimumOrderQuantity) : supplier.minimumOrderQuantity,
      active: active !== undefined ? active : supplier.active,
      notes: notes !== undefined ? notes : supplier.notes,
      updatedAt: new Date().toISOString()
    };
    
    // Update supplier
    supplier = await updateItem('suppliers.json', req.params.id, updatedSupplier);
    
    if (!supplier) {
      logger.warn('Update supplier failed: Supplier not found during update operation', { supplierId: req.params.id });
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    logger.info('Supplier updated successfully', { supplierId: supplier.id });
    res.json(supplier);
  } catch (error) {
    logger.error('Update supplier error', { supplierId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error updating supplier' });
  }
});

/**
 * @route   DELETE api/suppliers/:id
 * @desc    Delete supplier
 * @access  Private/Admin
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Check if supplier has related products
    const products = await readData('products.json');
    const hasRelatedProducts = products.some(product => product.supplier === req.params.id);
    
    if (hasRelatedProducts) {
      logger.warn('Delete supplier failed: Supplier has related products', { supplierId: req.params.id });
      return res.status(400).json({ 
        message: 'Cannot delete supplier with related products. Please reassign or delete the products first.' 
      });
    }
    
    // Delete supplier
    const deleted = await deleteItem('suppliers.json', req.params.id);
    
    if (!deleted) {
      logger.warn('Delete supplier failed: Supplier not found', { supplierId: req.params.id });
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    logger.info('Supplier deleted successfully', { supplierId: req.params.id });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    logger.error('Delete supplier error', { supplierId: req.params.id, error: error.message });
    res.status(500).json({ message: 'Server error deleting supplier' });
  }
});

/**
 * @route   GET api/suppliers/categories/all
 * @desc    Get all supplier product categories
 * @access  Private
 */
router.get('/categories/all', auth, async (req, res) => {
  try {
    // Get all suppliers
    const suppliers = await readData('suppliers.json');
    
    // Extract all categories from all suppliers
    const allCategories = suppliers.reduce((categories, supplier) => {
      if (supplier.productCategories && Array.isArray(supplier.productCategories)) {
        return [...categories, ...supplier.productCategories];
      }
      return categories;
    }, []);
    
    // Remove duplicates
    const uniqueCategories = [...new Set(allCategories)];
    
    res.json(uniqueCategories);
  } catch (error) {
    logger.error('Get supplier categories error', { error: error.message });
    res.status(500).json({ message: 'Server error retrieving supplier categories' });
  }
});

module.exports = router; 