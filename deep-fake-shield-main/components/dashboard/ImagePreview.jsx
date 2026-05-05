"use client";

import { useEffect, useState } from "react";

import { X, Download, Trash2, Maximize, Share2, ShieldCheck, Loader2, Heart } from "lucide-react";
import { verifyImage, toggleFavorite } from "@/lib/api";

const GALLERY_URL = process.env.NEXT_PUBLIC_GALLERY_URL || "";

export default function ImagePreview({ activeImage, onClose, onDelete, onFavoriteChanged }) {
  const [verifying, setVerifying] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeImage]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = "hidden";
      setImageData(activeImage);
      setIsFav(activeImage.is_favorite || false);
    } else {
      document.body.style.overflow = "unset";
      setImageData(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeImage]);

  if (!imageData) return null;

  const fullUrl = imageData.fullUrl || (() => {
    const url = imageData.image_url || "";
    return url.startsWith("http") ? url : `${GALLERY_URL}${url}`;
  })();

  const status = imageData.verification_status || "pending";
  const isAuthentic = status === "unedited";
  const isFake = status === "edited";

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const updated = await verifyImage(imageData.id);
      setImageData({ ...imageData, ...updated, fullUrl });
    } catch {
      alert("AI service unavailable. Please try again later.");
    }
    setVerifying(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = imageData.original_filename || imageData.title || "image";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFav = async () => {
    setTogglingFav(true);
    const newState = !isFav;
    setIsFav(newState);
    try {
      await toggleFavorite(imageData.id);
      onFavoriteChanged?.(imageData.id, newState);
    } catch {
      setIsFav(!newState);
    }
    setTogglingFav(false);
  };

  const statusDisplay = {
    unedited: { label: "AUTHENTIC", color: "border-[#4edea3]/30", textColor: "text-[#4edea3]", dotColor: "bg-[#4edea3]" },
    edited: { label: "MODIFIED", color: "border-[#eb4141]/30", textColor: "text-[#eb4141]", dotColor: "bg-[#eb4141]" },
    pending: { label: "PENDING", color: "border-[#fbbf24]/30", textColor: "text-[#fbbf24]", dotColor: "bg-[#fbbf24]" },
    error: { label: "ERROR", color: "border-[#eb4141]/30", textColor: "text-[#eb4141]", dotColor: "bg-[#eb4141]" },
  };

  const st = statusDisplay[status] || statusDisplay.pending;


  if (!activeImage) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000a1a]/50 backdrop-blur-2xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-7xl h-full md:h-[85vh] flex flex-col md:flex-row bg-[#0b1326] md:rounded-[40px] overflow-hidden border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close Button (Mobile Only) */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-10 p-3 bg-black/40 backdrop-blur-md rounded-full text-white md:hidden"
        >
          <X size={20} />
        </button>

        {/* 1. Main Viewport */}
        <div
          className="flex-1 relative flex items-center justify-center bg-black/40 overflow-hidden cursor-zoom-out"
          onClick={onClose}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullUrl}
            alt={imageData.title || "Image"}
            className="max-w-full max-h-full object-contain p-4 md:p-12 transition-transform duration-500"
          />
        </div>

        {/* 2. Technical Sidebar */}
        <aside className="w-full md:w-95 bg-[#131b2e] border-l border-white/5 flex flex-col shrink-0">
          {/* Sidebar Header */}
          <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${st.dotColor} animate-pulse`} />
              <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${st.textColor}`}>
                {st.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Favorite Button in Header */}
              <button
                onClick={handleToggleFav}
                disabled={togglingFav}
                className={`p-2 rounded-xl transition-all ${
                  isFav
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "text-slate-500 hover:text-red-400 hover:bg-white/5"
                }`}
                title={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={18} fill={isFav ? "currentColor" : "none"} />
              </button>
              <button
                onClick={onClose}
                className="hidden md:flex p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Metadata Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Title & ID */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white leading-tight tracking-tight">
                {imageData.title || imageData.original_filename}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                ID: {imageData.id}
              </p>
            </div>

            {/* AI Confidence */}
            {imageData.ai_confidence_score != null && (
              <div className="space-y-2">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  AI Confidence
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#0b1326] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAuthentic
                          ? "bg-[#4edea3] shadow-[0_0_10px_rgba(78,222,163,0.3)]"
                          : "bg-[#eb4141] shadow-[0_0_10px_rgba(235,65,65,0.3)]"
                      }`}
                      style={{ width: `${imageData.ai_confidence_score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-black ${isAuthentic ? "text-[#4edea3]" : "text-[#eb4141]"}`}>
                    {Number(imageData.ai_confidence_score).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            {imageData.tags?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {imageData.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider"
                      style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Album */}
            {imageData.album_title && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Album</p>
                <p className="text-xs text-[#adc6ff] font-bold">📁 {imageData.album_title}</p>
              </div>
            )}

            {/* Technical Grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Filename" value={imageData.original_filename || "—"} />
              <InfoCard
                label="Dimensions"
                value={imageData.dimensions_display || `${imageData.width || "?"}×${imageData.height || "?"}`}
              />
              <InfoCard label="File Size" value={imageData.file_size_display || "—"} />
              <InfoCard label="Format" value={imageData.mime_type || "—"} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                label="Uploaded"
                value={imageData.uploaded_at ? new Date(imageData.uploaded_at).toLocaleDateString() : "—"}
              />
              <InfoCard
                label="Verified"
                value={imageData.verified_at ? new Date(imageData.verified_at).toLocaleDateString() : "Not yet"}
              />
            </div>

            {/* Description */}
            {imageData.description && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  Description
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {imageData.description}
                </p>
              </div>
            )}

            {/* Verification History */}
            {imageData.verifications?.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  Verification History
                </p>
                {imageData.verifications.map((v, i) => {
                  const vStatus = v.status === "unedited" ? "REAL" : v.status === "edited" ? "FAKE" : v.status?.toUpperCase();
                  const vColor = v.status === "unedited" ? "text-[#4edea3] bg-[#4edea3]/10" : "text-[#eb4141] bg-[#eb4141]/10";
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1326] border border-white/5">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded ${vColor}`}>
                        {vStatus}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {v.requested_at ? new Date(v.requested_at).toLocaleString() : "—"}
                      </span>
                      {v.confidence_score != null && (
                        <span className="text-[10px] text-slate-400 ml-auto font-bold">
                          {v.confidence_score}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed Footer Actions */}
          <div className="p-8 pt-4 space-y-3 bg-linear-to-t from-[#131b2e] to-transparent">
            {/* Verify / Re-verify button */}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full py-4 bg-[#adc6ff] text-[#001a42] rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(173,198,255,0.25)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              {verifying
                ? "Analyzing…"
                : status === "pending"
                ? "Verify with AI"
                : "Re-verify"}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-white/5 text-white/70 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
            >
              <Download size={16} />
              Export Source File
            </button>

            {/* Delete */}
            <button
               onClick={(e) => {
               onDelete?.(imageData.id);
              onClose();
               }}
              className="w-full py-4 bg-white/5 text-white/50 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#eb4141]/10 hover:text-[#eb4141] transition-all"
            >
              <Trash2 size={16} />
              Purge from Vault
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* Internal Sub-components */
function InfoCard({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-[#0b1326] border border-white/5 hover:border-white/10 transition-colors">
      <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">
        {label}
      </p>
      <p className="text-xs text-white font-mono truncate">{value}</p>
    </div>
  );
}
