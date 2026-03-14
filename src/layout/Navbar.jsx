import { useState } from 'react';
import { MdSearch, MdNotifications, MdPerson, MdArrowDropDown } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
      </div>
      <div className="navbar-right">
        <div className="navbar-search">
          <MdSearch className="navbar-search-icon" />
          <input
            className="navbar-search-input"
            placeholder="Search products, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="navbar-icon-btn">
          <MdNotifications />
          <span className="notification-dot" />
        </button>
        <div className="navbar-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className="navbar-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name}</span>
            <span className="navbar-user-role">{user?.role}</span>
          </div>
          <MdArrowDropDown />
          {dropdownOpen && (
            <div className="navbar-dropdown">
              <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>Profile</button>
              <button onClick={() => { navigate('/settings'); setDropdownOpen(false); }}>Settings</button>
              <hr />
              <button onClick={handleLogout} style={{ color: 'var(--danger)' }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
