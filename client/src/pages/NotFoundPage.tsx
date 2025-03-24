import React from 'react';
import { Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Container sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center' 
    }}>
      <Typography variant="h1" color="primary" sx={{ fontSize: '80px', mb: 2 }}>
        404
      </Typography>
      
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      
      <Button 
        component={Link} 
        to="/" 
        variant="contained" 
        color="primary"
        sx={{ mt: 2 }}
      >
        Back to Home
      </Button>
    </Container>
  );
};

export default NotFoundPage; 