import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import AdminUsers from './pages/AdminUsers';
import AdminWorkers from './pages/AdminWorkers';
import AdminMachines from './pages/AdminMachines';
import AdminDatabases from './pages/AdminDatabases';
import AdminSystems from './pages/AdminSystems';
import AdminReferentials from './pages/AdminReferentials';
import AdminRefList from './pages/AdminRefList';
import Layout from './components/Layout';
import Systems from './pages/Systems';
import SystemDetails from './pages/SystemDetails';
import Machines from './pages/Machines';
import MachineDetails from './pages/MachineDetails';
import Databases from './pages/Databases';
import DatabaseDetails from './pages/DatabaseDetails';
import Workers from './pages/Workers';
import WorkerDetails from './pages/WorkerDetails';
import UnknownPage from './pages/UnknownPage';
import MachineDashboards from './pages/MachineDashboards';
import DatabaseDashboards from './pages/DatabaseDashboards';

function App() {
  // Initialize from localStorage if present
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem('role');
    console.log(`Initial user role from localStorage: ${role}`);
    return role || 'user'; // Default to 'user' if not set
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
        <Route path="/dashboards/windows" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <MachineDashboards />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/dashboards/databases" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <DatabaseDashboards />
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

        <Route path="/admin/workers" element={
          <ProtectedRoute allowedRoles={['admin', 'chief']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminWorkers />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/machines" element={
          <ProtectedRoute allowedRoles={['admin', 'chief']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminMachines />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/databases" element={
          <ProtectedRoute allowedRoles={['admin', 'chief']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminDatabases />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/systems" element={
          <ProtectedRoute allowedRoles={['admin', 'chief']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminSystems />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/ref" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminReferentials />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/ref/:type" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminRefList />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/workers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminWorkers />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/machines" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminMachines />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/systems" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole={userRole} key={userRole}>
              <AdminSystems />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Validation Queue removed per request */}

        <Route path="/systems" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Systems />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/systems/:id" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <SystemDetails />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/machines" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Machines />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/machines/:id" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <MachineDetails />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/databases" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Databases />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/databases/:id" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <DatabaseDetails />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/workers" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <Workers />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/workers/:id" element={
          <ProtectedRoute>
            <Layout userRole={userRole} key={userRole}>
              <WorkerDetails />
            </Layout>
          </ProtectedRoute>
        } />
        {/* Catch-all: unknown / 404 page */}
        <Route path="*" element={<UnknownPage />} />
      </Routes>
    </Router>
  );
}

export default App;