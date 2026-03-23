import { Users, CreditCard, Activity, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p className="text-muted">High-level metrics and system health for vCISO</p>
        </div>
        <button className="btn btn-primary">Generate Report</button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">Active Customers</span>
            <Users className="metric-icon text-accent-primary" size={20} />
          </div>
          <div className="metric-value">1,248</div>
          <div className="metric-trend positive">
            <TrendingUp size={16} />
            <span>+12% this month</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">Monthly Recurring Revenue</span>
            <CreditCard className="metric-icon text-accent-success" size={20} />
          </div>
          <div className="metric-value">$624,000</div>
          <div className="metric-trend positive">
            <TrendingUp size={16} />
            <span>+8% this month</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">System Health</span>
            <Activity className="metric-icon text-accent-primary" size={20} />
          </div>
          <div className="metric-value">99.99%</div>
          <div className="metric-trend text-muted">
            <span>Uptime last 30 days</span>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container glass-card">
          <h3>Recent Signups</h3>
          <div className="chart-placeholder">
            {/* Can integrate Recharts or Chartjs here */}
            <div className="placeholder-text">Recent customer activity graph</div>
          </div>
        </div>
        
        <div className="chart-container glass-card">
          <h3>Tier Distribution</h3>
          <div className="chart-placeholder">
            <div className="placeholder-text">Subscription breakdown graph</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
