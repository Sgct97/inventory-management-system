import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Tabs,
  Tab,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBasket as ShoppingBasketIcon,
  LocalShipping as ShippingIcon,
  Info as InfoIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { SelectChangeEvent } from '@mui/material/Select';

// Define types
interface Transaction {
  id: string;
  type: 'purchase' | 'sale';
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  totalAmount: number;
  date: string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
}

interface TransactionFormData {
  type: 'purchase' | 'sale';
  productId: string;
  quantity: number;
  price: number;
  supplierId?: string;
  notes: string;
  date: Date;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  supplierId: string;
}

interface Supplier {
  id: string;
  name: string;
}

const initialFormData: TransactionFormData = {
  type: 'purchase',
  productId: '',
  quantity: 1,
  price: 0,
  supplierId: '',
  notes: '',
  date: new Date(),
};

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  
  // Pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Dialog control
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch transactions
        const transactionsResponse = await axios.get('/api/transactions');
        
        // Fetch products for dropdown
        const productsResponse = await axios.get('/api/products');
        
        // Fetch suppliers for dropdown
        const suppliersResponse = await axios.get('/api/suppliers');
        
        // Combine data
        const transactionsWithNames = transactionsResponse.data.map((transaction: Transaction) => {
          const product = productsResponse.data.find(
            (p: Product) => p.id === transaction.productId
          );
          
          const supplier = transaction.supplierId
            ? suppliersResponse.data.find((s: Supplier) => s.id === transaction.supplierId)
            : null;
          
          return {
            ...transaction,
            productName: product ? product.name : 'Unknown Product',
            supplierName: supplier ? supplier.name : undefined,
          };
        });
        
        setTransactions(transactionsWithNames);
        setProducts(productsResponse.data);
        setSuppliers(suppliersResponse.data);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle tab change
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };
  
  // Filter transactions based on search and tab
  const filteredTransactions = transactions
    .filter((transaction) => {
      // Filter by tab (All, Purchases, Sales)
      if (tabValue === 1 && transaction.type !== 'purchase') {
        return false;
      }
      if (tabValue === 2 && transaction.type !== 'sale') {
        return false;
      }
      
      // Filter by search
      return (
        transaction.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Dialog handlers
  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedProduct(null);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Update the handlers to separate by input type
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear the error for this field
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear the error for this field
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const handleProductSelectChange = (e: SelectChangeEvent) => {
    const productId = e.target.value;
    const selected = products.find(product => product.id === productId);
    
    if (selected) {
      setFormData({
        ...formData,
        productId,
        price: selected.price
      });
    } else {
      setFormData({
        ...formData,
        productId: '',
        price: 0
      });
    }
    
    // Clear the error for this field
    if (formErrors.productId) {
      setFormErrors({
        ...formErrors,
        productId: ''
      });
    }
  };
  
  const handleTypeSelectChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      type: e.target.value as 'purchase' | 'sale',
      supplierId: e.target.value === 'sale' ? '' : formData.supplierId
    });
  };
  
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setFormData({
        ...formData,
        date: newDate,
      });
    }
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.productId) {
      errors.productId = 'Product is required';
    }
    
    if (formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    if (formData.type === 'purchase' && !formData.supplierId) {
      errors.supplierId = 'Supplier is required for purchases';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    // For sales, check if we have enough inventory
    if (formData.type === 'sale' && selectedProduct && formData.quantity > selectedProduct.quantity) {
      errors.quantity = `Not enough inventory. Available: ${selectedProduct.quantity}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit form
  const handleSubmitForm = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitLoading(true);
    try {
      // Prepare data for API
      const transactionData = {
        ...formData,
        date: formData.date.toISOString(),
        totalAmount: formData.price * formData.quantity,
      };
      
      // Create new transaction
      await axios.post('/api/transactions', transactionData);
      
      // Refresh data
      const transactionsResponse = await axios.get('/api/transactions');
      const productsResponse = await axios.get('/api/products');
      
      // Combine data
      const transactionsWithNames = transactionsResponse.data.map((transaction: Transaction) => {
        const product = productsResponse.data.find(
          (p: Product) => p.id === transaction.productId
        );
        
        const supplier = transaction.supplierId
          ? suppliers.find((s) => s.id === transaction.supplierId)
          : null;
        
        return {
          ...transaction,
          productName: product ? product.name : 'Unknown Product',
          supplierName: supplier ? supplier.name : undefined,
        };
      });
      
      setTransactions(transactionsWithNames);
      setProducts(productsResponse.data);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      const responseErrors = err.response?.data?.errors;
      
      if (responseErrors) {
        // Convert API validation errors to our format
        const fieldErrors: Record<string, string> = {};
        responseErrors.forEach((error: { field: string; message: string }) => {
          fieldErrors[error.field] = error.message;
        });
        setFormErrors(fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to create transaction. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/api/transactions/${id}`);
        setTransactions(transactions.filter((transaction) => transaction.id !== id));
      } catch (err: any) {
        console.error('Error deleting transaction:', err);
        setError(err.response?.data?.message || 'Failed to delete transaction. Please try again.');
      }
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Transactions</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Transaction
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabs & Search Bar */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Transactions" />
          <Tab 
            label="Purchases" 
            icon={<ShoppingCartIcon fontSize="small" />} 
            iconPosition="start"
          />
          <Tab 
            label="Sales" 
            icon={<ShoppingBasketIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />
        </Box>
      </Paper>
      
      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                        color={transaction.type === 'purchase' ? 'primary' : 'success'}
                        size="small"
                        icon={transaction.type === 'purchase' ? <ShoppingCartIcon /> : <ShoppingBasketIcon />}
                      />
                    </TableCell>
                    <TableCell>{transaction.productName}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>${transaction.price !== undefined ? transaction.price.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ${transaction.totalAmount !== undefined ? transaction.totalAmount.toFixed(2) : '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {transaction.supplierName || '-'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add Transaction Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
                <Select
                  labelId="transaction-type-label"
                  value={formData.type}
                  onChange={handleTypeSelectChange}
                  label="Transaction Type"
                  name="type"
                >
                  <MenuItem value="purchase">Purchase (Inventory In)</MenuItem>
                  <MenuItem value="sale">Sale (Inventory Out)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.productId}>
                <InputLabel id="product-select-label">Product</InputLabel>
                <Select
                  labelId="product-select-label"
                  value={formData.productId}
                  onChange={handleProductSelectChange}
                  label="Product"
                  name="productId"
                >
                  <MenuItem value="">Select a product</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} {formData.type === 'sale' && `(In stock: ${product.quantity})`}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.productId && (
                  <FormHelperText>{formErrors.productId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {formData.type === 'purchase' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!formErrors.supplierId}>
                  <InputLabel id="supplier-select-label">Supplier</InputLabel>
                  <Select
                    labelId="supplier-select-label"
                    value={formData.supplierId}
                    onChange={handleSelectChange}
                    label="Supplier"
                    name="supplierId"
                  >
                    <MenuItem value="">Select a supplier</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.supplierId && (
                    <FormHelperText>{formErrors.supplierId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} sm={formData.type === 'sale' ? 6 : 4}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleTextInputChange}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={formData.type === 'sale' ? 6 : 4}>
              <TextField
                fullWidth
                label="Price per Unit"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleTextInputChange}
                error={!!formErrors.price}
                helperText={formErrors.price}
                margin="normal"
                InputProps={{ 
                  startAdornment: '$',
                  inputProps: { min: 0.01, step: 0.01 }
                }}
              />
            </Grid>
            
            {formData.type === 'purchase' && (
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Transaction Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        error: !!formErrors.date,
                        helperText: formErrors.date,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleTextInputChange}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Transaction Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Total Items:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.quantity}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total Amount:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    ${(formData.price * formData.quantity).toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitForm}
            variant="contained"
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={20} /> : null}
          >
            {submitLoading ? 'Creating...' : 'Create Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage; 