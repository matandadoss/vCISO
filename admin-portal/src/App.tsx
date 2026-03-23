import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Login from '@/pages/Auth/Login';
import CustomerManagement from '@/pages/Customers/CustomerManagement';
import TierManagement from '@/pages/Tiers/TierManagement';

// Mock authentication state for now
const isAuthenticated = true;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="tiers" element={<TierManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
