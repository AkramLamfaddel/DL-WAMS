import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  unedited: { label: '✅ Authentic', className: 'status-unedited' },
  edited:   { label: '✏️ Modified', className: 'status-edited' },
  pending:  { label: '⏳ Pending',  className: 'status-pending' },
  error:    { label: '❌ Error',    className: 'status-error' },
  rejected: { label: '🚫 Rejected', className: 'status-rejected' },
};

export default function ImageCard({ image }) {
  const status = STATUS_CONFIG[image.verification_status] || STATUS_CONFIG.pending;

  return (
    <Link to={`/image/${image.id}`} className="image-card">
      <div className="image-wrapper">
        <img
          src={image.thumbnail_url || image.image_url}
          alt={image.title}
          loading="lazy"
        />
        <div className="image-overlay">
          <span className="view-text">View Details</span>
        </div>
      </div>
      <div className="image-info">
        <h4 className="image-title">{image.title}</h4>
        <div className="image-meta">
          <span className={`status-badge ${status.className}`}>{status.label}</span>
          <span className="image-size">{image.file_size_display}</span>
        </div>
      </div>
    </Link>
  );
}
