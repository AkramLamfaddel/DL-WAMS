/**
 * ═══════════════════════════════════════════════════════════════
 *  Verifai — Centralized API Layer
 *  Connects DIRECTLY to each Django microservice:
 *    • Auth Service       → localhost:8000
 *    • Gallery Service    → localhost:8001
 *    • AI Service         → localhost:8002
 *    • Historique Service → localhost:8003
 *
 *  Each service is called independently for true microservice
 *  fault tolerance — no single point of failure.
 * ═══════════════════════════════════════════════════════════════
 */

const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || "";
const GALLERY_URL =
  process.env.NEXT_PUBLIC_GALLERY_URL || "";
const AI_URL =
  process.env.NEXT_PUBLIC_AI_URL || "";
const HISTORIQUE_URL =
  process.env.NEXT_PUBLIC_HISTORIQUE_URL || "";

// ─── Token helpers ────────────────────────────────────────────
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function saveSession(userData, token) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function isAuthenticated() {
  return !!getToken();
}

// ─── Core fetch wrapper ───────────────────────────────────────
async function apiFetch(baseUrl, path, options = {}) {
  const { timeoutMs = 8000, signal: providedSignal, ...fetchOptions } = options;
  const url = `${baseUrl}${path}`;
  const headers = { "Accept": "application/json", ...fetchOptions.headers };

  // Attach JWT for all authenticated requests
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
    cache: "no-store",
    signal: providedSignal || AbortSignal.timeout(timeoutMs),
  });

  // Attempt to parse JSON, fall back to text
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const error = new Error(data?.error || data?.message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth API ─────────────────────────────────────────────────
export async function login(username, password) {
  return apiFetch(AUTH_URL, "/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function register(formData) {
  return apiFetch(AUTH_URL, "/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Gallery API — Images ─────────────────────────────────────
export async function getImages(status) {
  const params = status ? `?status=${status}` : "";
  return apiFetch(GALLERY_URL, `/gallery/api/images/${params}`);
}

export async function getImageDetail(id) {
  return apiFetch(GALLERY_URL, `/gallery/api/images/${id}/`);
}

export async function uploadImage(formData) {
  return apiFetch(GALLERY_URL, "/gallery/api/images/", {
    method: "POST",
    body: formData, // FormData — browser sets multipart boundary
    timeoutMs: 60000,
  });
}

export async function deleteImage(id) {
  return apiFetch(GALLERY_URL, `/gallery/api/images/${id}/`, {
    method: "DELETE",
  });
}

export async function verifyImage(id) {
  return apiFetch(GALLERY_URL, `/gallery/api/images/${id}/verify/`, {
    method: "POST",
    timeoutMs: 45000,
  });
}

// ─── Albums API ───────────────────────────────────────────────
export async function getAlbums() {
  return apiFetch(GALLERY_URL, "/gallery/api/albums/");
}

export async function createAlbum(title, description = "") {
  return apiFetch(GALLERY_URL, "/gallery/api/albums/", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
}

export async function getAlbumDetail(albumId) {
  return apiFetch(GALLERY_URL, `/gallery/api/albums/${albumId}/`);
}

export async function updateAlbum(albumId, data) {
  return apiFetch(GALLERY_URL, `/gallery/api/albums/${albumId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAlbum(albumId) {
  return apiFetch(GALLERY_URL, `/gallery/api/albums/${albumId}/`, {
    method: "DELETE",
  });
}

export async function addImagesToAlbum(albumId, imageIds) {
  return apiFetch(GALLERY_URL, `/gallery/api/albums/${albumId}/images/`, {
    method: "POST",
    body: JSON.stringify({ image_ids: imageIds }),
  });
}

export async function removeImagesFromAlbum(albumId, imageIds) {
  return apiFetch(GALLERY_URL, `/gallery/api/albums/${albumId}/images/`, {
    method: "DELETE",
    body: JSON.stringify({ image_ids: imageIds }),
  });
}

// ─── Tags API ─────────────────────────────────────────────────
export async function getTags() {
  return apiFetch(GALLERY_URL, "/gallery/api/tags/");
}

export async function createTag(name, color = "#adc6ff") {
  return apiFetch(GALLERY_URL, "/gallery/api/tags/", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

export async function deleteTag(tagId) {
  return apiFetch(GALLERY_URL, `/gallery/api/tags/${tagId}/`, {
    method: "DELETE",
  });
}

export async function addTagsToImage(imageId, tagIds) {
  return apiFetch(GALLERY_URL, `/gallery/api/images/${imageId}/tags/`, {
    method: "POST",
    body: JSON.stringify({ tag_ids: tagIds }),
  });
}

export async function removeTagsFromImage(imageId, tagIds) {
  return apiFetch(GALLERY_URL, `/gallery/api/images/${imageId}/tags/`, {
    method: "DELETE",
    body: JSON.stringify({ tag_ids: tagIds }),
  });
}

// ─── Favorites API ────────────────────────────────────────────
export async function toggleFavorite(imageId) {
  return apiFetch(GALLERY_URL, `/gallery/api/images/${imageId}/favorite/`, {
    method: "POST",
  });
}

export async function getFavorites() {
  return apiFetch(GALLERY_URL, "/gallery/api/favorites/");
}

// ─── Gallery API — Stats ─────────────────────────────────────
export async function getStats() {
  return apiFetch(GALLERY_URL, "/gallery/api/stats/");
}

/**
 * Warmup — fires a lightweight POST to the Gallery service that primes
 * the auth token cache after a service restart.  Fire-and-forget safe:
 * never throws, never returns an error the caller must handle.
 */
export async function warmupGallery() {
  try {
    return await apiFetch(GALLERY_URL, "/gallery/api/warmup/", {
      method: "POST",
      timeoutMs: 6000,
    });
  } catch {
    return null;
  }
}

// ─── AI Service — Direct Access (Independent of Gallery) ──────
/**
 * Quick Scan — Send an image DIRECTLY to the AI service for
 * instant analysis WITHOUT uploading to Gallery.
 * Works even if Gallery is down.
 */
export async function quickScanImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  return apiFetch(AI_URL, "/api/analyze/", {
    method: "POST",
    body: fd,
  });
}

/**
 * Get AI model status (loaded model, capabilities, etc.)
 */
export async function getAIStatus() {
  return apiFetch(AI_URL, "/api/status/");
}

// ─── Historique API — Audit Logs (Independent of Gallery) ─────
export async function getAuditLogs({ userId, action, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  if (action) params.set("action", action);
  params.set("limit", limit);
  params.set("offset", offset);
  const qs = params.toString();
  return apiFetch(HISTORIQUE_URL, `/api/history/logs/?${qs}`);
}

export async function getAuditStats(userId) {
  const qs = userId ? `?user_id=${userId}` : "";
  return apiFetch(HISTORIQUE_URL, `/api/history/stats/${qs}`);
}

// ═══════════════════════════════════════════════════════════════
//  Independent Health Checks — Each service checked DIRECTLY.
//  No single point of failure. If Gallery is down, you can still
//  see that Auth, AI, and Historique are healthy.
//
//  Single fast check per call — the dashboard polls every 15s,
//  so transient failures self-correct on the next poll cycle.
// ═══════════════════════════════════════════════════════════════

async function checkHealth(url, path) {
  try {
    const res = await fetch(`${url}${path}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkAllServicesHealth() {
  const [auth, gallery, ai, historique] = await Promise.all([
    checkHealth(AUTH_URL, "/api/auth/health/"),
    checkHealth(GALLERY_URL, "/gallery/api/health/"),
    checkHealth(AI_URL, "/api/health/"),
    checkHealth(HISTORIQUE_URL, "/api/history/health/"),
  ]);

  return { auth, gallery, ai, historique };
}
