import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="nav-logo">🛡️</span>
        <span className="nav-title">ImageGuard</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/unedited" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">✅</span> Unedited
        </NavLink>
        <NavLink to="/edited" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">✏️</span> Edited
        </NavLink>
        <NavLink to="/pending" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⏳</span> Pending
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `nav-link btn-upload ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⬆️</span> Upload
        </NavLink>
      </div>
      <div className="nav-user">
        <span className="user-avatar">{user.username[0].toUpperCase()}</span>
        <span className="user-name">{user.username}</span>
        <button onClick={handleLogout} className="nav-link logout-link">Logout</button>
      </div>
    </nav>
  );
}
