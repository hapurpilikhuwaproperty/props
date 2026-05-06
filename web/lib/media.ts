const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const uploadProxyBase = "/api/backend";

const getBackendHostname = () => {
  try {
    return new URL(backendBase).hostname;
  } catch {
    return "";
  }
};

const proxiedUploadPath = (pathname: string, search = "") => `${uploadProxyBase}${pathname}${search}`;

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("/api/backend/")) return url;

  if (backendBase.startsWith("/") && url.startsWith("/uploads/")) {
    return `${backendBase}${url}`;
  }
  if (url.startsWith("/uploads/")) {
    return proxiedUploadPath(url);
  }

  try {
    const parsed = new URL(url);
    const backendHostname = getBackendHostname();
    const isApiUpload =
      parsed.pathname.startsWith("/uploads/") &&
      (parsed.hostname === "api.hapurpilikhuwaproperty.in" || parsed.hostname === backendHostname);

    if (isApiUpload) {
      return proxiedUploadPath(parsed.pathname, parsed.search);
    }

    if (backendBase.startsWith("/") && parsed.pathname.startsWith("/uploads/")) {
      return `${backendBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep non-URL values unchanged so manually entered relative paths still work.
  }

  return url;
}
