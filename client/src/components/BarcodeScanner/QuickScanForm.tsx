import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBasket as ShoppingBasketIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';

// Define types
interface ScannedItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  sku: string;
}

interface Supplier {
  id: string;
  name: string;
}

type TransactionType = 'purchase' | 'sale';

const QuickScanForm: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('/api/suppliers');
        setSuppliers(response.data);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Handle barcode input scanning/entry
  const handleBarcodeSubmit = async () => {
    if (!barcodeInput.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Search for product by barcode
      const response = await axios.get(`/api/products/barcode/${barcodeInput}`);
      const product = response.data;
      
      // Check if item is already scanned
      const existingItem = scannedItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Increment quantity if already in the list
        setScannedItems(scannedItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        // Add new item to the list
        setScannedItems([
          ...scannedItems,
          {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            quantity: 1,
            sku: product.sku
          }
        ]);
      }
      
      // Clear the input
      setBarcodeInput('');
    } catch (err: any) {
      console.error('Error scanning barcode:', err);
      if (err.response?.status === 404) {
        setError(`Product with barcode "${barcodeInput}" not found. Please add this product in the Products page first.`);
      } else {
        setError(err.response?.data?.message || 'Error scanning barcode. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSubmit();
    }
  };
  
  // Handle quantity adjustments
  const increaseQuantity = (id: string) => {
    setScannedItems(scannedItems.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };
  
  const decreaseQuantity = (id: string) => {
    setScannedItems(scannedItems.map(item =>
      item.id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    ));
  };
  
  const removeItem = (id: string) => {
    setScannedItems(scannedItems.filter(item => item.id !== id));
  };
  
  // Calculate total amount
  const calculateTotal = (): number => {
    return scannedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // Handle transaction type change
  const handleTransactionTypeChange = (e: SelectChangeEvent) => {
    setTransactionType(e.target.value as TransactionType);
  };
  
  // Handle supplier change
  const handleSupplierChange = (e: SelectChangeEvent) => {
    setSelectedSupplier(e.target.value);
  };
  
  // Submit transaction
  const submitTransaction = async () => {
    if (scannedItems.length === 0) return;
    
    // For purchase transactions, a supplier is required
    if (transactionType === 'purchase' && !selectedSupplier) {
      setError('Please select a supplier for purchase transactions.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare transaction data with all required fields
      const transactionData = {
        type: transactionType,
        reference: `${transactionType === 'purchase' ? 'PO' : 'SO'}-${Date.now()}`, // Generate a reference
        date: new Date().toISOString(),
        items: scannedItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        supplierId: transactionType === 'purchase' ? selectedSupplier : undefined,
        totalAmount: calculateTotal(),
        status: 'completed', // Required field
        paymentStatus: 'paid', // Required field
        notes: `Quick ${transactionType} transaction created via barcode scanner`
      };
      
      // Submit transaction to API
      await axios.post('/api/transactions', transactionData);
      
      // Show success message
      setSuccess(`${transactionType === 'purchase' ? 'Purchase' : 'Sale'} transaction completed successfully!`);
      
      // Clear form
      setScannedItems([]);
      if (transactionType === 'purchase') {
        setSelectedSupplier('');
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting transaction:', err);
      setError(err.response?.data?.message || 'Failed to complete transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quick {transactionType === 'purchase' ? 'Purchase' : 'Sale'} Mode
        </Typography>
        
        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
          <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
          <Select
            labelId="transaction-type-label"
            value={transactionType}
            onChange={handleTransactionTypeChange}
            label="Transaction Type"
          >
            <MenuItem value="purchase">
              <ShoppingCartIcon sx={{ mr: 1 }} />
              Purchase (Inventory In)
            </MenuItem>
            <MenuItem value="sale">
              <ShoppingBasketIcon sx={{ mr: 1 }} />
              Sale (Inventory Out)
            </MenuItem>
          </Select>
        </FormControl>
        
        {transactionType === 'purchase' && (
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel id="supplier-label">Supplier</InputLabel>
            <Select
              labelId="supplier-label"
              value={selectedSupplier}
              onChange={handleSupplierChange}
              label="Supplier"
              required={transactionType === 'purchase'}
            >
              <MenuItem value="">
                <em>Select a supplier</em>
              </MenuItem>
              {suppliers.map(supplier => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Scan Barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              helperText="Scan a barcode or enter it manually and press Enter"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBarcodeSubmit}
              disabled={loading || !barcodeInput.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              fullWidth
            >
              {loading ? 'Scanning...' : 'Scan'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="primary"
              component="a"
              href="/products/add"
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/products";
              }}
            >
              Add New Product
            </Button>
          </Grid>
        </Grid>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
        
        {scannedItems.length > 0 && (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => decreaseQuantity(item.id)}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => increaseQuantity(item.id)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => removeItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        Total:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        ${calculateTotal().toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={submitTransaction}
                disabled={loading || scannedItems.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading 
                  ? 'Processing...' 
                  : `Complete ${transactionType === 'purchase' ? 'Purchase' : 'Sale'}`
                }
              </Button>
            </Box>
          </>
        )}
        
        {scannedItems.length === 0 && !loading && !error && !success && (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Scan items to add them to the transaction
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Mock Barcode Scanner (for development only) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Barcodes
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          For testing purposes only. In production, use a real barcode scanner.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={4}>
            <Button 
              variant="outlined" 
              fullWidth
              onClick={() => {
                setBarcodeInput('47382910428');
                setTimeout(() => handleBarcodeSubmit(), 100);
              }}
            >
              Test Product (47382910428)
            </Button>
          </Grid>
          <Grid item xs={6} md={4}>
            <Button 
              variant="outlined" 
              fullWidth
              onClick={() => {
                setBarcodeInput('38291047382');
                setTimeout(() => handleBarcodeSubmit(), 100);
              }}
            >
              Product B (38291047382)
            </Button>
          </Grid>
          <Grid item xs={6} md={4}>
            <Button 
              variant="outlined" 
              fullWidth
              onClick={() => {
                setBarcodeInput('10428382947');
                setTimeout(() => handleBarcodeSubmit(), 100);
              }}
            >
              Product C (10428382947)
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default QuickScanForm; 