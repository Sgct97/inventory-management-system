import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
} from '@mui/material';
import {
  SentimentDissatisfied as SadFaceIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 5,
          mt: 10,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <SadFaceIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h3" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>
        
        <Typography variant="h5" color="text.secondary" paragraph>
          Oops! The page you are looking for does not exist.
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          The page you requested could not be found. It might have been removed, 
          renamed, or is temporarily unavailable.
        </Typography>
        
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFoundPage; 