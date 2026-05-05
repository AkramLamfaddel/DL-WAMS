"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  Dna,
  Zap,
  ShieldCheck,
  Loader2,
  CloudUpload,
  ScanSearch,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import UploadZone from "@/components/dashboard/Analyze/UploadZone";
import { getImages, verifyImage, quickScanImage, uploadImage } from "@/lib/api";

const GALLERY_URL =
  process.env.NEXT_PUBLIC_GALLERY_URL ?? "http://localhost:8001";

export default function AnalyzePage() {
  const [latestResult, setLatestResult] = useState(null);
  const [recentImages, setRecentImages] = useState([]);
  const [verifying, setVerifying] = useState(null);

  // Quick Scan state
  const [scanFile, setScanFile] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scanInputRef = useRef(null);
  const [savingToGallery, setSavingToGallery] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);

  // Active mode: "upload" (save to gallery) or "quickscan" (direct AI, no save)
  const [mode, setMode] = useState("upload");

  useEffect(() => {
    loadRecentImages();
  }, []);

  const loadRecentImages = async () => {
    try {
      const data = await getImages();
      const sorted = [...data].sort(
        (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
      );
      setRecentImages(sorted.slice(0, 4));

      const lastVerified = sorted.find(
        (img) => img.verification_status !== "pending"
      );
      if (lastVerified) setLatestResult(lastVerified);
    } catch {
      // Gallery might be down — Quick Scan still works
      console.warn("Gallery unavailable — Quick Scan mode is still available.");
    }
  };

  const handleUploadComplete = (result) => {
    setRecentImages((prev) => [result, ...prev.slice(0, 3)]);
  };

  const handleVerifyFromCard = async (image) => {
    setVerifying(image.id);
    try {
      const updated = await verifyImage(image.id);
      setLatestResult(updated);
      setRecentImages((prev) =>
        prev.map((img) => (img.id === image.id ? updated : img))
      );
    } catch {
      alert("AI service unavailable. Please try again later.");
    }
    setVerifying(null);
  };

  // ─── Quick Scan ─────────────────────────────────────────────
  const handleScanFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanFile(file);
    setScanPreview(URL.createObjectURL(file));
    setScanResult(null);
  };

  const handleScanDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setScanFile(file);
    setScanPreview(URL.createObjectURL(file));
    setScanResult(null);
  };

  const handleQuickScan = async () => {
    if (!scanFile) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await quickScanImage(scanFile);
      setScanResult(result);
    } catch (err) {
      setScanResult({ error: err.message || "AI service unavailable." });
    }
    setScanning(false);
  };

  const resetScan = () => {
    setScanFile(null);
    setScanPreview(null);
    setScanResult(null);
    setSavedToGallery(false);
    if (scanInputRef.current) scanInputRef.current.value = "";
  };

  const handleSaveToGallery = async () => {
    if (!scanFile || savedToGallery) return;
    setSavingToGallery(true);
    try {
      const fd = new FormData();
      fd.append("image_file", scanFile);
      fd.append("title", scanFile.name.replace(/\.[^/.]+$/, ""));
      fd.append("description", `Quick Scan result: ${scanResult?.is_modified ? "Modified" : "Authentic"} (${Number(scanResult?.confidence || 0).toFixed(1)}% confidence)`);
      const saved = await uploadImage(fd);
      setSavedToGallery(true);
      // Also add to recent images list
      setRecentImages((prev) => [saved, ...prev.slice(0, 3)]);
    } catch (err) {
      alert("Could not save to Gallery — the Gallery service may be offline.");
    }
    setSavingToGallery(false);
  };

  const getImageUrl = (img) => {
    const url = img?.image_url || img?.thumbnail_url || "";
    return url.startsWith("http") ? url : `${GALLERY_URL}${url}`;
  };

  const status = latestResult?.verification_status;
  const isAuthentic = status === "unedited";
  const isFake = status === "edited";
  const confidence = latestResult?.ai_confidence_score;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Hero */}
      <section className="grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-7">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#adc6ff] font-bold mb-2 block">
            AI Image Analysis
          </span>

          <h2 className="text-5xl font-black font-headline text-white leading-tight">
            ANALYZE <br />
            <span className="bg-linear-to-r from-[#adc6ff] to-[#357df1] bg-clip-text text-transparent italic">
              YOUR IMAGE
            </span>
          </h2>
        </div>

        <div className="col-span-12 md:col-span-5 text-[#c6c6cd] font-body text-sm leading-relaxed pb-2 border-l border-[#222a3d] pl-6">
          <strong className="text-[#adc6ff]">Two modes:</strong> Upload & save
          to gallery (verify later), or{" "}
          <strong className="text-[#4edea3]">Quick Scan</strong> — instantly
          analyze any image with AI without saving it. Works even if the Gallery
          is offline.
        </div>
      </section>

      {/* ─── Mode Tabs ─── */}
      <section className="flex items-center gap-3">
        <div className="flex bg-[#060e20] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setMode("upload")}
            className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              mode === "upload"
                ? "bg-[#2d3449] text-[#adc6ff] shadow-lg"
                : "text-slate-500 hover:text-white"
            }`}
          >
            <Upload size={16} />
            Upload & Save
          </button>
          <button
            onClick={() => setMode("quickscan")}
            className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              mode === "quickscan"
                ? "bg-[#4edea3]/10 text-[#4edea3] shadow-lg"
                : "text-slate-500 hover:text-white"
            }`}
          >
            <ScanSearch size={16} />
            Quick Scan
          </button>
        </div>
        {mode === "quickscan" && (
          <span className="text-[9px] font-bold text-[#4edea3] bg-[#4edea3]/10 px-3 py-1 rounded-full uppercase tracking-widest">
            No Gallery needed
          </span>
        )}
      </section>

      {/* ─── Upload & Save Mode ─── */}
      {mode === "upload" && (
        <>
          <UploadZone onUploadComplete={handleUploadComplete} />

          {/* Latest Result Section */}
          {latestResult && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <BarChart3 size={16} />
                  Most Recent Analysis
                </h4>
                <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                  Image ID: #{latestResult.id}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Image Result */}
                <div className="col-span-12 lg:col-span-8 group relative overflow-hidden rounded-3xl shadow-2xl border border-white/5 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Analyzed Image"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    src={getImageUrl(latestResult)}
                  />
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[#adc6ff]/50 shadow-[0_0_15px_#adc6ff] animate-scan"></div>

                  <div className="absolute top-6 left-6 flex items-center gap-4">
                    <div
                      className={`bg-[#2d3449]/60 backdrop-blur-md px-4 py-2 flex items-center gap-3 rounded-xl border ${
                        isAuthentic ? "border-[#4edea3]/30" : isFake ? "border-[#eb4141]/30" : "border-[#fbbf24]/30"
                      }`}
                    >
                      <span className={`flex h-2.5 w-2.5 rounded-full ${
                        isAuthentic ? "bg-[#4edea3]" : isFake ? "bg-[#eb4141]" : "bg-[#fbbf24]"
                      }`}></span>
                      <span className={`font-black font-headline tracking-[0.2em] text-xs ${
                        isAuthentic ? "text-[#4edea3]" : isFake ? "text-[#eb4141]" : "text-[#fbbf24]"
                      }`}>
                        {isAuthentic ? "REAL" : isFake ? "FAKE" : "PENDING"}
                      </span>
                    </div>
                    {confidence != null && (
                      <div className="bg-[#2d3449]/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <span className="text-white text-[10px] font-bold uppercase">Confidence: </span>
                        <span className="text-[#adc6ff] font-black font-headline text-xs">
                          {Number(confidence).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-8 right-8 flex flex-col gap-2 items-end">
                    <div className="bg-[#2d3449]/80 backdrop-blur-md p-3 rounded-lg border-l-2 border-[#adc6ff]">
                      <p className="text-[9px] text-[#adc6ff] font-black uppercase mb-1">Image Info</p>
                      <p className="text-[10px] font-mono text-slate-300">
                        {latestResult.title || latestResult.original_filename}
                      </p>
                    </div>
                    <div className={`bg-[#2d3449]/80 backdrop-blur-md p-3 rounded-lg border-l-2 ${
                      isAuthentic ? "border-[#4edea3]" : isFake ? "border-[#eb4141]" : "border-[#fbbf24]"
                    }`}>
                      <p className={`text-[9px] font-black uppercase mb-1 ${
                        isAuthentic ? "text-[#4edea3]" : isFake ? "text-[#eb4141]" : "text-[#fbbf24]"
                      }`}>Analysis Result</p>
                      <p className="text-[10px] font-mono text-slate-300">
                        {isAuthentic ? "No strong manipulation detected" : isFake ? "Manipulation artifacts detected" : "Awaiting verification"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                  <StatBox icon={<Dna size={16} />} label="Model" value="Neural Deep Analysis" color="#adc6ff" />
                  <StatBox icon={<Zap size={16} />} label="Confidence" value={confidence != null ? `${Number(confidence).toFixed(1)}%` : "—"} color={isAuthentic ? "#4edea3" : isFake ? "#eb4141" : "#fbbf24"} />
                  <StatBox icon={<ShieldCheck size={16} />} label="Verdict" value={isAuthentic ? "Authentic" : isFake ? "Modified" : "Pending"} color={isAuthentic ? "#4edea3" : isFake ? "#eb4141" : "#fbbf24"} />
                </div>
              </div>
            </section>
          )}

          {/* Recent Uploads */}
          {recentImages.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                Recent Uploads
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {recentImages.map((image) => (
                  <ArchiveCard
                    key={image.id}
                    image={image}
                    imageUrl={getImageUrl(image)}
                    verifying={verifying === image.id}
                    onVerify={() => handleVerifyFromCard(image)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ─── Quick Scan Mode ─── */}
      {mode === "quickscan" && (
        <section className="space-y-8">
          <div className="p-8 rounded-3xl bg-[#131b2e] border border-[#4edea3]/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-[#4edea3]/10">
                <ScanSearch size={20} className="text-[#4edea3]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quick Scan</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Instant AI analysis • No upload • No gallery • Works independently
                </p>
              </div>
            </div>

            {/* Drop zone or preview */}
            {!scanPreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleScanDrop}
                onClick={() => scanInputRef.current?.click()}
                className="border-2 border-dashed border-[#4edea3]/20 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-[#4edea3]/50 hover:bg-[#4edea3]/5 transition-all duration-300 group"
              >
                <CloudUpload size={48} className="text-[#4edea3]/40 group-hover:text-[#4edea3] transition-colors mb-4" />
                <p className="text-sm font-bold text-white mb-1">Drop image here or click to select</p>
                <p className="text-[10px] text-slate-500">
                  Analyze without saving to gallery — AI only
                </p>
                <input
                  ref={scanInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScanFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Preview + Clear — with scan animation like Most Recent Analysis */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scanPreview}
                    alt="Scan preview"
                    className={`w-full max-h-96 object-contain bg-black/40 transition-transform duration-1000 ${
                      scanResult && !scanResult.error ? "group-hover:scale-105" : ""
                    }`}
                  />

                  {/* Scan line animation — active during scanning OR after result */}
                  {(scanning || (scanResult && !scanResult.error)) && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-[#adc6ff]/50 shadow-[0_0_15px_#adc6ff] animate-scan"></div>
                  )}

                  {/* Scanning overlay */}
                  {scanning && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#4edea3]/30">
                        <Loader2 size={20} className="text-[#4edea3] animate-spin" />
                        <span className="text-sm font-bold text-white uppercase tracking-widest">AI Analyzing…</span>
                      </div>
                    </div>
                  )}

                  {/* Result overlay badges — same style as Most Recent Analysis */}
                  {scanResult && !scanResult.error && (
                    <>
                      <div className="absolute top-6 left-6 flex items-center gap-4">
                        <div
                          className={`bg-[#2d3449]/60 backdrop-blur-md px-4 py-2 flex items-center gap-3 rounded-xl border ${
                            scanResult.is_modified ? "border-[#eb4141]/30" : "border-[#4edea3]/30"
                          }`}
                        >
                          <span className={`flex h-2.5 w-2.5 rounded-full ${
                            scanResult.is_modified ? "bg-[#eb4141]" : "bg-[#4edea3]"
                          }`}></span>
                          <span className={`font-black font-headline tracking-[0.2em] text-xs ${
                            scanResult.is_modified ? "text-[#eb4141]" : "text-[#4edea3]"
                          }`}>
                            {scanResult.is_modified ? "FAKE" : "REAL"}
                          </span>
                        </div>
                        <div className="bg-[#2d3449]/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                          <span className="text-white text-[10px] font-bold uppercase">Confidence: </span>
                          <span className="text-[#adc6ff] font-black font-headline text-xs">
                            {Number(scanResult.confidence || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6">
                        <div className={`bg-[#2d3449]/80 backdrop-blur-md p-3 rounded-lg border-l-2 ${
                          scanResult.is_modified ? "border-[#eb4141]" : "border-[#4edea3]"
                        }`}>
                          <p className={`text-[9px] font-black uppercase mb-1 ${
                            scanResult.is_modified ? "text-[#eb4141]" : "text-[#4edea3]"
                          }`}>Analysis Result</p>
                          <p className="text-[10px] font-mono text-slate-300">
                            {scanResult.is_modified ? "Manipulation artifacts detected" : "No manipulation detected"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Close button */}
                  <button
                    onClick={resetScan}
                    className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
                    <p className="text-[10px] text-white font-bold">{scanFile?.name}</p>
                    <p className="text-[8px] text-slate-400">
                      {(scanFile?.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                {/* Scan Button */}
                {!scanResult && (
                  <button
                    onClick={handleQuickScan}
                    disabled={scanning}
                    className="w-full py-4 bg-gradient-to-r from-[#4edea3] to-[#357df1] text-white font-black uppercase tracking-widest rounded-2xl text-sm hover:shadow-xl hover:shadow-[#4edea3]/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {scanning ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        AI is analyzing...
                      </>
                    ) : (
                      <>
                        <ScanSearch size={20} />
                        Scan with AI
                      </>
                    )}
                  </button>
                )}

                {/* Scan Result */}
                {scanResult && !scanResult.error && (
                  <div className="space-y-4">
                    <div className={`p-6 rounded-2xl border ${
                      scanResult.is_modified
                        ? "bg-[#eb4141]/5 border-[#eb4141]/20"
                        : "bg-[#4edea3]/5 border-[#4edea3]/20"
                    }`}>
                      <div className="flex items-center gap-4 mb-4">
                        {scanResult.is_modified ? (
                          <AlertTriangle size={32} className="text-[#eb4141]" />
                        ) : (
                          <CheckCircle2 size={32} className="text-[#4edea3]" />
                        )}
                        <div>
                          <h4 className={`text-2xl font-black ${
                            scanResult.is_modified ? "text-[#eb4141]" : "text-[#4edea3]"
                          }`}>
                            {scanResult.is_modified ? "FAKE DETECTED" : "AUTHENTIC"}
                          </h4>
                          <p className="text-xs text-slate-400">
                            AI Confidence: <strong className="text-white">{Number(scanResult.confidence || 0).toFixed(1)}%</strong>
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <ScanStat label="Model" value={scanResult.model || "Neural Analysis"} />
                        <ScanStat label="Confidence" value={`${Number(scanResult.confidence || 0).toFixed(1)}%`} />
                        <ScanStat label="Verdict" value={scanResult.is_modified ? "Modified" : "Authentic"} />
                        <ScanStat label="Processing" value={scanResult.processing_time || "—"} />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveToGallery}
                        disabled={savingToGallery || savedToGallery}
                        className={`flex-1 py-3 font-bold uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                          savedToGallery
                            ? "bg-[#4edea3]/10 text-[#4edea3] cursor-default"
                            : "bg-[#adc6ff]/10 text-[#adc6ff] hover:bg-[#adc6ff]/20"
                        } disabled:opacity-50`}
                      >
                        {savedToGallery ? (
                          <>
                            <CheckCircle2 size={14} />
                            Saved to Gallery
                          </>
                        ) : savingToGallery ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            Save to Gallery
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetScan}
                        className="flex-1 py-3 bg-[#222a3d] text-white font-bold uppercase tracking-widest rounded-xl text-xs hover:bg-[#2d3449] transition-colors"
                      >
                        Scan Another
                      </button>
                    </div>
                  </div>
                )}

                {/* Scan Error */}
                {scanResult?.error && (
                  <div className="p-6 rounded-2xl bg-[#eb4141]/5 border border-[#eb4141]/20 space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={24} className="text-[#eb4141]" />
                      <div>
                        <h4 className="text-sm font-bold text-[#eb4141]">AI Service Unavailable</h4>
                        <p className="text-[10px] text-slate-400">{scanResult.error}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setScanResult(null)}
                      className="w-full py-2 bg-[#222a3d] text-white font-bold uppercase tracking-widest rounded-xl text-[10px] hover:bg-[#2d3449] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Sub Components ─── */

function StatBox({ icon, label, value, color }) {
  return (
    <div className="bg-[#131b2e] border border-white/5 rounded-2xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-lg font-black font-headline" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ExifItem({ label, value }) {
  return (
    <div>
      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-[11px] text-white font-medium truncate">{value}</p>
    </div>
  );
}

function ScanStat({ label, value }) {
  return (
    <div className="bg-[#131b2e] p-3 rounded-xl">
      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs text-white font-bold">{value}</p>
    </div>
  );
}

function ArchiveCard({ image, imageUrl, verifying, onVerify }) {
  const status = image.verification_status;
  const isFake = status === "edited";
  const isReal = status === "unedited";
  const isPending = status === "pending";

  return (
    <div className="bg-[#131b2e] rounded-2xl overflow-hidden border border-white/5 hover:border-[#adc6ff]/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
      <div className="h-32 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={image.title || "Image"}
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
          src={imageUrl}
        />
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded tracking-widest ${
              isFake
                ? "bg-[#eb4141]/20 text-[#eb4141]"
                : isReal
                ? "bg-[#4edea3]/20 text-[#4edea3]"
                : "bg-[#fbbf24]/20 text-[#fbbf24]"
            }`}
          >
            {isReal ? "REAL" : isFake ? "FAKE" : "PENDING"}
          </span>
          <span className="text-[10px] text-slate-600 font-mono">
            #{image.id}
          </span>
        </div>

        <p className="text-xs font-bold text-white truncate">
          {image.title || image.original_filename}
        </p>
        <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">
          {image.uploaded_at
            ? new Date(image.uploaded_at).toLocaleDateString()
            : "Recently"}
        </p>

        {isPending && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerify();
            }}
            disabled={verifying}
            className="w-full mt-2 py-2 bg-[#adc6ff]/10 text-[#adc6ff] rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-[#adc6ff]/20 transition-all disabled:opacity-50"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={10} className="animate-spin" />
                Analyzing…
              </span>
            ) : (
              <>🤖 Verify with AI</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
