"use client";

import { useRef, useState } from "react";

import { CloudUpload, ShieldCheck, Database, Loader2, X, CheckCircle2 } from "lucide-react";
import { uploadImage } from "@/lib/api";

const GALLERY_URL = process.env.NEXT_PUBLIC_GALLERY_URL || "";

export default function UploadZone({ onUploadComplete }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const processFile = (f) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      return;
    }
    setError("");
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    setUploadResult(null);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setError("");
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("image_file", file);
      fd.append("title", title || file.name);
      fd.append("description", description);

      const result = await uploadImage(fd);
      setUploadResult(result);
      onUploadComplete?.(result);
    } catch (err) {
      setError(
        err.data?.errors?.join(", ") ||
          err.data?.error ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // After successful upload, show the result
  if (uploadResult) {
    return (
      <section className="relative">
        <div className="p-1 rounded-2xl border-2 border-[#4edea3]/30 bg-[#4edea3]/5">
          <div className="relative bg-[#060e20] rounded-xl py-12 px-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="text-[#4edea3] mb-4" size={48} />
            <h3 className="text-xl font-bold font-headline text-white mb-2 uppercase tracking-wide">
              Upload Successful
            </h3>
            <p className="text-[#c6c6cd] max-w-sm font-body text-sm mb-2">
              <strong>"{uploadResult.title}"</strong> has been added to your
              vault.
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-6">
              Status: Pending Verification — You can verify it from the Gallery
              or Analyze page.
            </p>

            {/* Preview of uploaded image */}
            {uploadResult.image_url && (
              <div className="w-full max-w-md rounded-xl overflow-hidden border border-white/10 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    uploadResult.image_url.startsWith("http")
                      ? uploadResult.image_url
                      : `${GALLERY_URL}${uploadResult.image_url}`
                  }
                  alt={uploadResult.title}
                  className="w-full h-auto object-cover max-h-64"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={clearFile}
                className="px-6 py-3 bg-[#adc6ff] text-[#001a42] rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative space-y-6">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif, image/bmp, image/tiff"
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-[#eb4141]/10 border border-[#eb4141]/20 rounded-xl text-sm text-[#ff8a8a]">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!preview ? (
        /* Drop Zone */
        <div
          className={`p-1 rounded-2xl border-2 border-dashed transition-colors duration-300 ${
            isDragging
              ? "border-[#adc6ff] bg-[#adc6ff]/10"
              : "border-[#adc6ff]/20 bg-[#131b2e]/30"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative bg-[#060e20] rounded-xl py-20 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-500 hover:bg-[#131b2e]"
          >
            {/* Grid Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#adc6ff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[#adc6ff]/5 flex items-center justify-center border border-[#adc6ff]/20 group-hover:scale-110 transition-transform duration-500">
                <CloudUpload className="text-[#adc6ff]" size={40} />
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#adc6ff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#adc6ff]"></span>
                </span>
              </div>
            </div>

            <h3 className="text-xl font-bold font-headline text-white mb-2 uppercase tracking-wide">
              Secure Drop Zone
            </h3>
            <p className="text-[#c6c6cd] max-w-sm font-body text-sm">
              Drag source files here or{" "}
              <span className="text-[#adc6ff] font-semibold hover:underline">
                browse files
              </span>
              . <br />
              JPG, PNG, WEBP (Max 50MB)
            </p>

            <div className="mt-8 flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#222a3d] rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={12} /> AES-256 Encrypted
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#222a3d] rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <Database size={12} /> No-Retention Policy
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview + Upload Form */
        <div className="p-1 rounded-2xl border-2 border-[#adc6ff]/20 bg-[#131b2e]/30">
          <div className="bg-[#060e20] rounded-xl p-8 space-y-6">
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-80 object-contain bg-black/40"
              />
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-[#eb4141] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#c6c6cd] ml-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Image title (auto-filled from filename)"
                className="w-full bg-[#131b2e] border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-[#adc6ff] focus:outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#c6c6cd] ml-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional description..."
                className="w-full bg-[#131b2e] border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-[#adc6ff] focus:outline-none transition-all resize-vertical"
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-[#adc6ff]/5 border border-[#adc6ff]/10 rounded-xl">
              <ShieldCheck size={18} className="text-[#adc6ff] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Your image will be uploaded to the vault. AI verification is{" "}
                <strong className="text-[#adc6ff]">optional</strong> — you can
                verify it later from the Gallery or this page.
              </p>
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 bg-linear-to-br from-[#adc6ff] to-[#357df1] text-[#001a42] rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <CloudUpload size={18} />
                  Upload to Vault
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
