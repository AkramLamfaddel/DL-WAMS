import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImages, getStats, getHealth } from '../api';
import ImageCard from '../components/ImageCard';

export default function DashboardPage() {
  const [images, setImages] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, unedited: 0, edited: 0 });
  const [health, setHealth] = useState(null);  // null = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load images + stats first (fast — no timeout issues)
    const loadMain = async () => {
      try {
        const [imgRes, statsRes] = await Promise.allSettled([getImages(), getStats()]);
        if (imgRes.status === 'fulfilled') setImages(imgRes.value.data);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      } catch (e) { console.error(e); }
      setLoading(false);  // Show page immediately
    };

    // Load health separately in background (may be slow)
    const loadHealth = async () => {
      try {
        const res = await getHealth();
        setHealth(res.data.services);
      } catch (e) {
        setHealth(false);  // Gallery is down — can't determine other services
      }
    };

    loadMain();
    loadHealth();  // Runs in parallel, doesn't block the page
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card stat-total"><div className="stat-icon">🖼️</div><div className="stat-info"><span className="stat-number">{stats.total}</span><span className="stat-label">TOTAL IMAGES</span></div></div>
        <div className="stat-card stat-unedited"><div className="stat-icon">✅</div><div className="stat-info"><span className="stat-number">{stats.unedited}</span><span className="stat-label">UNEDITED</span></div></div>
        <div className="stat-card stat-edited"><div className="stat-icon">✏️</div><div className="stat-info"><span className="stat-number">{stats.edited}</span><span className="stat-label">EDITED</span></div></div>
        <div className="stat-card stat-pending"><div className="stat-icon">⏳</div><div className="stat-info"><span className="stat-number">{stats.pending}</span><span className="stat-label">PENDING</span></div></div>
      </div>

      <div className="services-health">
        <h3>🔗 Microservices Status</h3>
        <div className="health-indicators">
          {health ? (
            <>
              <span className={`health-dot ${health.gallery ? 'healthy' : 'unhealthy'}`}>Gallery Service</span>
              <span className={`health-dot ${health.auth ? 'healthy' : 'unhealthy'}`}>Auth Service</span>
              <span className={`health-dot ${health.ai ? 'healthy' : 'unhealthy'}`}>AI Service</span>
              <span className={`health-dot ${health.historique ? 'healthy' : 'unhealthy'}`}>History Service</span>
            </>
          ) : health === false ? (
            <>
              <span className="health-dot unhealthy">Gallery Service</span>
              <span className="health-dot unknown">Auth Service</span>
              <span className="health-dot unknown">AI Service</span>
              <span className="health-dot unknown">History Service</span>
            </>
          ) : (
            <span className="health-loading">Checking services...</span>
          )}
        </div>
      </div>

      <div className="section-header">
        <h2>All Images</h2>
        <Link to="/upload" className="btn btn-primary">⬆️ Upload New</Link>
      </div>

      {images.length > 0 ? (
        <div className="image-grid">
          {images.map(img => <ImageCard key={img.id} image={img} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🖼️</div>
          <h3>Your gallery is empty</h3>
          <p>Upload your first image to get started with AI verification.</p>
          <Link to="/upload" className="btn btn-primary">Upload Image</Link>
        </div>
      )}
    </div>
  );
}
