/**
 * Mock API Service for vCISO Admin Portal
 * 
 * Provides isolated data layer to ensure the admin portal functions perfectly 
 * on completely separate infrastructure without connecting directly to the vCISO database yet.
 */

export interface Customer {
  id: string;
  name: string;
  tier: string;
  users: number;
  status: 'active' | 'suspended';
  mrr: number;
  joinedAt: string;
}

export interface Tier {
  id: string;
  name: string;
  monthlyPrice: number;
  maxUsers: number | 'Unlimited';
  features: string[];
  popular: boolean;
  color: string;
}

// Simulates network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const ApiService = {
  async getCustomers(): Promise<Customer[]> {
    await delay(600);
    return [
      { id: '1', name: 'Acme Corp', tier: 'Enterprise', users: 120, status: 'active', mrr: 2500, joinedAt: '2025-01-15' },
      { id: '2', name: 'Globex Inc', tier: 'Pro', users: 45, status: 'active', mrr: 800, joinedAt: '2025-02-10' },
      { id: '3', name: 'Initech', tier: 'Starter', users: 12, status: 'suspended', mrr: 200, joinedAt: '2025-03-01' },
      { id: '4', name: 'Umbrella Corp', tier: 'Enterprise', users: 850, status: 'active', mrr: 5000, joinedAt: '2024-11-20' },
    ];
  },

  async getTiers(): Promise<Tier[]> {
    await delay(400);
    return [
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
  },

  async suspendCustomer(customerId: string): Promise<boolean> {
    await delay(800);
    console.log(`Suspended customer ${customerId}`);
    return true;
  }
};
