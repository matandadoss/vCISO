import { useState, useEffect } from 'react';
import { Search, ShieldX, ShieldCheck, CheckCircle, XCircle, Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import { ApiService, Customer } from '../../services/api';
import './CustomerManagement.css';

const AVAILABLE_TIERS = ['Basic', 'Professional', 'Enterprise', 'Elite'];

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  
  // Organization Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgTier, setOrgTier] = useState('Professional');
  const [isSaving, setIsSaving] = useState(false);

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

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingOrgId(null);
    setOrgName('');
    setOrgTier('Professional');
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setIsEditMode(true);
    setEditingOrgId(customer.id);
    setOrgName(customer.name);
    setOrgTier(customer.tier);
    setIsModalOpen(true);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    
    setIsSaving(true);
    if (isEditMode && editingOrgId) {
      const success = await ApiService.updateCustomer(editingOrgId, orgName);
      if (success) {
        setCustomers(prev => prev.map(c => 
          c.id === editingOrgId ? { ...c, name: orgName } : c
        ));
        
        // Also update tier via the existing workflow, if changed
        const currentOrg = customers.find(c => c.id === editingOrgId);
        if (currentOrg && currentOrg.tier !== orgTier) {
          await handleChangeTier(editingOrgId, orgTier);
        }
        setIsModalOpen(false);
      }
    } else {
      const newCustomer = await ApiService.createCustomer(orgName, orgTier);
      if (newCustomer) {
        setCustomers(prev => [...prev, newCustomer]);
        setIsModalOpen(false);
      }
    }
    setIsSaving(false);
  };

  const handleDeleteOrg = async (customerId: string) => {
    if (actingId) return;
    if (!window.confirm("Are you SURE you want to permanently delete this organization? All users will be wiped!")) return;
    
    setActingId(customerId);
    const success = await ApiService.deleteCustomer(customerId);
    if (success) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
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
          <h1>Organizations</h1>
          <p className="text-muted">Manage tenant platforms, subscriptions, and platform access</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={loadCustomers} style={{backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)'}}>
            Refresh Data
          </button>
          <button className="btn btn-primary" onClick={openCreateModal} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Plus size={18} /> Add Organization
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box glass-panel">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search organizations..." 
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
                <th>Organization Name</th>
                <th>Tier</th>
                <th>Active Users</th>
                <th>MRR (Monthly)</th>
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
                  <td className="font-semibold text-accent-success">${customer.mrr.toLocaleString()} /mo</td>
                  <td>
                    <span className={`status-pill ${customer.status}`}>
                      {customer.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-menu" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <button 
                        className="icon-btn hover:text-accent-primary"
                        title="Edit Tenant"
                        onClick={() => openEditModal(customer)}
                        disabled={actingId === customer.id}
                        style={{ border: '1px solid var(--border-subtle)', padding: '0.4rem', borderRadius: '6px' }}
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button 
                        className={`icon-btn ${customer.status === 'active' ? 'text-accent-danger' : 'text-accent-success'}`}
                        title={customer.status === 'active' ? "Suspend Tenant" : "Activate Tenant"}
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
                      <button 
                        className="icon-btn text-accent-danger"
                        title="Delete Tenant"
                        onClick={() => handleDeleteOrg(customer.id)}
                        disabled={actingId === customer.id}
                        style={{ border: '1px solid var(--border-subtle)', padding: '0.4rem', borderRadius: '6px' }}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No organizations found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Create / Edit Organization Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                {isEditMode ? 'Edit Organization' : 'New Organization'}
             </h2>
             <form onSubmit={handleSaveOrg} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Organization Name</label>
                  <input 
                    type="text" 
                    className="modern-input" 
                    value={orgName} 
                    onChange={e => setOrgName(e.target.value)} 
                    placeholder="e.g. Acme Corp"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isEditMode ? 'Subscription Tier' : 'Initial Subscription Tier'}</label>
                  <select 
                    className="modern-input" 
                    value={orgTier} 
                    onChange={e => setOrgTier(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {AVAILABLE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : (isEditMode ? <Edit2 size={16} /> : <ShieldCheck size={16} />)} 
                    {isEditMode ? 'Save Changes' : 'Deploy Platform'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
