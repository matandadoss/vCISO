"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, MoreVertical, Search, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  is_active: boolean;
  lastActive: string;
};

const ROLES = ["Super Admin", "Admin", "Analyst", "Viewer"];

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    
    // Close menu when clicking outside
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users`);
      if (res.ok) {
        const data = await res.json();
        const mappedUsers = data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.email.split('@')[0],
          email: u.email,
          role: u.role,
          is_active: u.is_active,
          status: u.is_active ? "Active" : "Disabled",
          lastActive: u.last_login ? new Date(u.last_login).toLocaleDateString() : "-",
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail("");
        setShowInvite(false);
        fetchUsers();
      } else {
         const err = await res.json();
         alert(err.detail || "Failed to invite user");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to API");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to update role");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to disable this user?")) return;
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to disable user");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMenu = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === userId ? null : userId);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
              <input 
                type="email" 
                placeholder="colleague@company.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
              />
            </div>
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button 
              onClick={handleInvite}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors h-10 whitespace-nowrap"
            >
              Send Invite
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-visible shadow-sm">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 flex h-9 w-full rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
              />
            </div>
          </div>
          
          <div className="overflow-visible min-h-[300px]">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-muted-foreground bg-accent/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border relative">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found matching "{search}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
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
                          user.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                         )}>
                          {user.is_active && <CheckCircle2 className="h-3 w-3" />}
                          {user.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.lastActive}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => toggleMenu(e, user.id)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeMenuId === user.id && (
                           <div className="absolute right-8 top-10 w-48 bg-card border border-border shadow-lg rounded-md overflow-hidden z-10 flex flex-col py-1 text-left">
                              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase bg-accent/20 border-b border-border">Change Role</div>
                              {ROLES.map((role) => (
                                <button
                                  key={role}
                                  onClick={(e) => { e.stopPropagation(); handleUpdateRole(user.id, role); setActiveMenuId(null); }}
                                  className={cn("px-4 py-2 text-sm text-foreground hover:bg-accent text-left transition-colors", user.role === role && "bg-accent/50 font-medium")}
                                >
                                  Make {role}
                                </button>
                              ))}
                              <div className="h-px bg-border my-1" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); setActiveMenuId(null); }}
                                className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 text-left transition-colors flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="h-4 w-4" /> Disable User
                              </button>
                           </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
