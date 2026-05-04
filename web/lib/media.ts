const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("/api/backend/")) return url;

  if (backendBase.startsWith("/") && url.startsWith("/uploads/")) {
    return `${backendBase}${url}`;
  }

  try {
    const parsed = new URL(url);
    if (backendBase.startsWith("/") && parsed.pathname.startsWith("/uploads/")) {
      return `${backendBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep non-URL values unchanged so manually entered relative paths still work.
  }

  return url;
}
