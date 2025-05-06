// src/contexts/AuthContext.jsx - Updated with improved error handling
import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import { showError } from '../utils/modalManager';

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Validate token and get user data
      fetchCurrentUser(token);
    }
    setLoading(false);
  }, []);

  // Update last activity timestamp
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get('/auth/me');
      const userData = response.data.data;
      setUser({ ...userData, token });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // If token is invalid, logout
      if (error.response?.status === 401) {
        logout();
        showError('Your session has expired. Please log in again.', 'Authentication Error');
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user data
        const userResponse = await axios.get('/auth/me');
        const userData = userResponse.data.data;
        
        setUser({ ...userData, token });
        updateActivity(); // Set initial activity timestamp
        return true;
      }
      throw new Error('No token received');
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more specific error message based on response
      let errorMessage = 'Failed to login. Please check your credentials.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (error.response.status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      updateActivity,
      lastActivity
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };