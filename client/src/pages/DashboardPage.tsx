import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Define types
interface DashboardStats {
  products: {
    total: number;
    lowStock: number;
    categories: number;
  };
  suppliers: {
    total: number;
    active: number;
  };
  transactions: {
    total: number;
    sales: number;
    purchases: number;
    totalValue: {
      sales: number;
      purchases: number;
    };
  };
}

const initialStats: DashboardStats = {
  products: {
    total: 0,
    lowStock: 0,
    categories: 0,
  },
  suppliers: {
    total: 0,
    active: 0,
  },
  transactions: {
    total: 0,
    sales: 0,
    purchases: 0,
    totalValue: {
      sales: 0,
      purchases: 0,
    },
  },
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get product stats
        const productsResponse = await axios.get('/api/products');
        const products = productsResponse.data;

        // Get supplier stats
        const suppliersResponse = await axios.get('/api/suppliers');
        const suppliers = suppliersResponse.data;

        // Get transaction stats
        const transactionStatsResponse = await axios.get('/api/transactions/summary/stats');
        const transactionStats = transactionStatsResponse.data;

        // Calculate low stock products
        const lowStockProducts = products.filter(
          (product: any) => product.quantity <= product.reorderLevel
        );

        // Get unique categories
        const uniqueCategories = [
          ...new Set(products.map((product: any) => product.category)),
        ].filter(Boolean);

        // Update stats
        setStats({
          products: {
            total: products.length,
            lowStock: lowStockProducts.length,
            categories: uniqueCategories.length,
          },
          suppliers: {
            total: suppliers.length,
            active: suppliers.filter((supplier: any) => supplier.active).length,
          },
          transactions: {
            total: transactionStats.total || 0,
            sales: transactionStats.byType?.sale || 0,
            purchases: transactionStats.byType?.purchase || 0,
            totalValue: {
              sales: transactionStats.totalValue?.sale || 0,
              purchases: transactionStats.totalValue?.purchase || 0,
            },
          },
        });
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(
          err.response?.data?.message || 'Failed to fetch dashboard data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Summary Cards
  const summaryCards = [
    {
      title: 'Total Products',
      value: stats.products.total,
      icon: <InventoryIcon fontSize="large" color="primary" />,
      loading,
    },
    {
      title: 'Low Stock Items',
      value: stats.products.lowStock,
      icon: <WarningIcon fontSize="large" color="error" />,
      loading,
    },
    {
      title: 'Active Suppliers',
      value: stats.suppliers.active,
      icon: <ShippingIcon fontSize="large" color="primary" />,
      loading,
    },
    {
      title: 'Total Transactions',
      value: stats.transactions.total,
      icon: <ReceiptIcon fontSize="large" color="primary" />,
      loading,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {card.title}
                  </Typography>
                  {card.loading ? (
                    <Skeleton variant="text" width={50} height={40} />
                  ) : (
                    <Typography variant="h4">{card.value}</Typography>
                  )}
                </Box>
                {card.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Transactions Overview */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Transactions Overview
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography color="textSecondary" gutterBottom>
              Total Sales
            </Typography>
            {loading ? (
              <Skeleton variant="text" width="50%" height={40} />
            ) : (
              <Typography variant="h5">${stats.transactions.totalValue.sales.toFixed(2)}</Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography color="textSecondary" gutterBottom>
              Total Purchases
            </Typography>
            {loading ? (
              <Skeleton variant="text" width="50%" height={40} />
            ) : (
              <Typography variant="h5">${stats.transactions.totalValue.purchases.toFixed(2)}</Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography color="textSecondary" gutterBottom>
              Profit Margin
            </Typography>
            {loading ? (
              <Skeleton variant="text" width="50%" height={40} />
            ) : (
              <Typography variant="h5">
                ${(stats.transactions.totalValue.sales - stats.transactions.totalValue.purchases).toFixed(2)}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Additional analysis sections would go here */}
    </Box>
  );
};

export default DashboardPage; 