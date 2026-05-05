import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import FilteredPage from './pages/FilteredPage';
import ImageDetailPage from './pages/ImageDetailPage';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/edited" element={<ProtectedRoute><FilteredPage status="edited" title="Edited Images" emptyMsg="No edited images. Images detected as modified by AI appear here." /></ProtectedRoute>} />
          <Route path="/unedited" element={<ProtectedRoute><FilteredPage status="unedited" title="Unedited Images" emptyMsg="No unedited images. Images verified as authentic by AI appear here." /></ProtectedRoute>} />
          <Route path="/pending" element={<ProtectedRoute><FilteredPage status="pending" title="Pending Verification" emptyMsg="No images pending verification." /></ProtectedRoute>} />
          <Route path="/image/:id" element={<ProtectedRoute><ImageDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
