import { useState, useEffect } from 'react';
import { Edit2, Shield, Info, Loader2 } from 'lucide-react';
import { ApiService, Tier } from '../../services/api';
import './TierManagement.css';

const TierManagement = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await ApiService.getTiers();
        setTiers(data);
      } catch (err) {
        console.error("Error loading tiers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  return (
    <div className="tiers-container">
      <div className="page-header">
        <div>
          <h1>Tiers & Pricing</h1>
          <p className="text-muted">Configure subscription packages and access controls</p>
        </div>
        <button className="btn btn-primary">Create New Tier</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-accent-primary" size={40} />
          <span className="ml-4 text-muted">Loading active tiers...</span>
        </div>
      ) : (
        <div className="tiers-grid">
          {tiers.map(tier => (
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

              <div className="tier-description" style={{ padding: '0 1.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '40px' }}>
                {tier.description}
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
      )}
      
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
