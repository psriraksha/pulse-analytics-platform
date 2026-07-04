import { NavLink } from 'react-router-dom';
import { BarChart3, Radio, Settings, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { company, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Activity size={22} color="#818cf8" />
        Pulse
      </div>

      <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <BarChart3 size={17} /> Dashboard
      </NavLink>
      <NavLink to="/live" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <Radio size={17} /> Live
      </NavLink>
      <NavLink to="/setup" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <Settings size={17} /> Setup
      </NavLink>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 13, color: '#9598a6', padding: '0 12px 8px' }}>{company?.name}</div>
      <button
        className="sidebar-link"
        style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
        onClick={logout}
      >
        <LogOut size={17} /> Log out
      </button>
    </div>
  );
}
