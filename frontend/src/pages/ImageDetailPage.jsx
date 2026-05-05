import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getImageDetail, verifyImage, deleteImage } from '../api';

const STATUS_MAP = {
  unedited: '✅ Authentic (Unedited)',
  edited: '✏️ Modified (Edited)',
  pending: '⏳ Pending Verification',
  error: '❌ Verification Error',
  rejected: '🚫 Rejected',
};

export default function ImageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const load = () => {
    getImageDetail(id).then(res => { setImage(res.data); setLoading(false); }).catch(() => { setLoading(false); navigate('/'); });
  };
  useEffect(load, [id]);

  const handleVerify = async () => {
    setVerifying(true);
    try { const res = await verifyImage(id); setImage(res.data); } catch (e) { alert('AI service unavailable.'); }
    setVerifying(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this image permanently?')) return;
    await deleteImage(id);
    navigate('/');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!image) return <div className="loading">Image not found.</div>;

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">← Back to Gallery</Link>
      <div className="detail-layout">
        <div className="detail-image-container">
          <img src={image.image_url} alt={image.title} className="detail-image" />
        </div>

        <div className="detail-sidebar">
          <h1 className="detail-title">{image.title}</h1>

          <div className="detail-status">
            <span className={`status-badge status-${image.verification_status} status-lg`}>
              {STATUS_MAP[image.verification_status] || '⏳ Pending'}
            </span>
          </div>

          {image.ai_confidence_score != null && (
            <div className="confidence-bar-container">
              <label>AI Confidence</label>
              <div className="confidence-bar">
                <div className={`confidence-fill ${image.verification_status === 'unedited' ? 'fill-green' : 'fill-red'}`}
                  style={{ width: `${image.ai_confidence_score}%` }} />
              </div>
              <span className="confidence-value">{Number(image.ai_confidence_score).toFixed(1)}%</span>
            </div>
          )}

          {image.description && (
            <div className="detail-section"><h3>Description</h3><p>{image.description}</p></div>
          )}

          <div className="detail-section">
            <h3>File Information</h3>
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Filename</span><span className="info-value">{image.original_filename}</span></div>
              <div className="info-item"><span className="info-label">Size</span><span className="info-value">{image.file_size_display}</span></div>
              <div className="info-item"><span className="info-label">Dimensions</span><span className="info-value">{image.dimensions_display}</span></div>
              <div className="info-item"><span className="info-label">Type</span><span className="info-value">{image.mime_type}</span></div>
              <div className="info-item"><span className="info-label">Uploaded</span><span className="info-value">{new Date(image.uploaded_at).toLocaleString()}</span></div>
              {image.verified_at && <div className="info-item"><span className="info-label">Verified</span><span className="info-value">{new Date(image.verified_at).toLocaleString()}</span></div>}
            </div>
          </div>

          {image.verifications?.length > 0 && (
            <div className="detail-section">
              <h3>Verification History</h3>
              <div className="verification-history">
                {image.verifications.map((v, i) => (
                  <div key={i} className="history-item">
                    <span className={`status-badge status-${v.status} status-sm`}>{v.status}</span>
                    <span className="history-date">{new Date(v.requested_at).toLocaleString()}</span>
                    {v.confidence_score != null && <span className="history-conf">{v.confidence_score}%</span>}
                    {v.error_message && <span className="history-error">{v.error_message}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button onClick={handleVerify} className={`btn ${image.verification_status === 'pending' ? 'btn-primary' : 'btn-secondary'} btn-block`} disabled={verifying}>
              {verifying ? '🔄 Verifying...' : image.verification_status === 'pending' ? '🤖 Verify with AI' : '🔄 Re-verify'}
            </button>
            <button onClick={handleDelete} className="btn btn-danger btn-block">🗑️ Delete Image</button>
          </div>
        </div>
      </div>
    </div>
  );
}
