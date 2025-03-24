import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// Define types
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  reorderLevel: number;
  supplierId: string;
  supplierName?: string;
  barcode?: string;
  sku?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  reorderLevel: number;
  supplierId: string;
  supplier: string;
  barcode: string;
  sku: string;
}

interface Supplier {
  id: string;
  name: string;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  cost: 0,
  quantity: 0,
  reorderLevel: 5,
  supplierId: '',
  supplier: '',
  barcode: '',
  sku: '',
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Dialog control
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Fetch products and suppliers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products
        const productsResponse = await axios.get('/api/products');
        
        // Fetch suppliers for dropdown
        const suppliersResponse = await axios.get('/api/suppliers');
        
        // Combine data
        const productsWithSupplierNames = productsResponse.data.map((product: Product) => {
          const supplier = suppliersResponse.data.find(
            (s: Supplier) => s.id === product.supplierId
          );
          return {
            ...product,
            supplierName: supplier ? supplier.name : 'Unknown Supplier',
          };
        });
        
        setProducts(productsWithSupplierNames);
        setSuppliers(suppliersResponse.data);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle search
  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Dialog handlers
  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        cost: product.price,
        quantity: product.quantity,
        reorderLevel: product.reorderLevel,
        supplierId: product.supplierId,
        supplier: product.supplierName || '',
        barcode: product.barcode || '',
        sku: product.sku || '',
      });
      setEditingId(product.id);
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setFormErrors({});
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (['price', 'quantity', 'reorderLevel'].includes(name)) {
      setFormData({
        ...formData,
        [name]: isNaN(parseFloat(value)) ? 0 : parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (formData.cost <= 0) {
      errors.cost = 'Cost must be greater than 0';
    }
    
    if (formData.quantity < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }
    
    if (formData.reorderLevel < 0) {
      errors.reorderLevel = 'Reorder level cannot be negative';
    }
    
    if (!formData.supplierId) {
      errors.supplierId = 'Supplier is required';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
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
    setError(null);

    try {
      // Create payload with correct field names for server
      const payload = {
        ...formData,
        supplier: formData.supplierId // Map the supplierId to supplier as expected by server
      };

      if (editingId) {
        // Update existing product
        await axios.put(`/api/products/${editingId}`, payload);
      } else {
        // Create new product
        await axios.post('/api/products', payload);
      }
      
      // Refresh product list
      const response = await axios.get('/api/products');
      
      // Add supplier names
      const productsWithSupplierNames = response.data.map((product: Product) => {
        const supplier = suppliers.find((s) => s.id === product.supplierId);
        return {
          ...product,
          supplierName: supplier ? supplier.name : 'Unknown Supplier',
        };
      });
      
      setProducts(productsWithSupplierNames);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving product:', err);
      const responseErrors = err.response?.data?.errors;
      
      if (responseErrors) {
        // Convert API validation errors to our format
        const fieldErrors: Record<string, string> = {};
        responseErrors.forEach((error: { field: string; message: string }) => {
          fieldErrors[error.field] = error.message;
        });
        setFormErrors(fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to save product. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        setProducts(products.filter((product) => product.id !== id));
      } catch (err: any) {
        console.error('Error deleting product:', err);
        setError(err.response?.data?.message || 'Failed to delete product. Please try again.');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search products by name, description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Reorder Level</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1">{product.name}</Typography>
                        <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                          {product.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" />
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Typography
                        color={product.quantity <= product.reorderLevel ? 'error' : 'inherit'}
                        fontWeight={product.quantity <= product.reorderLevel ? 'bold' : 'normal'}
                      >
                        {product.quantity}
                      </Typography>
                      {product.quantity <= product.reorderLevel && (
                        <Chip 
                          size="small" 
                          color="error" 
                          label="Low Stock" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{product.reorderLevel}</TableCell>
                    <TableCell>{product.supplierName}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(product)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteProduct(product.id)} color="error">
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                error={!!formErrors.category}
                helperText={formErrors.category}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: '$',
                }}
                error={!!formErrors.price}
                helperText={formErrors.price}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: '$',
                }}
                error={!!formErrors.cost}
                helperText={formErrors.cost}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Reorder Level"
                name="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={handleInputChange}
                error={!!formErrors.reorderLevel}
                helperText={formErrors.reorderLevel}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth error={!!formErrors.supplierId}>
                <InputLabel>Supplier</InputLabel>
                <Select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={e => {
                    const selectedSupplierId = e.target.value as string;
                    
                    setFormData({
                      ...formData,
                      supplierId: selectedSupplierId,
                      supplier: selectedSupplierId // Set the supplier field to match the ID as required by server
                    });
                    
                    if (formErrors.supplierId) {
                      setFormErrors({
                        ...formErrors,
                        supplierId: '',
                      });
                    }
                  }}
                  label="Supplier"
                >
                  <MenuItem value="">
                    <em>Select a supplier</em>
                  </MenuItem>
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

            {/* Add SKU and Barcode fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU (Stock Keeping Unit)"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                helperText={formErrors.sku || "Unique identifier for internal use"}
                error={!!formErrors.sku}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                helperText="Product barcode (UPC, EAN, etc.) for scanning"
              />
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
            {submitLoading
              ? 'Saving...'
              : editingId
              ? 'Update Product'
              : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage; 