"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Download, Maximize2, MoreVertical, Plus, Trash2, Heart,
  FolderPlus, ShieldCheck, Pencil,
} from "lucide-react";
import ImagePreview from "./ImagePreview";
import { deleteImage, toggleFavorite, getAlbums, addImagesToAlbum, verifyImage } from "@/lib/api";

const GALLERY_URL = process.env.NEXT_PUBLIC_GALLERY_URL || "";

export default function GalleryGrid({ images, onImageDeleted, onImageUpdated }) {
  const [activeImage, setActiveImage] = useState(null);
  const [favStates, setFavStates] = useState({});
  const [updatedImages, setUpdatedImages] = useState({}); // track verification updates

  // Context menu state (rendered at body level, not inside card)
  const [contextMenu, setContextMenu] = useState(null); // { imageId, x, y }
  const [albums, setAlbums] = useState(null); // lazy-loaded
  const [verifyingId, setVerifyingId] = useState(null);

  // Track local favorite overrides
  const isFav = (img) => favStates[img.id] !== undefined ? favStates[img.id] : img.is_favorite;

  const handleToggleFav = async (img) => {
    const newState = !isFav(img);
    setFavStates((prev) => ({ ...prev, [img.id]: newState }));
    try {
      await toggleFavorite(img.id);
    } catch {
      setFavStates((prev) => ({ ...prev, [img.id]: !newState }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image permanently?")) return;
    try {
      await deleteImage(id);
      setActiveImage(null);
      onImageDeleted?.(id);
    } catch (e) {
    }
  };

  // Build full image URL from backend path
  const getImageUrl = (img) => {
    if (!img) return "";
    const url = img.thumbnail_url || img.image_url || "";
    if (url.startsWith("http")) return url;
    return `${GALLERY_URL}${url}`;
  };

  const getFullUrl = (img) => {
    if (!img) return "";
    const url = img.image_url || "";
    if (url.startsWith("http")) return url;
    return `${GALLERY_URL}${url}`;
  };

  // ─── Context menu handlers ───
  const openContextMenu = async (e, image) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 260; // estimated menu height
    const viewportH = window.innerHeight;

    // If menu would overflow bottom, open upward
    const spaceBelow = viewportH - rect.bottom;
    const y = spaceBelow < menuHeight
      ? rect.top - menuHeight  // flip upward
      : rect.bottom + 6;       // normal downward

    // Keep x within viewport
    const x = Math.max(8, Math.min(rect.right - 210, window.innerWidth - 220));

    setContextMenu({ image, x, y });
    // Lazy-load albums list
    if (!albums) {
      try {
        const data = await getAlbums();
        setAlbums(data);
      } catch {
        setAlbums([]);
      }
    }
  };

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Close menu on outside click
  useEffect(() => {
    if (contextMenu) {
      const handler = () => closeContextMenu();
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [contextMenu, closeContextMenu]);

  const handleAddToAlbum = async (albumId) => {
    if (!contextMenu) return;
    try {
      await addImagesToAlbum(albumId, [contextMenu.image.id]);
    } catch {
    }
    closeContextMenu();
  };

  const handleQuickVerify = async () => {
    if (!contextMenu) return;
    const img = contextMenu.image;
    const imgId = img.id;
    closeContextMenu();
    setVerifyingId(imgId);
    try {
      const updated = await verifyImage(imgId);
      // Update the card status in real-time
      setUpdatedImages((prev) => ({ ...prev, [imgId]: updated }));
      setVerifyingId(null);
      onImageUpdated?.();
      // Open the detail modal to show the results
      setActiveImage({ ...img, ...updated, fullUrl: getFullUrl(img) });
    } catch {
      alert("AI service unavailable.");
      setVerifyingId(null);
    }
  };

  const handleRename = () => {
    if (!contextMenu) return;
    const newName = prompt("Enter new name:", contextMenu.image.title || "");
    closeContextMenu();
    if (newName && newName.trim()) {
      // Note: rename API could be added; for now just alert
      alert(`Rename feature requires a PATCH endpoint. Title: "${newName.trim()}"`);
    }
  };

  return (
    <>
      {images.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="text-5xl mb-4">🖼️</div>
          <h3 className="text-xl font-bold text-white">Your vault is empty</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Upload your first image to get started with AI verification.
          </p>
          <Link
            href="/dashboard/analyze"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-linear-to-br from-[#adc6ff] to-[#357df1] text-[#002e6a] font-bold rounded-xl text-sm hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={18} />
            Upload Image
          </Link>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {/* Upload New Placeholder */}
          <Link
            href={"/dashboard/analyze"}
            className="break-inside-avoid mb-4 flex aspect-square rounded-lg border-2 border-dashed border-white/5 bg-[#131b2e]/30 flex-col items-center justify-center gap-3 group hover:border-[#adc6ff]/40 hover:bg-[#131b2e]/50 transition-all duration-500"
          >
            <div className="p-4 rounded-full bg-[#adc6ff]/5 group-hover:scale-110 transition-transform">
              <Plus className="text-[#adc6ff]" size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
              Add Image
            </span>
          </Link>

          {images.map((image) => {
            // Merge any real-time updates (e.g., after Quick Verify)
            const img = updatedImages[image.id] ? { ...image, ...updatedImages[image.id] } : image;
            return (
              <MediaCard
                key={img.id}
                image={img}
                imageUrl={getImageUrl(img)}
                fullUrl={getFullUrl(img)}
                isFavorite={isFav(img)}
                isVerifying={verifyingId === img.id}
                onToggleFav={() => handleToggleFav(img)}
                onExpand={() =>
                  setActiveImage({ ...img, fullUrl: getFullUrl(img) })
                }
                onDelete={() => handleDelete(img.id)}
                onMenuClick={(e) => openContextMenu(e, img)}
              />
            );
          })}
        </div>
      )}

      <ImagePreview
        activeImage={activeImage}
        onClose={() => setActiveImage(null)}
        onDelete={(id) => handleDelete(id)}
        onFavoriteChanged={(id, newState) => {
          setFavStates((prev) => ({ ...prev, [id]: newState }));
        }}
      />

      {/* ─── Context Menu (rendered at body level, OUTSIDE card overflow) ─── */}
      {contextMenu && (
        <div
          className="fixed z-[200] w-52 bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add to Album — with album list */}
          <div className="px-3 pt-3 pb-1">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest px-1">
              Add to Album
            </p>
          </div>
          {!albums ? (
            <p className="px-4 py-2 text-[10px] text-slate-500">Loading…</p>
          ) : albums.length === 0 ? (
            <p className="px-4 py-2 text-[10px] text-slate-500 italic">No albums — create one first</p>
          ) : (
            <div className="max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2d3449 transparent' }}>
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => handleAddToAlbum(album.id)}
                  className="w-full px-4 py-1.5 text-left text-[10px] font-medium text-slate-300 hover:bg-[#adc6ff]/10 hover:text-[#adc6ff] transition-colors flex items-center gap-2"
                >
                  <FolderPlus size={10} className="shrink-0 text-slate-500" />
                  <span className="truncate">{album.title}</span>
                  <span className="ml-auto text-[8px] text-slate-600">{album.image_count || 0}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/5 my-1" />

          {/* Quick Verify */}
          <button
            onClick={handleQuickVerify}
            className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-300 hover:bg-[#4edea3]/10 hover:text-[#4edea3] transition-colors flex items-center gap-2"
          >
            <ShieldCheck size={12} /> Quick Verify with AI
          </button>

          {/* Rename */}
          <button
            onClick={handleRename}
            className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
          >
            <Pencil size={12} /> Rename
          </button>

          <div className="border-t border-white/5 my-1" />

          {/* View Details */}
          <button
            onClick={() => {
              const img = contextMenu.image;
              closeContextMenu();
              setActiveImage({ ...img, fullUrl: getFullUrl(img) });
            }}
            className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
          >
            <Maximize2 size={12} /> View Full Details
          </button>
        </div>
      )}
    </>
  );
}

const STATUS_CONFIG = {
  unedited: { label: "REAL", color: "bg-[#4edea3]/20 text-[#4edea3]" },
  edited: { label: "FAKE", color: "bg-[#eb4141]/20 text-[#eb4141]" },
  pending: { label: "PENDING", color: "bg-[#fbbf24]/20 text-[#fbbf24]" },
  error: { label: "ERROR", color: "bg-[#eb4141]/20 text-[#eb4141]" },
  rejected: { label: "REJECTED", color: "bg-slate-500/20 text-slate-400" },
};

function MediaCard({ image, imageUrl, fullUrl, isFavorite, isVerifying, onToggleFav, onExpand, onDelete, onMenuClick }) {
  const status = STATUS_CONFIG[image.verification_status] || STATUS_CONFIG.pending;

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = fullUrl || imageUrl;
    link.download = image.original_filename || image.title || "image";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onExpand}
      className="break-inside-avoid mb-4 group relative rounded-lg overflow-hidden bg-[#131b2e] border border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-[#adc6ff]/10 hover:-translate-y-1 cursor-zoom-in"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={image.title || "Image"}
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
        loading="lazy"
      />

      {/* Verifying overlay */}
      {isVerifying && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl">
            <ShieldCheck size={14} className="text-[#4edea3] animate-pulse" />
            <span className="text-[10px] text-white font-bold">Verifying…</span>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 left-3">
        <span
          className={`text-[8px] font-black px-2 py-0.5 rounded tracking-widest ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${
          isFavorite
            ? "bg-red-500/20 text-red-400"
            : "bg-[#0b1326]/60 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
        }`}
      >
        <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      {/* Selection Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-[#0b1326] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {/* Three Dots — opens context menu OUTSIDE the card */}
        <div className="absolute top-3 right-12">
          <button
            onClick={onMenuClick}
            className="p-1.5 bg-[#0b1326]/60 backdrop-blur-md rounded-lg text-white hover:text-[#adc6ff] transition-colors"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter mb-1">
            {image.title || image.original_filename}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-400 font-bold">
              {image.file_size_display || ""}
            </span>
            <div className="flex gap-2">
              <button
                className="text-slate-400 hover:text-white transition-colors"
                onClick={handleDownload}
                title="Download"
              >
                <Download size={14} />
              </button>
              <button
                className="text-slate-400 hover:text-[#eb4141] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-500">
          <Maximize2 className="text-white" size={18} />
        </div>
      </div>
    </div>
  );
}
