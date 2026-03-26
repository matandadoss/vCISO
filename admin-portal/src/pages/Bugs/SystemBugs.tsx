import React, { useState, useEffect } from 'react';
import { Search, Loader2, Bug, ChevronDown, ChevronUp, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { ApiService, BugLog } from '../../services/api';
import './SystemBugs.css';

const SystemBugs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bugs, setBugs] = useState<BugLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getBugs();
      setBugs(data || []);
    } catch (err) {
      console.error("Error loading bugs", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const filtered = bugs.filter(b => 
    (b.error_message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.route || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bugs-container">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <Bug className="text-accent-primary" /> System Errors
          </h1>
          <p className="text-muted">Monitor unhandled platform crashes and exceptions</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={loadBugs} style={{backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box glass-panel">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search errors by message or route..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container glass-card mb-bottom-gap">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="ml-3 text-muted">Fetching latest telemetry...</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '180px'}}>Timestamp</th>
                <th>Route</th>
                <th>Error Message</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(bug => (
                <React.Fragment key={bug.id}>
                  <tr className={expandedId === bug.id ? "expanded-row-active" : ""}>
                    <td className="text-muted text-sm font-mono">
                       {new Date(bug.created_at || bug.timestamp).toLocaleString()}
                    </td>
                    <td className="font-medium text-accent-secondary truncate-cell">
                       {bug.route || 'SSR / Unknown'}
                    </td>
                    <td className="font-semibold truncate-cell" style={{maxWidth: '300px'}}>
                       {bug.error_message}
                    </td>
                    <td>
                      <span className={`status-pill ${bug.status === 'open' ? 'suspended' : 'active'}`}>
                        {bug.status === 'open' ? <AlertCircle size={14} /> : null}
                        {bug.status?.toUpperCase() || 'OPEN'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="icon-btn"
                        onClick={() => toggleExpand(bug.id)}
                        style={{ border: '1px solid var(--border-subtle)', padding: '0.4rem', borderRadius: '6px' }}
                      >
                        {expandedId === bug.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </button>
                    </td>
                  </tr>
                  {expandedId === bug.id && (
                    <tr className="expanded-details-row">
                      <td colSpan={5} className="p-0">
                         <div className="expanded-content">
                            <div className="metadata-grid">
                               <div><strong>Bug ID:</strong> <span className="font-mono text-xs">{bug.id}</span></div>
                               <div><strong>Org ID:</strong> <span className="font-mono text-xs">{bug.org_id || 'N/A'}</span></div>
                               <div><strong>User ID:</strong> <span className="font-mono text-xs">{bug.user_id || 'N/A'}</span></div>
                               <div><strong>App Version:</strong> <span className="font-mono text-xs">{bug.frontend_version || 'N/A'}</span></div>
                               <div className="col-span-full"><strong>URL Context:</strong> <span className="text-accent-secondary text-sm">{bug.url}</span></div>
                            </div>
                            
                            <div className="stack-trace-container mt-4">
                               <h4 className="text-sm font-bold uppercase tracking-widest text-muted mb-2">Raw Stack Trace</h4>
                               <pre className="stack-trace-block bg-darkness text-accent-danger p-4 rounded-md overflow-x-auto text-xs font-mono" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                  {bug.stack_trace || "No stack trace explicitly captured."}
                               </pre>
                            </div>
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <ShieldCheck size={32} className="text-accent-success/50" />
                       No system crashes found matching "{searchTerm}". The platform is stable!
                    </div>
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

export default SystemBugs;
