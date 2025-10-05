import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { getMe } from './store/slices/authSlice';
import { Helmet } from 'react-helmet-async';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import BatchList from './pages/batches/BatchList';
import BatchDetail from './pages/batches/BatchDetail';
import BatchCreate from './pages/batches/BatchCreate';
import QRScanner from './pages/qr/QRScanner';
import QRVerification from './pages/qr/QRVerification';
import Profile from './pages/user/Profile';
import NotFound from './pages/NotFound';

// Loading component
import LoadingScreen from './components/ui/LoadingScreen';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Try to get user info if token exists
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch(getMe());
    }
  }, [dispatch, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title>Drug Provenance - Blockchain Drug Traceability</title>
        <meta name="description" content="Blockchain-based drug provenance management system for hospitals and manufacturers" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route path="/qr/verify/:batchCode" element={<QRVerification />} />
        
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="" element={<Navigate to="/auth/login" replace />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Drug Batch Routes */}
          <Route path="batches">
            <Route index element={<BatchList />} />
            <Route path="create" element={
              <ProtectedRoute roles={['MANUFACTURER', 'ADMIN']}>
                <BatchCreate />
              </ProtectedRoute>
            } />
            <Route path=":id" element={<BatchDetail />} />
          </Route>
          
          {/* QR Routes */}
          <Route path="qr">
            <Route path="scan" element={<QRScanner />} />
          </Route>
          
          {/* User Routes */}
          <Route path="profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <div>Admin Panel - Coming Soon</div>
            </ProtectedRoute>
          } />
        </Route>

        {/* Redirect from old auth routes */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;