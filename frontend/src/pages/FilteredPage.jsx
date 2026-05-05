import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImages } from '../api';
import ImageCard from '../components/ImageCard';

export default function FilteredPage({ status, title, emptyMsg }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getImages(status).then(res => { setImages(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [status]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="section-header">
        <h2>{title}</h2>
        <span className="image-count">{images.length} image{images.length !== 1 ? 's' : ''}</span>
      </div>
      {images.length > 0 ? (
        <div className="image-grid">
          {images.map(img => <ImageCard key={img.id} image={img} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{emptyMsg}</h3>
          <Link to="/upload" className="btn btn-primary">Upload Image</Link>
        </div>
      )}
    </div>
  );
}
