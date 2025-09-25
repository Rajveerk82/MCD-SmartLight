import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/signup';
import Dashboard from './pages/Dashboard';
import Devices from './pages/devices';
import DeviceDetail from './pages/DeviceDetail';
import DeviceSetup from './pages/devicesetup';
import Schedule from './pages/schedule';
import Settings from './pages/settings';
import DefectiveDevices from './pages/DefectiveDevices';
import Alerts from './pages/Alerts';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/devices" element={
          <ProtectedRoute>
            <Devices />
          </ProtectedRoute>
        } />
        
        <Route path="/devices/:id" element={
          <ProtectedRoute>
            <DeviceDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/device-setup" element={
          <ProtectedRoute>
            <DeviceSetup />
          </ProtectedRoute>
        } />
        
        <Route path="/device-setup/:id" element={
          <ProtectedRoute>
            <DeviceSetup />
          </ProtectedRoute>
        } />
        
        <Route path="/schedule" element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/defective-devices" element={
          <ProtectedRoute>
            <DefectiveDevices />
          </ProtectedRoute>
        } />
        
        <Route path="/alerts" element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;