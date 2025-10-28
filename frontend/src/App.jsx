import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import AdminUsers from './pages/AdminUsers';
import InspectionDetails from './pages/InspectionDetails';
import ValidationQueue from './pages/ValidationQueue';
import Layout from './components/Layout';
import Inspections from './pages/Inspections';
import Pieces from './pages/Pieces';
import PieceHistory from './pages/PieceHistory';

function App() {
  // Initialize from localStorage if present
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem('role');
    console.log(`Initial user role from localStorage: ${role}`);
    return role || 'inspector'; // Default to 'inspector' if not set
  });

  // Sync auth state to localStorage
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
    if (isAuthenticated && userRole) {
      console.log(`Setting user role in localStorage: ${userRole}`);
      localStorage.setItem('role', userRole);
    }
    // Do NOT remove 'role' here; only remove it on explicit logout!
  }, [isAuthenticated, userRole]);

  // Protected Route wrapper
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <Login onLogin={(role) => {
            setIsAuthenticated(true);
            setUserRole(role);
          }} />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <UserProfile />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/inspections/:id" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <InspectionDetails />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/validation-queue" element={
          <ProtectedRoute allowedRoles={['chief', 'admin']}>
            <Layout userRole={userRole} key={userRole}>
              <ValidationQueue />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/inspections" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Inspections />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/pieces" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Pieces />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/pieces/:ref" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <PieceHistory />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;