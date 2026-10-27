"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Download, Eye, FileText, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useDocumentActions } from "./DocumentViewer";

interface EmployeeDocument {
  id: string;
  filename: string;
  category?: string;
  status?: string;
  createdAt?: string;
  expiresOn?: string | null;
}

interface EmployeeDocumentListProps {
  employeeId?: string;
  handbookSignedAt?: string | null;
  title?: string;
  subtitle?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const prettyCategory = (value?: string) =>
  (value || "General").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Compact, readable & downloadable list of an employee's stored documents. */
export function EmployeeDocumentList({
  employeeId,
  handbookSignedAt,
  title = "Documents",
  subtitle = "Agreements, policies and files on record. Click a document to read it.",
}: EmployeeDocumentListProps) {
  const { getToken } = useAuth();
  const { view, download, viewer } = useDocumentActions();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/v1/documents?employeeId=${employeeId}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setDocuments(Array.isArray(json) ? json : json.data || []);
        }
      } catch {
        /* handled by empty state */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, getToken]);

  const isReady = (d: EmployeeDocument) => !d.status || !["pending_upload", "deleted"].includes(d.status);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0F2" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{title}</h3>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6E6E73" }}>{subtitle}</p>
      </div>

      {handbookSignedAt && (
        <div style={rowStyle}>
          <ShieldCheck size={16} color="#6E6E73" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>Employee Handbook acknowledgement</div>
            <div style={metaStyle}>Signed {formatDate(handbookSignedAt)}</div>
          </div>
          <span style={pillStyle}>Signed</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "28px 20px", fontSize: 12.5, color: "#86868B", textAlign: "center" }}>Loading documents…</div>
      ) : documents.length === 0 ? (
        !handbookSignedAt && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <FileText size={24} color="#AEAEB2" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1D1D1F" }}>No documents on file</div>
            <div style={{ fontSize: 12, color: "#86868B", marginTop: 3 }}>Uploaded agreements and files will appear here.</div>
          </div>
        )
      ) : (
        documents.map((doc) => {
          const ready = isReady(doc);
          return (
            <div
              key={doc.id}
              style={{ ...rowStyle, cursor: ready ? "pointer" : "default" }}
              onClick={() => ready && view(doc.id, doc.filename)}
              onMouseEnter={(e) => ready && (e.currentTarget.style.background = "#FAFAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <FileText size={16} color="var(--primary, #2563EB)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle}>{doc.filename || "Document"}</div>
                <div style={metaStyle}>
                  {prettyCategory(doc.category)} · {formatDate(doc.createdAt)}
                  {doc.expiresOn ? ` · Expires ${formatDate(doc.expiresOn)}` : ""}
                </div>
              </div>
              {ready ? (
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="btn-neutral btn-sm" style={btnStyle} onClick={() => view(doc.id, doc.filename)}>
                    <Eye size={13} /> View
                  </button>
                  <button type="button" className="btn-neutral btn-sm" style={btnStyle} onClick={() => download(doc.id, doc.filename)}>
                    <Download size={13} /> Download
                  </button>
                </div>
              ) : (
                <span style={pillStyle}>Processing</span>
              )}
            </div>
          );
        })
      )}
      {viewer}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 20px",
  borderBottom: "1px solid #F5F5F7",
  background: "#FFFFFF",
  transition: "background 0.15s",
};
const nameStyle: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const metaStyle: React.CSSProperties = { fontSize: 11.5, color: "#86868B", marginTop: 1 };
const pillStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#1D1D1F", background: "#F5F5F7", padding: "2px 8px", borderRadius: 999 };
const btnStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, padding: "4px 10px", borderRadius: 7 };
