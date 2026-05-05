"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  X,
  ArrowLeft,
} from "lucide-react";
import ImagePreview from "@/components/dashboard/ImagePreview";
import {
  getAlbums,
  createAlbum,
  deleteAlbum,
  getAlbumDetail,
  getImages,
  addImagesToAlbum,
  removeImagesFromAlbum,
  deleteImage,
} from "@/lib/api";

const GALLERY_URL =
  process.env.NEXT_PUBLIC_GALLERY_URL ?? "http://localhost:8001";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Album detail view
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  // Add images modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Image preview modal
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await getAlbums();
      setAlbums(data);
    } catch {
      console.error("Failed to load albums");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const album = await createAlbum(newTitle.trim(), newDesc.trim());
      setAlbums((prev) => [album, ...prev]);
      setNewTitle("");
      setNewDesc("");
    } catch {
      alert("Failed to create album.");
    }
    setCreating(false);
  };

  const handleDelete = async (albumId) => {
    if (!confirm("Delete this album? Images will NOT be deleted.")) return;
    try {
      await deleteAlbum(albumId);
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      if (selectedAlbum?.id === albumId) setSelectedAlbum(null);
    } catch {
      alert("Failed to delete album.");
    }
  };

  const openAlbum = async (album) => {
    setLoadingAlbum(true);
    setSelectedAlbum(album);
    try {
      const detail = await getAlbumDetail(album.id);
      setAlbumImages(detail.images || []);
    } catch {
      setAlbumImages([]);
    }
    setLoadingAlbum(false);
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setSelectedIds([]);
    try {
      const imgs = await getImages();
      // Filter out images already in this album
      const albumImageIds = albumImages.map((i) => i.id);
      setAllImages(imgs.filter((i) => !albumImageIds.includes(i.id)));
    } catch {
      setAllImages([]);
    }
  };

  const handleAddImages = async () => {
    if (selectedIds.length === 0) return;
    try {
      await addImagesToAlbum(selectedAlbum.id, selectedIds);
      setShowAddModal(false);
      openAlbum(selectedAlbum); // Refresh
    } catch {
      alert("Failed to add images.");
    }
  };

  const handleRemoveImage = async (imageId) => {
    try {
      await removeImagesFromAlbum(selectedAlbum.id, [imageId]);
      setAlbumImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch {
      alert("Failed to remove image.");
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

  const handleDeleteImage = async (id) => {
    if (!window.confirm("Delete this image permanently?")) return;
    try {
      await deleteImage(id);
      setActiveImage(null);
      setAlbumImages((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert("Failed to delete image.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="text-[#adc6ff] animate-spin" size={24} />
        <span className="ml-3 text-sm text-slate-400 font-bold uppercase tracking-widest">
          Loading albums…
        </span>
      </div>
    );
  }

  // ─── Album Detail View ───
  if (selectedAlbum) {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} />
            Back to Albums
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#adc6ff]/10 text-[#adc6ff] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#adc6ff]/20 transition-colors"
          >
            <Plus size={14} />
            Add Images
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#131b2e] border border-white/5">
          <p className="text-[10px] text-[#adc6ff] uppercase tracking-[0.2em] font-bold">
            Album
          </p>
          <h2 className="text-3xl font-black text-white">
            {selectedAlbum.title}
          </h2>
          {selectedAlbum.description && (
            <p className="text-sm text-slate-400 mt-1">
              {selectedAlbum.description}
            </p>
          )}
          <p className="text-[10px] text-slate-600 mt-2">
            {albumImages.length} images
          </p>
        </div>

        {loadingAlbum ? (
          <div className="text-center py-16">
            <Loader2 className="text-[#adc6ff] animate-spin mx-auto" size={24} />
          </div>
        ) : albumImages.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">📂</div>
            <h3 className="text-lg font-bold text-white">Empty Album</h3>
            <p className="text-sm text-slate-400">
              Click "Add Images" to fill this album.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {albumImages.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-2xl overflow-hidden border border-white/5 h-48 hover:border-[#adc6ff]/20 transition-all cursor-pointer"
                onClick={() => setActiveImage({ ...img, fullUrl: getFullUrl(img) })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(img)}
                  alt={img.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from album"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 p-3 w-full bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] text-white font-bold truncate">
                    {img.title || img.original_filename}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Images Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-[#131b2e] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">
                  Select Images to Add
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {allImages.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No available images to add.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {allImages.map((img) => {
                      const selected = selectedIds.includes(img.id);
                      return (
                        <button
                          key={img.id}
                          onClick={() =>
                            setSelectedIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== img.id)
                                : [...prev, img.id]
                            )
                          }
                          className={`relative rounded-xl overflow-hidden h-28 border-2 transition-all ${
                            selected
                              ? "border-[#4edea3] ring-2 ring-[#4edea3]/30"
                              : "border-transparent hover:border-white/20"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(img)}
                            alt={img.title}
                            className="w-full h-full object-cover"
                          />
                          {selected && (
                            <div className="absolute inset-0 bg-[#4edea3]/20 flex items-center justify-center">
                              <div className="w-6 h-6 bg-[#4edea3] rounded-full flex items-center justify-center">
                                <span className="text-black text-xs font-black">
                                  ✓
                                </span>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={handleAddImages}
                  disabled={selectedIds.length === 0}
                  className="px-6 py-2.5 bg-[#4edea3] text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#3bc48a] transition-colors disabled:opacity-30"
                >
                  Add to Album
                </button>
              </div>
            </div>
          </div>
        )}
        <ImagePreview
          activeImage={activeImage}
          onClose={() => setActiveImage(null)}
          onDelete={(id) => handleDeleteImage(id)}
        />
      </div>
    );
  }

  // ─── Albums List View ───
  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* Header */}
      <section className="p-6 rounded-2xl bg-[#131b2e] border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#adc6ff] uppercase">
              Collections
            </p>
            <h2 className="text-2xl font-black text-white">Your Albums</h2>
          </div>
        </div>

        {/* Create Album */}
        <div className="flex gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New album name..."
            className="flex-1 bg-[#060e20] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-[#adc6ff] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 bg-[#060e20] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-[#adc6ff] focus:outline-none hidden lg:block"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#adc6ff] to-[#357df1] text-[#002e6a] font-bold rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Create
          </button>
        </div>
      </section>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="text-5xl">📁</div>
          <h3 className="text-xl font-bold text-white">No albums yet</h3>
          <p className="text-sm text-slate-400">
            Create your first album to organize your images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group relative bg-[#131b2e] rounded-3xl border border-white/5 overflow-hidden hover:border-[#adc6ff]/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => openAlbum(album)}
            >
              {/* Cover */}
              <div className="h-40 bg-gradient-to-br from-[#1a2440] to-[#0d1625] flex items-center justify-center relative overflow-hidden">
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <FolderOpen
                    size={48}
                    className="text-[#222a3d] group-hover:text-[#2d3449] transition-colors"
                  />
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[9px] font-bold text-[#adc6ff]">
                  {album.image_count}{" "}
                  {album.image_count === 1 ? "image" : "images"}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate flex-1">
                    {album.title}
                  </h3>
                  <ChevronRight
                    size={16}
                    className="text-slate-600 group-hover:text-[#adc6ff] transition-colors shrink-0"
                  />
                </div>
                {album.description && (
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    {album.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(album.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(album.id);
                    }}
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
