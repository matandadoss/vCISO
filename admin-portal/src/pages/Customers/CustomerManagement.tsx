import { useState } from 'react';
import { Search, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import './CustomerManagement.css';

// Mock Data
const MOCK_CUSTOMERS = [
  { id: '1', name: 'Acme Corp', tier: 'Enterprise', users: 120, status: 'active', mrr: 2500, joinedAt: '2025-01-15' },
  { id: '2', name: 'Globex Inc', tier: 'Pro', users: 45, status: 'active', mrr: 800, joinedAt: '2025-02-10' },
  { id: '3', name: 'Initech', tier: 'Starter', users: 12, status: 'suspended', mrr: 200, joinedAt: '2025-03-01' },
  { id: '4', name: 'Umbrella Corp', tier: 'Enterprise', users: 850, status: 'active', mrr: 5000, joinedAt: '2024-11-20' },
];

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-container">
      <div className="page-header">
        <div>
          <h1>Customer Accounts</h1>
          <p className="text-muted">Manage tenant accounts, subscriptions, and platform access</p>
        </div>
        <button className="btn btn-primary">Add Customer</button>
      </div>

      <div className="table-controls">
        <div className="search-box glass-panel">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Tier</th>
              <th>Active Users</th>
              <th>MRR</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(customer => (
              <tr key={customer.id}>
                <td className="font-medium">{customer.name}</td>
                <td>
                  <span className={`badge tier-${customer.tier.toLowerCase()}`}>
                    {customer.tier}
                  </span>
                </td>
                <td>{customer.users}</td>
                <td>${customer.mrr}/mo</td>
                <td>
                  <span className={`status-pill ${customer.status}`}>
                    {customer.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {customer.status}
                  </span>
                </td>
                <td>
                  <div className="action-menu">
                    <button className="icon-btn" title="Manage Account">
                      <MoreVertical size={18} />
                    </button>
                    {/* Additional quick actions could go here */}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  No customers found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManagement;
