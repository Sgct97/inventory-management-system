import React from 'react';
import { Box, Typography } from '@mui/material';
import QuickScanForm from '../components/BarcodeScanner/QuickScanForm';

const QuickScanPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quick Scan
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Scan barcodes to quickly process inventory transactions. Use for purchases (receiving inventory) 
        or sales (selling products).
      </Typography>
      
      <QuickScanForm />
    </Box>
  );
};

export default QuickScanPage; 