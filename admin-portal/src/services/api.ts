/**
 * API Service for vCISO Admin Portal
 * Connects to the main FastAPI backend under the /api/v1/admin/* namespace.
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

export interface BugLog {
  id: string;
  timestamp: string;
  created_at: string;
  error_code: string;
  error_message: string;
  stack_trace: string;
  url: string;
  route: string;
  frontend_version: string;
  user_id: string;
  org_id: string;
  status: string;
}

export interface Tier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  pricePerUser: number;
  maxUsers: number | 'Unlimited';
  features: string[];
  popular: boolean;
  color: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // In a real Firebase integration, call getAuth().currentUser.getIdToken()
  // Using the mock-token that the FastAPI backend explicitly accepts for local dev ("mock-token")
  // For production, this must be replaced with an actual retrieved token.
  const token = localStorage.getItem('admin_token') || 'mock-token';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication Error: Admin credentials invalid or missing.');
    }
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export const ApiService = {
  async getCustomers(): Promise<Customer[]> {
    try {
      return await fetchWithAuth('/admin/customers/');
    } catch (e) {
      console.error("Failed to fetch customers, returning fallback mock data.", e);
      // Fallback for UI demonstration if backend is down
      return [
        { id: '1', name: 'Acme Corp', tier: 'Enterprise', users: 120, status: 'active', mrr: 2500, joinedAt: '2025-01-15' }
      ];
    }
  },

  async getBugs(): Promise<BugLog[]> {
    try {
      return await fetchWithAuth('/bugs');
    } catch (e) {
      console.error("Failed to fetch bug logs", e);
      return [];
    }
  },

  async getTiers(): Promise<Tier[]> {
    try {
      return await fetchWithAuth('/admin/tiers/');
    } catch (e) {
      console.error("Failed to fetch tiers, returning fallback mock data.", e);
      return [];
    }
  },

  async updateTier(tierId: string, data: Partial<Tier>): Promise<{ status: string }> {
    try {
      return await fetchWithAuth(`/admin/tiers/${tierId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Failed to update tier.", e);
      throw e; // Re-throw to allow caller to handle
    }
  },

  async suspendCustomer(customerId: string): Promise<boolean> {
    try {
      await fetchWithAuth(`/admin/customers/${customerId}/suspend`, { method: 'PUT' });
      return true;
    } catch (e) {
      console.error("Failed to suspend customer.", e);
      return false;
    }
  },

  async activateCustomer(customerId: string): Promise<boolean> {
    try {
      await fetchWithAuth(`/admin/customers/${customerId}/activate`, { method: 'PUT' });
      return true;
    } catch (e) {
      console.error("Failed to activate customer.", e);
      return false;
    }
  },

  async changeCustomerTier(customerId: string, newTier: string): Promise<boolean> {
    try {
      await fetchWithAuth(`/admin/customers/${customerId}/tier`, { 
        method: 'PUT',
        body: JSON.stringify({ tier: newTier })
      });
      return true;
    } catch (e) {
      console.error("Failed to update customer tier.", e);
      return false;
    }
  },

  async createCustomer(name: string, tier: string): Promise<Customer | null> {
    try {
      const resp = await fetchWithAuth(`/admin/customers/`, {
        method: 'POST',
        body: JSON.stringify({ name, tier })
      });
      return resp as Customer;
    } catch (e) {
      console.error("Failed to create customer.", e);
      return null;
    }
  },

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await fetchWithAuth(`/admin/customers/${customerId}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      console.error("Failed to delete customer.", e);
      return false;
    }
  },

  async updateCustomer(customerId: string, name: string): Promise<boolean> {
    try {
      await fetchWithAuth(`/admin/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      return true;
    } catch (e) {
      console.error("Failed to update customer.", e);
      return false;
    }
  }
};
