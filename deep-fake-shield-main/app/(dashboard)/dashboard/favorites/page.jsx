"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, HeartOff } from "lucide-react";
import { getFavorites, toggleFavorite, deleteImage } from "@/lib/api";
import ImagePreview from "@/components/dashboard/ImagePreview";

const GALLERY_URL =
  process.env.NEXT_PUBLIC_GALLERY_URL ?? "http://localhost:8001";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch {
      console.error("Failed to load favorites");
    }
    setLoading(false);
  };

  const handleUnfavorite = async (imageId) => {
    setToggling(imageId);
    try {
      await toggleFavorite(imageId);
      setFavorites((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      alert("Failed to remove from favorites.");
    }
    setToggling(null);
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm("Delete this image permanently?")) return;
    try {
      await deleteImage(id);
      setActiveImage(null);
      setFavorites((prev) => prev.filter((img) => img.id !== id));
    } catch {
      alert("Failed to delete image.");
    }
  };

  const getImageUrl = (img) => {
    const url = img?.thumbnail_url || img?.image_url || "";
    return url.startsWith("http") ? url : `${GALLERY_URL}${url}`;
  };

  const getFullUrl = (img) => {
    const url = img?.image_url || "";
    return url.startsWith("http") ? url : `${GALLERY_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="text-[#adc6ff] animate-spin" size={24} />
        <span className="ml-3 text-sm text-slate-400 font-bold uppercase tracking-widest">
          Loading favorites…
        </span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* Header */}
      <section className="p-6 rounded-2xl bg-[#131b2e] border border-white/5">
        <div className="flex items-center gap-3">
          <Heart size={20} className="text-red-400" fill="currentColor" />
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#adc6ff] uppercase">
              Collection
            </p>
            <h2 className="text-2xl font-black text-white">
              Your Favorites
            </h2>
          </div>
          <span className="ml-auto text-[10px] font-bold text-slate-500 bg-[#222a3d] px-3 py-1 rounded-full">
            {favorites.length} {favorites.length === 1 ? "image" : "images"}
          </span>
        </div>
      </section>

      {/* Grid */}
      {favorites.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <HeartOff size={48} className="text-slate-700 mx-auto" />
          <h3 className="text-xl font-bold text-white">No favorites yet</h3>
          <p className="text-sm text-slate-400">
            Click the ❤️ button on any image in the gallery to add it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {favorites.map((img) => (
            <div
              key={img.id}
              className="group relative bg-[#131b2e] rounded-2xl overflow-hidden border border-white/5 hover:border-red-400/20 hover:-translate-y-1 transition-all duration-300 h-56 cursor-pointer"
              onClick={() => setActiveImage({ ...img, fullUrl: getFullUrl(img) })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(img)}
                alt={img.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />

              {/* Unfavorite button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleUnfavorite(img.id); }}
                disabled={toggling === img.id}
                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                title="Remove from favorites"
              >
                {toggling === img.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Heart size={14} fill="currentColor" />
                )}
              </button>

              {/* Status badge */}
              <div
                className={`absolute top-3 left-3 px-2 py-0.5 text-[8px] font-black rounded-full uppercase ${
                  img.verification_status === "unedited"
                    ? "bg-[#4edea3]/20 text-[#4edea3]"
                    : img.verification_status === "edited"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-[#fbbf24]/20 text-[#fbbf24]"
                }`}
              >
                {img.verification_status === "unedited"
                  ? "REAL"
                  : img.verification_status === "edited"
                  ? "FAKE"
                  : "PENDING"}
              </div>

              {/* Info */}
              <div className="absolute bottom-0 p-4 w-full bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs text-white font-bold truncate">
                  {img.title || img.original_filename}
                </p>
                <p className="text-[9px] text-slate-400">
                  {img.uploaded_at
                    ? new Date(img.uploaded_at).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImagePreview
        activeImage={activeImage}
        onClose={() => setActiveImage(null)}
        onDelete={(id) => handleDeleteImage(id)}
        onFavoriteChanged={(id, newState) => {
          if (!newState) {
            setFavorites((prev) => prev.filter((img) => img.id !== id));
          }
        }}
      />
    </div>
  );
}
