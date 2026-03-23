import { useState, useEffect } from 'react';
import { Edit2, Shield, Info, Loader2, Save, X, Plus } from 'lucide-react';
import { ApiService, Tier } from '../../services/api';
import './TierManagement.css';

const TierManagement = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tier>>({});
  const [saving, setSaving] = useState(false);

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

  const handleEdit = (tier: Tier) => {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await ApiService.updateTier(id, editForm);
      setTiers(tiers.map(t => t.id === id ? { ...t, ...editForm } as Tier : t));
      setEditingId(null);
    } catch (err) {
      console.error("Error saving tier", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures[index] = val;
    setEditForm({ ...editForm, features: newFeatures });
  };

  const addFeature = () => {
    const newFeatures = [...(editForm.features || []), "New Feature"];
    setEditForm({ ...editForm, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures.splice(index, 1);
    setEditForm({ ...editForm, features: newFeatures });
  };

  return (
    <div className="tiers-container">
      <div className="page-header">
        <div>
          <h1>Tiers & Pricing</h1>
          <p className="text-muted">Configure subscription packages and access controls</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-accent-primary" size={40} />
          <span className="ml-4 text-muted">Loading active tiers...</span>
        </div>
      ) : (
        <div className="tiers-grid">
          {tiers.map(tier => {
            const isEditing = editingId === tier.id;

            return (
              <div key={tier.id} className={`tier-card glass-panel ${tier.popular ? 'popular' : ''} ${isEditing ? 'ring-2 ring-accent-primary' : ''}`}>
                {tier.popular && !isEditing && <div className="popular-badge">Most Chosen</div>}
                
                <div className="tier-header mb-4 flex justify-between items-start">
                  {isEditing ? (
                     <input 
                       className="bg-background/50 border border-border rounded px-2 py-1 text-xl font-bold w-full mr-2"
                       value={editForm.name || ''} 
                       onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                     />
                  ) : (
                     <h2 style={{ color: tier.color, fontSize: '1.5rem', fontWeight: 'bold' }}>{tier.name}</h2>
                  )}

                  {!isEditing ? (
                    <button className="icon-btn hover:text-accent-primary transition-colors p-1" onClick={() => handleEdit(tier)} title="Edit Tier Configuration">
                      <Edit2 size={16} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                       <button className="icon-btn text-accent-success hover:bg-accent-success/20 p-1 rounded" onClick={() => handleSave(tier.id)} disabled={saving}>
                         {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                       </button>
                       <button className="icon-btn text-accent-danger hover:bg-accent-danger/20 p-1 rounded" onClick={handleCancel}>
                         <X size={16} />
                       </button>
                    </div>
                  )}
                </div>

                <div className="tier-pricing mb-6 flex items-end">
                  <span className="currency text-xl text-muted">$</span>
                  {isEditing ? (
                     <input 
                       type="number"
                       className="bg-background/50 border border-border rounded px-2 py-1 text-3xl font-bold w-24 mx-1"
                       value={editForm.monthlyPrice ?? 0}
                       onChange={(e) => setEditForm({...editForm, monthlyPrice: parseInt(e.target.value) || 0})}
                     />
                  ) : (
                     <span className="amount text-4xl font-bold">{tier.monthlyPrice}</span>
                  )}
                  <span className="period text-muted ml-1">/mo</span>
                </div>

                <div className="tier-limits mb-4 p-3 bg-black/20 rounded-lg">
                  <div className="limit-item flex justify-between items-center text-sm">
                    <span className="limit-label text-muted">User Limit</span>
                    {isEditing ? (
                       <input 
                         className="bg-background/50 border border-border rounded px-2 py-1 text-right w-20 text-sm"
                         value={editForm.maxUsers === 'Unlimited' ? 'Unlimited' : editForm.maxUsers || ''}
                         onChange={(e) => {
                           const val = e.target.value;
                           const parsed = parseInt(val);
                           setEditForm({...editForm, maxUsers: val.toLowerCase() === 'unlimited' || isNaN(parsed) ? 'Unlimited' : parsed});
                         }}
                       />
                    ) : (
                       <span className="limit-value font-medium">{tier.maxUsers}</span>
                    )}
                  </div>
                </div>

                <div className="tier-description mb-6 min-h-[48px]">
                  {isEditing ? (
                     <textarea 
                       className="bg-background/50 border border-border rounded w-full p-2 text-sm text-foreground resize-none"
                       rows={3}
                       value={editForm.description || ''}
                       onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                     />
                  ) : (
                     <p className="text-muted text-sm">{tier.description}</p>
                  )}
                </div>

                <div className="tier-features flex-grow">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Included Features</h3>
                  <ul className="space-y-3">
                    {isEditing ? (
                      <>
                        {(editForm.features || []).map((feature, idx) => (
                           <li key={idx} className="flex items-start gap-2">
                             <button className="mt-1 text-accent-danger hover:opacity-80" onClick={() => removeFeature(idx)}>
                               <X size={14} />
                             </button>
                             <input 
                               className="bg-background/50 border border-border rounded px-2 py-1 text-sm w-full"
                               value={feature}
                               onChange={(e) => handleFeatureChange(idx, e.target.value)}
                             />
                           </li>
                        ))}
                        <button className="flex items-center gap-1 text-sm text-accent-primary hover:underline mt-2" onClick={addFeature}>
                          <Plus size={14} /> Add Feature
                        </button>
                      </>
                    ) : (
                      tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Shield size={16} className="text-accent-success flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="info-banner glass-panel mt-8 flex items-start gap-4 p-4 rounded-lg bg-accent-primary/5 border border-accent-primary/20">
        <Info className="text-accent-primary flex-shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-foreground mb-1">Pricing Updates</h4>
          <p className="text-sm text-muted">Changes to active tiers affect new subscribers immediately. Existing subscriptions remain on legacy pricing until manually migrated. Administrator capabilities will instantly sync to the core pathfinding simulations upon save.</p>
        </div>
      </div>
    </div>
  );
};

export default TierManagement;
