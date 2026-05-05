import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';

export default function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await register(form);
      onLogin(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors) {
        const msgs = Object.entries(err.response.data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setError(msgs.join(' | '));
      } else {
        setError('Registration failed. Service may be unavailable.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-body">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🛡️</span>
            <h1>Create Account</h1>
            <p>Join ImageGuard to verify your images</p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input value={form.first_name} onChange={set('first_name')} placeholder="First name" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={form.last_name} onChange={set('last_name')} placeholder="Last name" />
              </div>
            </div>
            <div className="form-group"><label>Username *</label><input value={form.username} onChange={set('username')} placeholder="Choose a username" required /></div>
            <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required /></div>
            <div className="form-group"><label>Password *</label><input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} /></div>
            <div className="form-group"><label>Confirm Password *</label><input type="password" value={form.password_confirm} onChange={set('password_confirm')} placeholder="Repeat password" required minLength={6} /></div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          </form>
          <div className="auth-footer"><p>Already have an account? <Link to="/login">Sign in</Link></p></div>
        </div>
      </div>
    </div>
  );
}
