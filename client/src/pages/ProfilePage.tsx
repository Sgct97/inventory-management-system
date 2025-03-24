import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonOutlined as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Define types
interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setFormErrors({});
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (editMode) {
      // Only validate password fields if they're filled out
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          errors.currentPassword = 'Current password is required to set a new password';
        }
        
        if (formData.newPassword.length < 8) {
          errors.newPassword = 'Password must be at least 8 characters';
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const updateData = {
        name: formData.name,
        email: formData.email,
      };
      
      // Add password update if provided
      if (formData.newPassword && formData.currentPassword) {
        Object.assign(updateData, {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        });
      }
      
      // Update profile
      const response = await axios.put('/api/users/profile', updateData);
      
      // Update local user state
      updateUserProfile(response.data);
      
      setSuccess(true);
      setEditMode(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      if (err.response?.status === 401) {
        setError('Current password is incorrect');
      } else {
        setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={() => setSuccess(false)}
        message="Profile updated successfully"
      />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem',
              }}
            >
              {user?.name?.charAt(0) || <PersonIcon fontSize="large" />}
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {user?.name}
            </Typography>
            
            <Typography variant="body1" color="textSecondary" gutterBottom>
              {user?.email}
            </Typography>
            
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Role: {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
            </Typography>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={toggleEditMode}
              startIcon={<EditIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              {editMode ? 'Cancel Editing' : 'Edit Profile'}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              fullWidth
              sx={{ mt: 2 }}
            >
              Logout
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {editMode ? 'Edit Profile' : 'Profile Details'}
              </Typography>
              
              {editMode && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    disabled={!editMode || loading}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    disabled={!editMode || loading}
                    required
                  />
                </Grid>
                
                {editMode && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Change Password (optional)
                      </Typography>
                      <Divider />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        error={!!formErrors.currentPassword}
                        helperText={formErrors.currentPassword}
                        disabled={loading}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        error={!!formErrors.newPassword}
                        helperText={formErrors.newPassword}
                        disabled={loading}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        error={!!formErrors.confirmPassword}
                        helperText={formErrors.confirmPassword}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      {loading && <CircularProgress size={24} sx={{ mr: 1 }} />}
                      
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                        sx={{ display: { xs: 'flex', md: 'none' }, width: '100%' }}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </form>
            
            {!editMode && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage; 