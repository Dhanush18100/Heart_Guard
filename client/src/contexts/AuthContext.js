import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, ...userInfo } = response.data;
      
      setToken(newToken);
      setUser(userInfo);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const normalized = { ...profileData };
      // Drop empty strings
      Object.keys(normalized).forEach((k) => {
        if (normalized[k] === '' || normalized[k] === null) delete normalized[k];
      });
      if (typeof normalized.gender === 'string') {
        const v = normalized.gender.toLowerCase();
        if (['male','female','other'].includes(v)) normalized.gender = v;
        else delete normalized.gender;
      }
      if (typeof normalized.address === 'string' && normalized.address.trim()) {
        normalized.address = { street: normalized.address.trim() };
      }
      if (typeof normalized.dateOfBirth === 'string' && !normalized.dateOfBirth.trim()) {
        delete normalized.dateOfBirth;
      }
      const response = await axios.put('/api/auth/profile', normalized);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateLocation = async (latitude, longitude) => {
    try {
      const body = typeof latitude === 'object' && latitude !== null ? latitude : { latitude, longitude };
      await axios.put('/api/auth/location', body);
      toast.success('Location updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Location update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateLocation,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor' || user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
