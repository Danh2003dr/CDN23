import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import NodeDetail from './pages/NodeDetail';
import Metrics from './pages/Metrics';
import Analytics from './pages/Analytics';
import UserManagement from './pages/UserManagement';
import ContentManagement from './pages/ContentManagement';
import Permissions from './pages/Permissions';
import ActivityLogs from './pages/ActivityLogs';
import AccessLogs from './pages/AccessLogs';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main App Content
const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="nodes" element={
          <ProtectedRoute>
            <Nodes />
          </ProtectedRoute>
        } />
        <Route path="nodes/:id" element={
          <ProtectedRoute>
            <NodeDetail />
          </ProtectedRoute>
        } />
        <Route path="metrics" element={
          <ProtectedRoute>
            <Metrics />
          </ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="content" element={
          <ProtectedRoute>
            <ContentManagement />
          </ProtectedRoute>
        } />
        <Route path="permissions" element={
          <ProtectedRoute>
            <Permissions />
          </ProtectedRoute>
        } />
        <Route path="activity-logs" element={
          <ProtectedRoute>
            <ActivityLogs />
          </ProtectedRoute>
        } />
        <Route path="access-logs" element={
          <ProtectedRoute>
            <AccessLogs />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

// Root App Component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <AuthProvider>
            <LanguageProvider>
              <Suspense fallback={<CircularProgress />}>
                <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                  <AppContent />
                </Box>
              </Suspense>
            </LanguageProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
