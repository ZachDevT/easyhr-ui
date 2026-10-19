export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "https://easyhr-api-180870038176.us-central1.run.app"
    : "http://localhost:8080");

export const RESERVED_SUBDOMAINS = new Set([
  "api",
  "app",
  "admin",
  "auth",
  "billing",
  "dashboard",
  "docs",
  "mail",
  "support",
  "www",
  "staging",
  "dev",
  "test",
  "demo",
  "clerk",
]);

export function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null;
  const host = hostname.split(":")[0].toLowerCase().trim();

  // Production: *.easyhr.pro
  if (host.endsWith(".easyhr.pro")) {
    const parts = host.replace(".easyhr.pro", "").split(".");
    const sub = parts[parts.length - 1];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return sub;
    }
    return null;
  }

  // Local development: *.localhost
  if (host.endsWith(".localhost") || host.includes(".localhost")) {
    const parts = host.replace(".localhost", "").split(".");
    const sub = parts[parts.length - 1];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return sub;
    }
    return null;
  }

  return null;
}

export function getWorkspaceSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  // On registration, onboarding, and auth pages, do NOT infer the uncreated workspace
  const path = window.location.pathname;
  if (
    path.startsWith("/company/register") ||
    path.startsWith("/auth") ||
    path.startsWith("/careers") ||
    path === "/workspace-not-found"
  ) {
    return null;
  }

  // 1. Direct from current browser hostname
  const sub = extractSubdomain(window.location.hostname);
  if (sub) return sub;

  // 2. Cookie fallback
  try {
    const match = document.cookie.match(/(?:^|;\s*)easyhr_current_workspace=([^;]+)/);
    if (match && match[1]) {
      const clean = decodeURIComponent(match[1]).trim().toLowerCase();
      if (clean && !RESERVED_SUBDOMAINS.has(clean)) return clean;
    }
  } catch {}

  // 3. LocalStorage cached company fallback
  try {
    const cached = localStorage.getItem("easyhr_company_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.subdomain && !RESERVED_SUBDOMAINS.has(parsed.subdomain)) {
        return parsed.subdomain;
      }
    }
  } catch {}

  return null;
}

export function getWorkspaceUrl(subdomain: string, targetPath = "/dashboard"): string {
  const cleanPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("localhost") || host === "127.0.0.1") {
      const port = window.location.port ? `:${window.location.port}` : ":3000";
      return `http://${subdomain}.localhost${port}${cleanPath}`;
    }
  }
  return `https://${subdomain}.easyhr.pro${cleanPath}`;
}

export function getAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const workspace = getWorkspaceSubdomain();
  if (workspace) {
    headers["X-EasyHR-Workspace"] = workspace;
  }
  return headers;
}
