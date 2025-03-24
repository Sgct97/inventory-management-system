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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

// Define types
interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | string;
  active: boolean;
  notes?: string;
}

interface SupplierFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  notes: string;
}

const initialFormData: SupplierFormData = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  active: true,
  notes: '',
};

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Dialog control
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  
  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/suppliers');
        setSuppliers(response.data);
      } catch (err: any) {
        console.error('Error fetching suppliers:', err);
        setError(err.response?.data?.message || 'Failed to fetch suppliers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Handle search
  const filteredSuppliers = suppliers.filter((supplier) => 
    (supplier.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (supplier.contactName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (supplier.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (typeof supplier.address === 'string' && 
      (supplier.address?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
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
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: typeof supplier.address === 'string' 
          ? supplier.address 
          : `${supplier.address.street}, ${supplier.address.city}, ${supplier.address.state} ${supplier.address.zipCode}, ${supplier.address.country}`,
        active: supplier.active,
        notes: supplier.notes || '',
      });
      setEditingId(supplier.id);
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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
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
      errors.name = 'Supplier name is required';
    }
    
    if (!formData.contactName.trim()) {
      errors.contactName = 'Contact name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
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
      if (editingId) {
        // Update existing supplier
        await axios.put(`/api/suppliers/${editingId}`, formData);
      } else {
        // Create new supplier
        await axios.post('/api/suppliers', formData);
      }
      
      // Refresh supplier list
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving supplier:', err);
      const responseErrors = err.response?.data?.errors;
      
      if (responseErrors) {
        // Convert API validation errors to our format
        const fieldErrors: Record<string, string> = {};
        responseErrors.forEach((error: { field: string; message: string }) => {
          fieldErrors[error.field] = error.message;
        });
        setFormErrors(fieldErrors);
      } else {
        setError(err.response?.data?.message || 'Failed to save supplier. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Toggle supplier active status
  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const updatedSupplier = { ...supplier, active: !supplier.active };
      await axios.put(`/api/suppliers/${supplier.id}`, updatedSupplier);
      
      // Update local state
      setSuppliers(
        suppliers.map((s) => (s.id === supplier.id ? updatedSupplier : s))
      );
    } catch (err: any) {
      console.error('Error updating supplier status:', err);
      setError(err.response?.data?.message || 'Failed to update supplier status. Please try again.');
    }
  };
  
  // Delete supplier
  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`/api/suppliers/${id}`);
        setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
      } catch (err: any) {
        console.error('Error deleting supplier:', err);
        setError(err.response?.data?.message || 'Failed to delete supplier. Please try again.');
      }
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Suppliers</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Supplier
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
              placeholder="Search suppliers by name, contact, email or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Suppliers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Communication</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {supplier.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{supplier.contactName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{supplier.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{supplier.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                          {typeof supplier.address === 'string' 
                            ? supplier.address 
                            : `${supplier.address.street}, ${supplier.address.city}, ${supplier.address.state} ${supplier.address.zipCode}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={supplier.active ? 'Active' : 'Inactive'} 
                        color={supplier.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(supplier)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteSupplier(supplier.id)} color="error">
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
          count={filteredSuppliers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add/Edit Supplier Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                error={!!formErrors.contactName}
                helperText={formErrors.contactName}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                error={!!formErrors.address}
                helperText={formErrors.address}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.active}
                    onChange={handleInputChange}
                    name="active"
                    color="primary"
                  />
                }
                label="Active Supplier"
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
            {submitLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersPage; 