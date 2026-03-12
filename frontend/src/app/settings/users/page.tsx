"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, MoreVertical, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_USERS = [
  { id: "1", name: "Acme Admin", email: "admin@acme.com", role: "Super Admin", status: "Active", lastActive: "Just now" },
  { id: "2", name: "Security Analyst", email: "secops@acme.com", role: "Analyst", status: "Active", lastActive: "2 hours ago" },
  { id: "3", name: "Jane Doe", email: "jane@acme.com", role: "Viewer", status: "Invited", lastActive: "-" },
];

const ROLES = ["Super Admin", "Admin", "Analyst", "Viewer"];

export default function UsersSettingsPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              User Management & RBAC
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage team access, assign roles, and enforce security boundaries.
            </p>
          </div>
          <button 
            onClick={() => setShowInvite(!showInvite)}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite User
          </button>
        </div>

        {showInvite && (
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col sm:flex-row gap-4 items-end shadow-sm">
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <input type="email" placeholder="colleague@company.com" className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors h-10 whitespace-nowrap">
              Send Invite
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 flex h-9 w-full rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-accent/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-muted-foreground text-xs">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                        user.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                       )}>
                        {user.status === 'Active' && <CheckCircle2 className="h-3 w-3" />}
                        {user.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
