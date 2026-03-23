import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldAlert, BarChart3 } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In real app, clear tokens here
    navigate('/login');
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-container">
            <ShieldAlert className="logo-icon text-accent-primary" size={28} />
            <h2 className="logo-text">vCISO<span className="text-accent-primary">Admin</span></h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </NavLink>
          
          <NavLink to="/customers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Organizations</span>
          </NavLink>
          
          <NavLink to="/tiers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <CreditCard size={20} />
            <span>Tiers & Pricing</span>
          </NavLink>

          <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={20} />
            <span>Revenue Report</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header glass-panel">
          <div className="header-search">
            {/* Global Search placeholder */}
          </div>
          <div className="header-profile">
            <div className="avatar">AD</div>
            <div className="profile-info">
              <span className="profile-name">Admin Chief</span>
              <span className="profile-role text-muted">Super Admin</span>
            </div>
          </div>
        </header>

        <div className="content-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
