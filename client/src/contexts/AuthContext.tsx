import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUserProfile: (userData: User) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if token is valid on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;

      try {
        setLoading(true);
        // Set default Authorization header for axios
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Fetch user data
        const response = await axios.get('/api/auth/user');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Token validation error:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['x-auth-token'];
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/auth/login', { username, password });
      const { token: newToken, user: userData } = response.data;

      // Save token to local storage
      localStorage.setItem('token', newToken);
      
      // Set axios default headers
      axios.defaults.headers.common['x-auth-token'] = newToken;
      
      // Update state
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'An error occurred during login. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Add the updateUserProfile function
  const updateUserProfile = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    token,
    loading,
    error,
    login,
    logout,
    clearError,
    updateUserProfile
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext; 