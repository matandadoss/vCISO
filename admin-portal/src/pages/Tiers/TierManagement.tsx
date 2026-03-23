import { Edit2, Shield, Info } from 'lucide-react';
import './TierManagement.css';

const MOCK_TIERS = [
  { 
    id: 'starter', 
    name: 'Starter', 
    monthlyPrice: 200, 
    maxUsers: 25, 
    features: ['Basic Vulnerability Scanning', 'Standard Support', 'Monthly Reports'],
    popular: false,
    color: '#fbbf24'
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    monthlyPrice: 800, 
    maxUsers: 100, 
    features: ['Advanced Pentesting', 'Priority Support', 'Weekly Reports', 'Asset Discovery'],
    popular: true,
    color: '#34d399'
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise', 
    monthlyPrice: 2500, 
    maxUsers: 'Unlimited', 
    features: ['Continuous Monitoring', 'Dedicated Account Manager', 'Custom Integrations', 'Red Teaming'],
    popular: false,
    color: '#60a5fa'
  }
];

const TierManagement = () => {
  return (
    <div className="tiers-container">
      <div className="page-header">
        <div>
          <h1>Tiers & Pricing</h1>
          <p className="text-muted">Configure subscription packages and access controls</p>
        </div>
        <button className="btn btn-primary">Create New Tier</button>
      </div>

      <div className="tiers-grid">
        {MOCK_TIERS.map(tier => (
          <div key={tier.id} className={`tier-card glass-panel ${tier.popular ? 'popular' : ''}`}>
            {tier.popular && <div className="popular-badge">Most Chosen</div>}
            
            <div className="tier-header">
              <h2 style={{ color: tier.color }}>{tier.name}</h2>
              <button className="icon-btn" title="Edit Tier Pricing">
                <Edit2 size={16} />
              </button>
            </div>

            <div className="tier-pricing">
              <span className="currency">$</span>
              <span className="amount">{tier.monthlyPrice}</span>
              <span className="period">/mo</span>
            </div>

            <div className="tier-limits">
              <div className="limit-item">
                <span className="limit-label">User Limit</span>
                <span className="limit-value">{tier.maxUsers}</span>
              </div>
            </div>

            <div className="tier-features">
              <h3>Included Features</h3>
              <ul>
                {tier.features.map((feature, idx) => (
                  <li key={idx}>
                    <Shield size={16} className="text-accent-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="btn btn-secondary w-full mt-auto">Configure Features</button>
          </div>
        ))}
      </div>
      
      <div className="info-banner glass-panel mt-4">
        <Info className="text-accent-primary" size={24} />
        <div>
          <h4>Pricing Updates</h4>
          <p className="text-muted">Changes to active tiers affect new subscribers immediately. Existing subscriptions remain on legacy pricing until manually migrated.</p>
        </div>
      </div>
    </div>
  );
};

export default TierManagement;
