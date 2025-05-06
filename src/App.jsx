// src/App.jsx - Updated with modal manager initialization
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Runners from './pages/Runners';
import RoutesManagement from './pages/Routes'; 
import Races from './pages/Races';
import Communications from './pages/Communications';
import AdminUsers from './pages/AdminUsers';
import { initModalManager } from './utils/modalManager';

const App = () => {
  // Initialize the modal manager at the app level
  useEffect(() => {
    initModalManager();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="runners" element={<Runners />} />
            <Route path="routes" element={<RoutesManagement />} />
            <Route path="races" element={<Races />} />
            <Route path="communications" element={<Communications />} />
            <Route path="admin-users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;