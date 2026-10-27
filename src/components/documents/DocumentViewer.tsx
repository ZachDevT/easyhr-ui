"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export interface DocumentLinks {
  url: string;
  downloadUrl: string;
  filename: string;
}

/** Requests short-lived signed links (inline view + forced download) for a stored document. */
export async function fetchDocumentLinks(token: string, documentId: string): Promise<DocumentLinks> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/download-url`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.detail || "This document is not available right now.");
  }
  return { url: data.url, downloadUrl: data.downloadUrl || data.url, filename: data.filename || "" };
}

function extensionOf(name: string) {
  const clean = name.split("?")[0];
  const idx = clean.lastIndexOf(".");
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : "";
}

type PreviewKind = "pdf" | "image" | "office" | "text" | "unsupported";

function previewKind(name: string): PreviewKind {
  const ext = extensionOf(name);
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
  if (["txt", "csv", "md", "json"].includes(ext)) return "text";
  // Unknown extension: let the browser try to render it inline.
  return ext ? "unsupported" : "pdf";
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.rel = "noopener";
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Hook exposing view / download actions for any stored document.
 * Render `viewer` once in the page to enable in-app reading.
 */
export function useDocumentActions() {
  const { getToken } = useAuth();
  const [preview, setPreview] = useState<{ id: string; name: string } | null>(null);

  const download = useCallback(
    async (documentId: string, name?: string) => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in again.");
        const links = await fetchDocumentLinks(token, documentId);
        triggerDownload(links.downloadUrl, links.filename || name || "document");
      } catch (err) {
        toast.error("Download unavailable", err instanceof Error ? err.message : "Could not download document.");
      }
    },
    [getToken]
  );

  const view = useCallback((documentId: string, name?: string) => {
    setPreview({ id: documentId, name: name || "Document" });
  }, []);

  const viewer = (
    <DocumentViewerModal
      documentId={preview?.id || null}
      name={preview?.name || ""}
      onClose={() => setPreview(null)}
    />
  );

  return { view, download, viewer };
}

interface DocumentViewerModalProps {
  documentId: string | null;
  name: string;
  onClose: () => void;
}

/** Full-height, minimal reader for PDFs, images, office files and text. */
export function DocumentViewerModal({ documentId, name, onClose }: DocumentViewerModalProps) {
  const { getToken } = useAuth();
  const [links, setLinks] = useState<DocumentLinks | null>(null);
  const [error, setError] = useState("");
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setLinks(null);
    setError("");
    setTextContent(null);
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in again.");
        const result = await fetchDocumentLinks(token, documentId);
        if (cancelled) return;
        setLinks(result);
        if (previewKind(result.filename || name) === "text") {
          fetch(result.url)
            .then((r) => (r.ok ? r.text() : Promise.reject()))
            .then((t) => !cancelled && setTextContent(t))
            .catch(() => !cancelled && setTextContent(null));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open document.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, getToken, name]);

  useEffect(() => {
    if (!documentId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [documentId, onClose]);

  if (!documentId) return null;

  const displayName = links?.filename || name;
  const kind = previewKind(displayName);

  let body: React.ReactNode;
  if (error) {
    body = (
      <div style={centerStyle}>
        <FileText size={28} color="#86868B" />
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginTop: 10 }}>Unable to open document</div>
        <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 4 }}>{error}</div>
      </div>
    );
  } else if (!links) {
    body = (
      <div style={centerStyle}>
        <Loader2 size={22} className="animate-spin" color="#86868B" />
      </div>
    );
  } else if (kind === "image") {
    body = (
      <div style={{ ...centerStyle, background: "#F5F5F7", overflow: "auto" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={links.url} alt={displayName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      </div>
    );
  } else if (kind === "office") {
    body = (
      <iframe
        title={displayName}
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(links.url)}`}
        style={frameStyle}
      />
    );
  } else if (kind === "text" && textContent !== null) {
    body = (
      <pre style={{ margin: 0, padding: 24, height: "100%", overflow: "auto", fontSize: 12.5, lineHeight: 1.6, color: "#1D1D1F", whiteSpace: "pre-wrap", background: "#FFFFFF" }}>
        {textContent}
      </pre>
    );
  } else if (kind === "unsupported") {
    body = (
      <div style={centerStyle}>
        <FileText size={28} color="#86868B" />
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginTop: 10 }}>Preview not available for this file type</div>
        <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 4 }}>Download the file to open it on your device.</div>
      </div>
    );
  } else {
    body = <iframe title={displayName} src={links.url} style={frameStyle} />;
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(1040px, 100%)", height: "min(88vh, 1000px)", background: "#FFFFFF", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #E5E5EA" }}>
          <FileText size={16} color="#6E6E73" />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
          {links && (
            <>
              <a href={links.url} target="_blank" rel="noopener noreferrer" className="btn-neutral btn-sm" style={actionStyle}>
                <ExternalLink size={13} /> Open
              </a>
              <button type="button" className="btn-primary btn-sm" style={actionStyle} onClick={() => triggerDownload(links.downloadUrl, displayName)}>
                <Download size={13} /> Download
              </button>
            </>
          )}
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: "none", background: "#F5F5F7", borderRadius: 8, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1D1D1F" }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, background: "#F5F5F7" }}>{body}</div>
      </div>
    </div>
  );
}

const centerStyle: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 24,
};

const frameStyle: React.CSSProperties = { width: "100%", height: "100%", border: "none", background: "#FFFFFF" };

const actionStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  textDecoration: "none",
  padding: "5px 10px",
  borderRadius: 7,
};
