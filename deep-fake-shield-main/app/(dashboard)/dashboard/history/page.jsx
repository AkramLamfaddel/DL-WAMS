"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Tag,
  LayoutGrid,
  List,
  BadgeCheck,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Trash2,
  LogIn,
  UserPlus,
  Activity,
} from "lucide-react";
import { getImages, getStats, getAuditLogs, getAuditStats, getUser } from "@/lib/api";

const GALLERY_URL = process.env.NEXT_PUBLIC_GALLERY_URL ?? "http://localhost:8001";

export default function HistoryPage() {
  const [images, setImages] = useState([]);
  const [stats, setStats] = useState({ total: 0, unedited: 0, edited: 0, pending: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState({});
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [activeTab, setActiveTab] = useState("gallery"); // "gallery" or "audit"
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = getUser();
    const userId = user?.id;

    try {
      const results = await Promise.allSettled([
        getImages(),
        getStats(),
        getAuditLogs({ userId, limit: 100 }),
        getAuditStats(userId),
      ]);

      if (results[0].status === "fulfilled") {
        const sorted = [...results[0].value].sort(
          (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
        );
        setImages(sorted);
      }
      if (results[1].status === "fulfilled") setStats(results[1].value);
      if (results[2].status === "fulfilled") {
        setAuditLogs(results[2].value.logs || []);
        setAuditTotal(results[2].value.total || 0);
      }
      if (results[3].status === "fulfilled") setAuditStats(results[3].value);
    } catch {
      console.error("Failed to load history data");
    }
    setLoading(false);
  };

  const getImageUrl = (img) => {
    const url = img?.thumbnail_url || img?.image_url || "";
    return url.startsWith("http") ? url : `${GALLERY_URL}${url}`;
  };

  // Gallery filter
  const filteredImages = statusFilter
    ? images.filter((img) => img.verification_status === statusFilter)
    : images;

  // Audit filter
  const filteredLogs = actionFilter
    ? auditLogs.filter((log) => log.action === actionFilter)
    : auditLogs;

  // Pagination
  const currentItems = activeTab === "gallery" ? filteredImages : filteredLogs;
  const totalPages = Math.max(1, Math.ceil(currentItems.length / perPage));
  const paginated = currentItems.slice((page - 1) * perPage, page * perPage);

  // Featured = most recent verified image
  const featured = images.find(
    (img) =>
      img.verification_status === "unedited" ||
      img.verification_status === "edited"
  );

  const verifiedCount = images.filter(
    (img) => img.verification_status !== "pending"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <Loader2 className="text-[#adc6ff] animate-spin" size={24} />
          <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">
            Loading archive…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <section className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-[#131b2e] border border-white/5">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#adc6ff] uppercase">
              Archive Protocol
            </p>
            <h2 className="text-2xl font-headline font-extrabold text-white">
              Verified Assets & Audit Trail
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Toggle */}
            <div className="flex bg-[#060e20] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => { setActiveTab("gallery"); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === "gallery"
                    ? "bg-[#2d3449] text-[#adc6ff]"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                <LayoutGrid size={14} className="inline mr-1.5 -mt-0.5" />
                Gallery
              </button>
              <button
                onClick={() => { setActiveTab("audit"); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === "audit"
                    ? "bg-[#2d3449] text-[#adc6ff]"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                <List size={14} className="inline mr-1.5 -mt-0.5" />
                Audit Log
              </button>
            </div>

            {/* Filters */}
            {activeTab === "gallery" ? (
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-[#222a3d] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-[#c6c6cd] focus:outline-none focus:ring-1 focus:ring-[#adc6ff] appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="unedited">✅ Authentic</option>
                <option value="edited">⚠️ Modified</option>
                <option value="pending">⏳ Pending</option>
              </select>
            ) : (
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="bg-[#222a3d] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-[#c6c6cd] focus:outline-none focus:ring-1 focus:ring-[#adc6ff] appearance-none cursor-pointer"
              >
                <option value="">All Actions</option>
                <option value="image_uploaded">📤 Uploads</option>
                <option value="image_deleted">🗑️ Deletions</option>
                <option value="image_verified">🤖 Verifications</option>
                <option value="user_login">🔐 Logins</option>
              </select>
            )}
          </div>
        </div>
      </section>

      {/* GALLERY TAB */}
      {activeTab === "gallery" && (
        <>
          {filteredImages.length === 0 ? (
            <EmptyState message={statusFilter ? "No images match the selected filter." : "Upload and verify images to see them here."} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* FEATURED */}
              {featured && page === 1 && !statusFilter && (
                <div className="sm:col-span-2 sm:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-[#131b2e] border border-white/5 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Featured Asset"
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700"
                    src={getImageUrl(featured)}
                  />
                  <div className={`absolute top-6 left-6 px-4 py-1.5 text-[10px] font-black rounded-full flex items-center gap-2 ${
                    featured.verification_status === "unedited"
                      ? "bg-[#00a572]/90 text-[#00311f]"
                      : "bg-[#eb4141]/90 text-white"
                  }`}>
                    <BadgeCheck size={14} />
                    {featured.verification_status === "unedited" ? "AUTHENTIC" : "MODIFIED"}
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-linear-to-t from-[#0b1326] to-transparent">
                    <div className="bg-[#2d3449]/60 backdrop-blur-xl p-6 rounded-2xl">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-white font-bold text-xl">{featured.title || featured.original_filename}</h3>
                          <p className="text-slate-400 text-[10px] flex items-center gap-2">
                            <Clock size={12} />
                            {featured.uploaded_at ? new Date(featured.uploaded_at).toLocaleString() : "—"}
                          </p>
                        </div>
                        {featured.ai_confidence_score != null && (
                          <div className="text-right">
                            <p className="text-[9px] text-[#adc6ff] uppercase">Confidence</p>
                            <p className={`text-4xl font-black ${
                              featured.verification_status === "unedited" ? "text-[#4edea3]" : "text-[#eb4141]"
                            }`}>
                              {Number(featured.ai_confidence_score).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery Cards */}
              {paginated.map((item) => (
                <GalleryCard key={item.id} item={item} imageUrl={getImageUrl(item)} />
              ))}

              {/* STATS */}
              <div className="lg:col-span-2 p-10 rounded-[2.5rem] bg-[#131b2e] border border-white/5 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <ShieldCheck size={200} />
                </div>
                <div className="grid grid-cols-2 gap-10 relative z-10">
                  <div>
                    <p className="text-[10px] text-[#adc6ff] uppercase tracking-widest">Vault Integrity</p>
                    <p className="text-5xl font-black text-white">
                      {stats.total > 0 ? Math.round(((stats.unedited + stats.edited) / stats.total) * 100) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#adc6ff] uppercase tracking-widest">Verified Files</p>
                    <p className="text-5xl font-black text-white">{verifiedCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === "audit" && (
        <>
          {/* Audit Stats Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AuditStatCard label="Total Actions" value={auditStats.total || 0} icon={<Activity size={16} />} color="#adc6ff" />
            <AuditStatCard label="Uploads" value={auditStats.image_uploaded || 0} icon={<Upload size={16} />} color="#4edea3" />
            <AuditStatCard label="Verifications" value={auditStats.image_verified || 0} icon={<ShieldCheck size={16} />} color="#357df1" />
            <AuditStatCard label="Deletions" value={auditStats.image_deleted || 0} icon={<Trash2 size={16} />} color="#eb4141" />
          </section>

          {filteredLogs.length === 0 ? (
            <EmptyState message={
              auditLogs.length === 0
                ? "No audit logs yet. Actions will appear here as you use the platform."
                : "No logs match the selected filter."
            } />
          ) : (
            <div className="space-y-3">
              {paginated.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </>
      )}

      {/* FOOTER / PAGINATION */}
      {currentItems.length > perPage && (
        <footer className="mt-16 flex items-center justify-between py-8 border-t border-white/5">
          <p className="text-[10px] text-slate-600 uppercase">
            Displaying {(page - 1) * perPage + 1}–{Math.min(page * perPage, currentItems.length)} of {currentItems.length}{" "}
            {activeTab === "gallery" ? "assets" : "actions"}
          </p>
          <div className="flex items-center gap-2">
            <PaginationButton icon={<ChevronLeft size={16} />} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
            {[...Array(Math.min(totalPages, 7))].map((_, i) => (
              <PaginationButton key={i} label={i + 1} active={page === i + 1} onClick={() => setPage(i + 1)} />
            ))}
            <PaginationButton icon={<ChevronRight size={16} />} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
          </div>
        </footer>
      )}
    </div>
  );
}

/* ─── Sub Components ─── */

const ACTION_ICONS = {
  image_uploaded: { icon: <Upload size={16} />, color: "text-[#4edea3]", bg: "bg-[#4edea3]/10" },
  image_deleted: { icon: <Trash2 size={16} />, color: "text-[#eb4141]", bg: "bg-[#eb4141]/10" },
  image_verified: { icon: <ShieldCheck size={16} />, color: "text-[#357df1]", bg: "bg-[#357df1]/10" },
  user_login: { icon: <LogIn size={16} />, color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" },
  user_registered: { icon: <UserPlus size={16} />, color: "text-[#adc6ff]", bg: "bg-[#adc6ff]/10" },
  other: { icon: <Activity size={16} />, color: "text-slate-400", bg: "bg-slate-400/10" },
};

function AuditLogRow({ log }) {
  const config = ACTION_ICONS[log.action] || ACTION_ICONS.other;
  const details = log.details || {};

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#131b2e] border border-white/5 hover:border-white/10 transition-all duration-300 group">
      {/* Icon */}
      <div className={`p-3 rounded-xl ${config.bg} shrink-0`}>
        <span className={config.color}>{config.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-white">
            {log.action_display}
          </span>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-[#222a3d] text-slate-500 uppercase tracking-widest">
            {log.service}
          </span>
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          {details.title && (
            <span className="truncate max-w-48">📄 {details.title}</span>
          )}
          {details.image_id && (
            <span>ID: #{details.image_id}</span>
          )}
          {details.status && (
            <span className={`font-bold uppercase ${
              details.status === "unedited" ? "text-[#4edea3]" : "text-[#eb4141]"
            }`}>
              {details.status === "unedited" ? "REAL" : "FAKE"}
            </span>
          )}
          {details.confidence != null && (
            <span className="text-[#adc6ff]">
              {Number(details.confidence).toFixed(1)}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-right shrink-0">
        <p className="text-[10px] text-slate-500 font-mono">
          {new Date(log.timestamp).toLocaleDateString()}
        </p>
        <p className="text-[9px] text-slate-600 font-mono">
          {new Date(log.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function AuditStatCard({ label, value, icon, color }) {
  return (
    <div className="p-5 rounded-2xl bg-[#131b2e] border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3 mb-3">
        <span style={{ color }}>{icon}</span>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function GalleryCard({ item, imageUrl }) {
  const isFake = item.verification_status === "edited";
  const isReal = item.verification_status === "unedited";

  return (
    <div className="bg-[#131b2e] rounded-3xl overflow-hidden border border-white/5 relative h-64 group hover:border-[#adc6ff]/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={item.title || "Image"}
        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
        src={imageUrl}
      />
      <div className={`absolute top-3 left-3 px-2 py-1 text-[8px] font-black rounded-full uppercase ${
        isFake ? "bg-red-500/20 text-red-400" : isReal ? "bg-[#00a572]/20 text-[#4edea3]" : "bg-[#fbbf24]/20 text-[#fbbf24]"
      }`}>
        {isReal ? "REAL" : isFake ? "FAKE" : "PENDING"}
      </div>
      {item.ai_confidence_score != null && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-[#2d3449]/80 backdrop-blur-md text-[9px] font-bold text-[#adc6ff] rounded-lg">
          {Number(item.ai_confidence_score).toFixed(0)}%
        </div>
      )}
      <div className="absolute bottom-0 p-4 w-full bg-[#2d3449]/80">
        <p className="text-xs text-white font-bold truncate">{item.title || item.original_filename}</p>
        <p className="text-[9px] text-slate-400">{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : "—"}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-xl font-bold text-white">Nothing here yet</h3>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

function PaginationButton({ icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
        active ? "bg-[#adc6ff]/10 text-[#adc6ff]" : "text-slate-500 hover:text-white"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {icon || <span className="text-xs">{label}</span>}
    </button>
  );
}
