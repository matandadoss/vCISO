import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real scenario, call auth endpoint
    if(email && password) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <ShieldAlert className="login-icon text-accent-primary" size={48} />
          <h1>Admin Portal</h1>
          <p className="text-muted">Enter restricted administrative zone</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="modern-input with-icon" 
                placeholder="admin@vciso.local"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="modern-input with-icon" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-submit">
            Authenticate Session
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
