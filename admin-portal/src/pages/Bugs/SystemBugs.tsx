import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Bug, ChevronDown, ChevronUp, AlertCircle, RefreshCw, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { ApiService, BugLog } from '../../services/api';
import './SystemBugs.css';

interface EnrichedBug extends BugLog {
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  error_type: 'Security' | 'Network' | 'Database' | 'UI' | 'Logic' | 'Unknown';
}

const enrichBug = (bug: BugLog): EnrichedBug => {
  const msg = (bug.error_message || '').toLowerCase();
  const r = (bug.route || '').toLowerCase();
  
  let type: EnrichedBug['error_type'] = 'Unknown';
  let severity: EnrichedBug['severity'] = 'Low';
  let priority: EnrichedBug['priority'] = 'P4';
  
  if (msg.includes('auth') || msg.includes('token') || msg.includes('cors') || msg.includes('permission') || msg.includes('jwt') || r.includes('auth')) {
    type = 'Security';
    severity = 'Critical';
    priority = 'P1';
  } else if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch') || msg.includes('connection')) {
    type = 'Network';
    severity = 'High';
    priority = 'P2';
  } else if (msg.includes('sql') || msg.includes('database') || msg.includes('relation') || msg.includes('query')) {
    type = 'Database';
    severity = 'Critical';
    priority = 'P1';
  } else if (msg.includes('react') || msg.includes('render') || msg.includes('undefined') || msg.includes('not a function')) {
    type = 'UI';
    severity = 'Medium';
    priority = 'P3';
  } else if (msg.includes('validation') || msg.includes('invalid') || msg.includes('typeerror')) {
    type = 'Logic';
    severity = 'Medium';
    priority = 'P3';
  }
  
  return { ...bug, error_type: type, severity, priority };
};

const getSeverityColor = (sev: string) => {
  switch(sev) {
    case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }
};

const getPriorityColor = (p: string) => {
  switch(p) {
    case 'P1': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'P2': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'P3': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
};

const SystemBugs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bugs, setBugs] = useState<EnrichedBug[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  // Sorting
  const [sortKey, setSortKey] = useState<keyof EnrichedBug>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getBugs();
      setBugs((data || []).map(enrichBug));
    } catch (err) {
      console.error("Error loading bugs", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleSort = (key: keyof EnrichedBug) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // default to desc for new keys
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = bugs.filter(b => {
      const matchSearch = (b.error_message || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.route || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = filterPriority === 'All' || b.priority === filterPriority;
      const matchSeverity = filterSeverity === 'All' || b.severity === filterSeverity;
      const matchType = filterType === 'All' || b.error_type === filterType;
      return matchSearch && matchPriority && matchSeverity && matchType;
    });

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      const pWeights: Record<string, number> = { P1: 4, P2: 3, P3: 2, P4: 1 };
      const sWeights: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

      if (sortKey === 'priority') {
         aVal = pWeights[a.priority as string] || 0;
         bVal = pWeights[b.priority as string] || 0;
      }
      if (sortKey === 'severity') {
         aVal = sWeights[a.severity as string] || 0;
         bVal = sWeights[b.severity as string] || 0;
      }
      if (sortKey === 'timestamp' || sortKey === 'created_at') {
         aVal = new Date(a.created_at || a.timestamp).getTime();
         bVal = new Date(b.created_at || b.timestamp).getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
         return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [bugs, searchTerm, filterPriority, filterSeverity, filterType, sortKey, sortOrder]);

  const SortHeader = ({ label, sortField, width }: { label: string, sortField: keyof EnrichedBug, width?: string }) => (
    <th 
      style={{ width, cursor: 'pointer', userSelect: 'none' }} 
      onClick={() => handleSort(sortField)}
      className="group hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-1.5">
        {label}
        <ArrowUpDown size={12} className={`transition-opacity ${sortKey === sortField ? 'opacity-100 text-accent-primary' : 'opacity-20 group-hover:opacity-50'}`} />
      </div>
    </th>
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

      <div className="table-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="search-box glass-panel" style={{ flex: 1, minWidth: '250px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search errors by message or route..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* New Filters */}
        <select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          className="glass-panel"
          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none' }}
        >
          <option value="All">All Priorities</option>
          <option value="P1">P1 (Highest)</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4 (Lowest)</option>
        </select>

        <select 
          value={filterSeverity} 
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="glass-panel"
          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none' }}
        >
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="glass-panel"
          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none' }}
        >
          <option value="All">All Types</option>
          <option value="Security">Security</option>
          <option value="Database">Database</option>
          <option value="Network">Network</option>
          <option value="UI">UI</option>
          <option value="Logic">Logic</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      <div className="data-table-container glass-card mb-bottom-gap">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="ml-3 text-muted">Fetching categorized telemetry...</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <SortHeader label="Timestamp" sortField="timestamp" width="160px" />
                <SortHeader label="Priority" sortField="priority" width="100px" />
                <SortHeader label="Severity" sortField="severity" width="110px" />
                <SortHeader label="Type" sortField="error_type" width="110px" />
                <SortHeader label="Route" sortField="route" width="160px" />
                <SortHeader label="Error Message" sortField="error_message" />
                <th style={{width: '60px'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map(bug => (
                <React.Fragment key={bug.id}>
                  <tr className={expandedId === bug.id ? "expanded-row-active" : ""}>
                    <td className="text-muted text-sm font-mono truncate-cell">
                       {new Date(bug.created_at || bug.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getPriorityColor(bug.priority)}`}>
                         {bug.priority}
                       </span>
                    </td>
                    <td>
                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                         {bug.severity}
                       </span>
                    </td>
                    <td>
                       <span className="text-xs font-semibold px-2 py-1 bg-white/5 border border-white/10 rounded text-muted">
                         {bug.error_type}
                       </span>
                    </td>
                    <td className="font-medium text-accent-secondary truncate-cell text-sm">
                       {bug.route || 'Unknown'}
                    </td>
                    <td className="font-semibold truncate-cell text-sm" style={{maxWidth: '300px'}} title={bug.error_message}>
                       {bug.error_message}
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
                      <td colSpan={7} className="p-0">
                         <div className="expanded-content">
                            <div className="metadata-grid">
                               <div><strong>Bug ID:</strong> <span className="font-mono text-xs text-muted">{bug.id}</span></div>
                               <div><strong>Org ID:</strong> <span className="font-mono text-xs text-muted">{bug.org_id || 'N/A'}</span></div>
                               <div><strong>User ID:</strong> <span className="font-mono text-xs text-muted">{bug.user_id || 'N/A'}</span></div>
                               <div><strong>App Version:</strong> <span className="font-mono text-xs text-muted">{bug.frontend_version || 'N/A'}</span></div>
                               <div><strong>Status:</strong> <span className={`status-pill ${bug.status === 'open' ? 'suspended' : 'active'}`}>{bug.status?.toUpperCase() || 'OPEN'}</span></div>
                               <div className="col-span-full"><strong>URL Context:</strong> <span className="text-accent-secondary text-sm ml-2 font-mono bg-white/5 px-2 py-1 rounded">{bug.url}</span></div>
                            </div>
                            
                            <div className="stack-trace-container mt-4">
                               <h4 className="text-sm font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
                                  <AlertCircle size={14} className="text-accent-danger" /> Raw Stack Trace
                               </h4>
                               <pre className="stack-trace-block bg-darkness text-accent-danger p-4 rounded-md overflow-x-auto text-xs font-mono border border-red-500/20 shadow-inner" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                  {bug.stack_trace || "No stack trace explicitly captured by telemetry agent."}
                               </pre>
                            </div>
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <ShieldCheck size={48} className="text-accent-success/40" />
                       <p className="text-lg font-medium text-foreground">No system crashes found</p>
                       <p className="text-sm">The platform is stable or your current filters excluded all results.</p>
                       {(searchTerm || filterPriority !== 'All' || filterType !== 'All') && (
                          <button 
                            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm transition text-white"
                            onClick={() => { setSearchTerm(''); setFilterPriority('All'); setFilterSeverity('All'); setFilterType('All'); }}
                          >
                            Clear Filters
                          </button>
                       )}
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
