import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Loader2, ArrowUpRight } from 'lucide-react';
import { ApiService, Customer } from '../../services/api';
import './RevenueReport.css';

interface TierStats {
  name: string;
  count: number;
  mrr: number;
}

const RevenueReport = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await ApiService.getCustomers();
      // Only include active customers in revenue reporting
      setCustomers(data.filter(c => c.status === 'active'));
    } catch (err) {
      console.error("Error fetching customers for reports", err);
    } finally {
      setLoading(false);
    }
  };

  // Derived Metrics
  const totalMrr = customers.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const totalUsers = customers.reduce((sum, c) => sum + (c.users || 0), 0);
  const arpu = totalUsers > 0 ? (totalMrr / totalUsers).toFixed(2) : '0.00';
  
  // Rank customers by MRR Descending
  const topCustomers = [...customers].sort((a, b) => (b.mrr || 0) - (a.mrr || 0));

  // Compute stats per Tier
  const tierDistribution = customers.reduce((acc, c) => {
    const t = c.tier || 'Unknown';
    if (!acc[t]) acc[t] = { name: t, count: 0, mrr: 0 };
    acc[t].count += 1;
    acc[t].mrr += (c.mrr || 0);
    return acc;
  }, {} as Record<string, TierStats>);
  
  const sortedTiers = Object.values(tierDistribution).sort((a, b) => b.mrr - a.mrr);

  return (
    <div className="report-wrapper">
      <div className="page-header">
        <div>
          <h1>Revenue Report</h1>
          <p className="text-muted">Analyze Monthly Recurring Revenue (MRR) and core financial health</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-accent-primary" size={40} />
          <span className="ml-4 text-muted">Calculating financial metrics...</span>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card glass-panel">
              <div className="kpi-icon positive">
                <DollarSign size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Active MRR</span>
                <span className="kpi-value">${totalMrr.toLocaleString()}</span>
              </div>
              <div className="kpi-trend positive">
                <TrendingUp size={16} />
                <span>Stable</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-icon">
                <Users size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Average per User (ARPU)</span>
                <span className="kpi-value">${arpu}</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-icon abstract">
                <ArrowUpRight size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Avg MRR per Tenant</span>
                <span className="kpi-value">${customers.length ? (totalMrr / customers.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</span>
              </div>
            </div>
          </div>

          <div className="report-content-grid">
            {/* Breakdown by Tier */}
            <div className="tier-breakdown glass-card">
              <div className="card-header">
                <h3>Revenue by Tier</h3>
              </div>
              <div className="tier-list">
                {sortedTiers.map(t => (
                  <div key={t.name} className="tier-row">
                    <div className="tier-info">
                      <span className="tier-name">{t.name}</span>
                      <span className="text-muted text-sm">{t.count} Active Tenants</span>
                    </div>
                    <div className="tier-value">
                      ${t.mrr.toLocaleString()}
                    </div>
                  </div>
                ))}
                {sortedTiers.length === 0 && <p className="text-muted">No active tiers generating revenue.</p>}
              </div>
            </div>

            {/* Top Customers Data Grid */}
            <div className="customer-ranking glass-card">
              <div className="card-header">
                <h3>Top Customers by Revenue</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Customer Name</th>
                    <th>Tier</th>
                    <th className="text-right">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.slice(0, 10).map((c, index) => (
                    <tr key={c.id}>
                      <td className="text-muted">#{index + 1}</td>
                      <td className="font-medium">{c.name}</td>
                      <td><span className={`badge tier-${c.tier.toLowerCase()}`}>{c.tier}</span></td>
                      <td className="text-right font-medium text-accent-success">+${(c.mrr || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {topCustomers.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-4">No active generating customers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueReport;
