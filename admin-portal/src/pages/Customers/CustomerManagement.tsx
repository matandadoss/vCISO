import { useState, useEffect } from 'react';
import { Search, ShieldX, ShieldCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ApiService, Customer } from '../../services/api';
import './CustomerManagement.css';

const AVAILABLE_TIERS = ['Basic', 'Professional', 'Enterprise', 'Elite'];

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await ApiService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    if (actingId) return;
    setActingId(customer.id);
    const isCurrentlyActive = customer.status === 'active';
    const action = isCurrentlyActive ? ApiService.suspendCustomer : ApiService.activateCustomer;
    
    const success = await action(customer.id);
    if(success) {
      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? { ...c, status: isCurrentlyActive ? 'suspended' : 'active' } : c
      ));
    }
    setActingId(null);
  };

  const handleChangeTier = async (customerId: string, newTier: string) => {
    if (actingId) return;
    setActingId(customerId);
    const success = await ApiService.changeCustomerTier(customerId, newTier);
    if(success) {
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, tier: newTier.charAt(0).toUpperCase() + newTier.slice(1) } : c
      ));
    }
    setActingId(null);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-container">
      <div className="page-header">
        <div>
          <h1>Customer Accounts</h1>
          <p className="text-muted">Manage tenant accounts, subscriptions, and platform access</p>
        </div>
        <button className="btn btn-primary" onClick={loadCustomers}>Refresh Data</button>
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
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="ml-3 text-muted">Loading live data...</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Tier</th>
                <th>Active Users</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer.id} style={{ opacity: actingId === customer.id ? 0.5 : 1 }}>
                  <td className="font-medium">{customer.name}</td>
                  <td>
                    <select 
                      className="modern-input" 
                      style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                      value={customer.tier} 
                      onChange={(e) => handleChangeTier(customer.id, e.target.value)}
                      disabled={actingId === customer.id}
                    >
                      {AVAILABLE_TIERS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td>{customer.users}</td>
                  <td>
                    <span className={`status-pill ${customer.status}`}>
                      {customer.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-menu" style={{ justifyContent: 'flex-start' }}>
                      <button 
                        className={`icon-btn ${customer.status === 'active' ? 'text-accent-danger' : 'text-accent-success'}`}
                        title={customer.status === 'active' ? "Suspend Customer" : "Activate Customer"}
                        onClick={() => handleToggleStatus(customer)}
                        disabled={actingId === customer.id}
                        style={{ border: '1px solid var(--border-subtle)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, gap: '0.5rem' }}
                      >
                        {customer.status === 'active' ? (
                          <><ShieldX size={16}/> Suspend</>
                        ) : (
                          <><ShieldCheck size={16}/> Activate</>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No customers found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
