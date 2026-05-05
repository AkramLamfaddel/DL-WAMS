import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleFile = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select an image.'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image_file', file);
      fd.append('title', title);
      fd.append('description', description);
      const res = await uploadImage(fd);
      navigate(`/image/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="upload-page">
      <div className="section-header"><h2>⬆️ Upload Image</h2></div>
      <div className="upload-card">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          {!preview ? (
            <div className="drop-zone"
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
              onDrop={handleDrop}>
              <div className="drop-zone-content">
                <div className="drop-icon">📷</div>
                <h3>Drag & drop your image here</h3>
                <p>or click to browse files</p>
                <p className="drop-hint">Supports: JPEG, PNG, GIF, WebP, BMP, TIFF — Max 50MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Preview" />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => { setFile(null); setPreview(null); }}>✕ Remove</button>
            </div>
          )}

          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Image title (auto-filled from filename)" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Optional description..." />
          </div>

          <div className="upload-info-box">
            <span className="info-icon">🤖</span>
            <p>After upload, your image will be <strong>automatically sent to the AI service</strong> for authenticity verification.</p>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Uploading & Verifying...' : 'Upload & Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
