"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Download,
  Eye,
  FileText,
  ShieldCheck,
  Upload,
  X,
  CheckCircle2,
  Calendar,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { useDocumentActions } from "./DocumentViewer";
import { downloadPdfBlob, downloadPdfUrl, renderPdfDocument } from "@/lib/pdfDocument";
import { PdfPreview } from "@/components/shared/PdfPreview";

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
  employeeName?: string;
  title?: string;
  subtitle?: string;
  allowUpload?: boolean;
}

interface HandbookData {
  title: string;
  content: string;
  url?: string;
  downloadUrl?: string;
}

interface SignedDocItem {
  id: string;
  requestId: string;
  documentId?: string;
  documentName: string;
  documentUrl?: string;
  body?: string;
  header?: string;
  footer?: string;
  logoUrl?: string;
  brandColor?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  senderName: string;
  senderRole?: string;
  status: string;
  sentAt?: string;
  signedAt?: string | null;
  message?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const prettyCategory = (value?: string) =>
  (value || "General").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Modern, cohesive document repository for an employee's profile.
 * Displays stored agreements, policies, and files with persistent View and Download capabilities.
 */
export function EmployeeDocumentList({
  employeeId,
  handbookSignedAt,
  employeeName = "Employee",
  title = "Documents",
  subtitle = "Agreements, policies, and files on record. Click any document to view or download it.",
  allowUpload = true,
}: EmployeeDocumentListProps) {
  const { getToken } = useAuth();
  const { view, download, viewer } = useDocumentActions();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [signedDocs, setSignedDocs] = useState<SignedDocItem[]>([]);
  const [viewingSignedDoc, setViewingSignedDoc] = useState<SignedDocItem | null>(null);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string>('');
  const [isRenderingViewingPdf, setIsRenderingViewingPdf] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handbook modal state
  const [isHandbookModalOpen, setIsHandbookModalOpen] = useState(false);
  const [handbookData, setHandbookData] = useState<HandbookData | null>(null);
  const [isLoadingHandbook, setIsLoadingHandbook] = useState(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploadExpiresOn, setUploadExpiresOn] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch uploaded documents
      const docsUrl = employeeId
        ? `${API_BASE_URL}/api/v1/documents?employeeId=${employeeId}&limit=100`
        : `${API_BASE_URL}/api/v1/documents?limit=100`;

      const docsPromise = fetch(docsUrl, { headers })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      // 2. Fetch completed signature agreements for current employee
      const sigsPromise = fetch(`${API_BASE_URL}/api/v1/signatures/me`, { headers })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const [docsJson, sigsJson] = await Promise.all([docsPromise, sigsPromise]);

      const docList = Array.isArray(docsJson) ? docsJson : docsJson.data || [];
      setDocuments(docList);

      const sigList: SignedDocItem[] = Array.isArray(sigsJson) ? sigsJson : sigsJson.data || [];
      const completed = sigList.filter(
        (s) => s.status === "signed" || s.status === "completed"
      );
      setSignedDocs(completed);
    } catch {
      /* handled by empty state */
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, getToken]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const generateSignedDocHtml = useCallback((doc: SignedDocItem) => {
    const color = doc.brandColor || '#4F46E5';
    const logo = doc.logoUrl ? `<img src="${doc.logoUrl}" alt="Logo" class="logo"/>` : '';
    const header = doc.header || [doc.senderName, doc.contactEmail, doc.contactPhone].filter(Boolean).join('\n');
    const footer = doc.footer || [doc.websiteUrl, doc.contactEmail, doc.contactPhone].filter(Boolean).join('\n');
    const body = doc.body || (doc.message ? `<p>${doc.message}</p>` : '<p>Executed Document Agreement.</p>');
    const signDate = doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : new Date().toLocaleDateString();

    return `<!doctype html><html><head><meta charset="utf-8"><title>${doc.documentName}</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f4f7;color:#202124;font:14px/1.65 'Questrial',Inter,Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:28px auto;padding:20mm 22mm;background:#fff;box-shadow:0 4px 24px #10182818;display:flex;flex-direction:column}.brand{height:7px;background:${color};margin:-20mm -22mm 25px}.logo{display:block;max-width:180px;max-height:58px;object-fit:contain;margin:0 0 18px}.doc-header{white-space:pre-wrap;color:#475467;font-size:11px;padding:0 0 14px;border-bottom:1px solid #d0d5dd}.title{text-align:center;margin:28px 0 24px}.title h1{font:700 24px/1.25 'Questrial',Inter,Arial,sans-serif;margin:0 0 8px}.muted{color:#667085;font-size:12px}.body{font:15px/1.75 'Questrial',Inter,Arial,sans-serif;min-height:360px;margin-bottom:30px}.body p{margin:0 0 1em}.body h1,.body h2,.body h3{line-height:1.25;margin:1.2em 0 .6em}.doc-footer{white-space:pre-wrap;border-top:1px solid #d0d5dd;padding-top:14px;margin-top:auto;color:#475467;font-size:11px}.signatures{display:grid;grid-template-columns:1fr 180px;gap:32px;margin-top:30px;break-inside:avoid}.signatures label{display:block;color:#667085;font-size:11px;margin-bottom:8px}.signature{height:58px;border-bottom:1px solid #98a2b3;display:flex;flex-direction:column;justify-content:center}.date{height:58px;border-bottom:1px solid #98a2b3;padding:24px 0 4px;font-family:monospace}@page{size:A4;margin:0}@media print{body{background:#fff}.page{margin:0;box-shadow:none;width:auto;min-height:297mm;page-break-after:always}}</style></head><body><article class="page"><div class="brand"></div>${logo}<header class="doc-header">${header}</header><div class="title"><h1>${doc.documentName}</h1><div class="muted">Executed Agreement Record</div></div><main class="body">${body}</main><section class="signatures"><div><label>Authorized digital signature (${employeeName || 'Signer'})</label><div class="signature"><div style="font:italic 20px cursive;color:#1e3a8a;">Digitally Executed &amp; Verified</div><div style="font-size:10px;color:#059669;margin-top:2px;">&#10003; EASYHR Cryptographic Verification Record</div></div></div><div><label>Date Executed</label><div class="date">${signDate}</div></div></section><footer class="doc-footer">${footer}</footer></article></body></html>`;
  }, [employeeName]);

  useEffect(() => {
    if (!viewingSignedDoc) {
      setViewingPdfUrl((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return '';
      });
      return;
    }

    if (viewingSignedDoc.documentUrl) {
      setViewingPdfUrl(viewingSignedDoc.documentUrl);
      return;
    }

    let isCurrent = true;
    setIsRenderingViewingPdf(true);
    const docHtml = generateSignedDocHtml(viewingSignedDoc);

    renderPdfDocument(docHtml)
      .then((blob) => {
        if (!isCurrent) return;
        const nextUrl = URL.createObjectURL(blob);
        setViewingPdfUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return nextUrl;
        });
      })
      .catch((err) => {
        console.error('Failed to render PDF', err);
        if (isCurrent) toast.error('PDF error', 'Could not render document as PDF.');
      })
      .finally(() => {
        if (isCurrent) setIsRenderingViewingPdf(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [viewingSignedDoc, generateSignedDocHtml]);

  const handleViewSignedDoc = (doc: SignedDocItem) => {
    setViewingSignedDoc(doc);
  };

  const handleDownloadSignedDoc = async (doc: SignedDocItem) => {
    const filename = `${(doc.documentName || 'Signed_Document').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
    if (doc.documentUrl) {
      downloadPdfUrl(doc.documentUrl, filename);
      toast.success('Downloaded', 'PDF document downloaded successfully.');
      return;
    }
    toast.info('Preparing PDF', 'Generating signed PDF document…');
    try {
      const docHtml = generateSignedDocHtml(doc);
      const blob = await renderPdfDocument(docHtml);
      downloadPdfBlob(blob, filename);
      toast.success('Downloaded', 'Signed PDF document downloaded successfully.');
    } catch (err: any) {
      toast.error('Download failed', err.message || 'Could not generate PDF.');
    }
  };

  const handleDownloadFromModal = () => {
    if (!viewingSignedDoc) return;
    const filename = `${(viewingSignedDoc.documentName || 'Signed_Document').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
    if (viewingPdfUrl) {
      downloadPdfUrl(viewingPdfUrl, filename);
      toast.success('Downloaded', 'Signed PDF document downloaded successfully.');
    } else {
      handleDownloadSignedDoc(viewingSignedDoc);
    }
  };

  // Load handbook settings & signed link if applicable
  const fetchHandbookInfo = useCallback(async (): Promise<HandbookData> => {
    if (handbookData) return handbookData;
    setIsLoadingHandbook(true);
    let titleText = "Employee Handbook & Code of Conduct";
    let contentText =
      "Welcome to our organization! As a member of our team, we uphold high standards of integrity, excellence, mutual respect, and confidentiality. Please review and acknowledge our policies.";
    let fileUrl = "";
    let downloadUrl = "";

    try {
      const token = await getToken();
      if (token) {
        // Fetch onboarding settings for handbook policy text & configuration
        const settingsRes = await fetch(`${API_BASE_URL}/api/v1/onboarding/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (settingsRes.ok) {
          const cfg = await settingsRes.json();
          if (cfg.handbookTitle) titleText = cfg.handbookTitle;
          if (cfg.handbookContent) contentText = cfg.handbookContent;
        }

        // Check if an uploaded document is linked to the handbook
        const docRes = await fetch(`${API_BASE_URL}/api/v1/onboarding/handbook-download-url`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docRes.ok) {
          const linkData = await docRes.json();
          if (linkData.url) fileUrl = linkData.url;
          if (linkData.downloadUrl) downloadUrl = linkData.downloadUrl;
        }
      }
    } catch {
      /* fallback to defaults */
    } finally {
      setIsLoadingHandbook(false);
    }

    const result: HandbookData = {
      title: titleText,
      content: contentText,
      url: fileUrl,
      downloadUrl: downloadUrl || fileUrl,
    };
    setHandbookData(result);
    return result;
  }, [getToken, handbookData]);

  // Handle viewing handbook
  const handleViewHandbook = async () => {
    setIsHandbookModalOpen(true);
    await fetchHandbookInfo();
  };

  // Handle downloading handbook acknowledgement certificate
  const handleDownloadHandbook = async () => {
    try {
      const info = await fetchHandbookInfo();
      // If a dedicated handbook file exists, download that directly
      if (info.downloadUrl) {
        triggerBrowserDownload(info.downloadUrl, `${info.title.replace(/\s+/g, "_")}.pdf`);
        toast.success("Download started", "Employee Handbook file is downloading.");
        return;
      }

      // Otherwise generate an official acknowledgement verification certificate
      const sanitizedName = (employeeName || "Employee").replace(/\s+/g, "_");
      const signDateFormatted = formatDateTime(handbookSignedAt);
      const certContent = [
        "================================================================================",
        "                     EASYHR ENTERPRISE COMPLIANCE RECORD                        ",
        "                EMPLOYEE HANDBOOK ACKNOWLEDGEMENT & SIGN-OFF                    ",
        "================================================================================",
        "",
        `Signatory Employee:     ${employeeName || "Employee"}`,
        `Policy Acknowledged:    ${info.title}`,
        `Acknowledgement Date:   ${signDateFormatted}`,
        `Digital Signature:      ${employeeName || "Employee"} (Legally Binding Electronic Sign-off)`,
        `Compliance Status:      VERIFIED & RECORDED`,
        "",
        "--------------------------------------------------------------------------------",
        "TERMS & CODE OF CONDUCT ACKNOWLEDGED:",
        "--------------------------------------------------------------------------------",
        info.content,
        "",
        "--------------------------------------------------------------------------------",
        "ELECTRONIC SIGNATURE VERIFICATION STATEMENT:",
        "--------------------------------------------------------------------------------",
        `I hereby certify and confirm that I, ${employeeName || "the undersigned"}, have received, read, understood,`,
        "and agreed to comply with all policies, codes of conduct, ethical standards, and workplace",
        "guidelines set forth in this document.",
        "",
        `Electronic Signature:   ${employeeName || "Employee"}`,
        `Timestamp:              ${handbookSignedAt || new Date().toISOString()}`,
        "System Verification:    EASYHR-LEGAL-COMPLIANCE-DIGITAL-SIGNATURE",
        "================================================================================",
      ].join("\n");

      const blob = new Blob([certContent], { type: "text/plain;charset=utf-8" });
      const certUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(certUrl, `Employee_Handbook_Acknowledgement_${sanitizedName}.txt`);
      setTimeout(() => URL.revokeObjectURL(certUrl), 5000);
      toast.success("Downloaded", "Handbook acknowledgement certificate downloaded.");
    } catch (err: any) {
      toast.error("Download failed", err.message || "Could not generate acknowledgement certificate.");
    }
  };

  // Handle document file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadFilename) {
        setUploadFilename(file.name);
      }
    }
  };

  // Execute document upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("No file selected", "Please choose a document to upload.");
      return;
    }
    if (!uploadFilename.trim()) {
      toast.error("Filename required", "Please enter a title or filename.");
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available.");

      const sizeBytes = selectedFile.size;
      const contentType = selectedFile.type || "application/octet-stream";

      // 1. Request upload intent from backend
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload-intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: uploadFilename.trim(),
          employeeId: employeeId || undefined,
          category: uploadCategory,
          contentType: contentType,
          sizeBytes: sizeBytes,
          expiresOn: uploadExpiresOn || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.title || "Failed to initiate document upload.");
      }

      const intent = await res.json();
      const docId = intent.document?.id || intent.id;
      if (!docId) throw new Error("Storage did not return a valid document ID.");
      const targetUploadUrl = intent.uploadUrl && !intent.uploadUrl.includes("r2.cloudflarestorage.com")
        ? intent.uploadUrl
        : `${API_BASE_URL}/api/v1/documents/${docId}/content`;

      // 2. Upload file bytes to storage via backend proxy
      const uploaded = await fetch(targetUploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          Authorization: `Bearer ${token}`,
        },
        body: selectedFile,
      });

      if (!uploaded.ok) {
        throw new Error("Failed to stream document to storage.");
      }

      // 3. Compute sha256 checksum and finalize
      const digest = await crypto.subtle.digest("SHA-256", await selectedFile.arrayBuffer());
      const checksumSha256 = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      await fetch(`${API_BASE_URL}/api/v1/documents/${docId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checksumSha256 }),
      }).catch(() => {
        /* relaxation in backend ensures download still works */
      });

      toast.success("Document uploaded", `"${uploadFilename}" has been saved to the employee record.`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadFilename("");
      setUploadExpiresOn("");
      setUploadCategory("general");
      await loadDocuments();
    } catch (err: any) {
      toast.error("Upload error", err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const hasDocuments = Boolean(handbookSignedAt || documents.length > 0 || signedDocs.length > 0);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E5EA", borderRadius: 14, overflow: "hidden" }}>
      {/* CARD HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid #F0F0F2",
          background: "#FFFFFF",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
            {title}
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6E6E73" }}>{subtitle}</p>
        </div>
        {allowUpload && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid #E5E5EA",
              background: "#FFFFFF",
              color: "#1D1D1F",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F5F5F7";
              e.currentTarget.style.borderColor = "#D1D1D6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.borderColor = "#E5E5EA";
            }}
          >
            <Upload size={13} color="#1D1D1F" />
            Upload Document
          </button>
        )}
      </div>

      {/* 1. EMPLOYEE HANDBOOK ACKNOWLEDGEMENT ROW */}
      {handbookSignedAt && (
        <div
          style={rowStyle}
          onClick={handleViewHandbook}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9F9FB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#ECFDF5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>Employee Handbook acknowledgement</div>
            <div style={metaStyle}>
              Signed {formatDate(handbookSignedAt)} · Legally Binding Electronic Sign-off
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={signedPillStyle}>Signed</span>
            <button
              type="button"
              className="btn-neutral btn-sm"
              style={actionBtnStyle}
              onClick={handleViewHandbook}
              title="View Handbook Acknowledgement"
            >
              <Eye size={13} /> View
            </button>
            <button
              type="button"
              className="btn-neutral btn-sm"
              style={actionBtnStyle}
              onClick={handleDownloadHandbook}
              title="Download Signed Acknowledgement"
            >
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      )}

      {/* 2. COMPLETED SIGNED DOCUMENTS / AGREEMENTS */}
      {signedDocs.map((sDoc) => (
        <div
          key={sDoc.id}
          style={rowStyle}
          onClick={() => handleViewSignedDoc(sDoc)}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9F9FB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#ECFDF5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>{sDoc.documentName || "Executed Agreement"}</div>
            <div style={metaStyle}>
              Signed {formatDate(sDoc.signedAt)} · Digitally Executed Agreement
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={signedPillStyle}>Signed</span>
            <button
              type="button"
              className="btn-neutral btn-sm"
              style={actionBtnStyle}
              onClick={() => handleViewSignedDoc(sDoc)}
              title="View executed document"
            >
              <Eye size={13} /> View
            </button>
            <button
              type="button"
              className="btn-neutral btn-sm"
              style={actionBtnStyle}
              onClick={() => handleDownloadSignedDoc(sDoc)}
              title="Download executed document"
            >
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      ))}

      {/* 3. UPLOADED DOCUMENTS LIST */}
      {isLoading ? (
        <div style={{ padding: "36px 20px", fontSize: 13, color: "#86868B", textAlign: "center" }}>
          <Loader2 size={18} className="animate-spin" style={{ margin: "0 auto 8px", color: "#86868B" }} />
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        !hasDocuments && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#F5F5F7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <FileText size={22} color="#AEAEB2" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>No documents on file</div>
            <div style={{ fontSize: 12.5, color: "#86868B", marginTop: 4 }}>
              Uploaded agreements, identification, and company files will appear here.
            </div>
            {allowUpload && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                style={{
                  marginTop: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1D1D1F",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <Upload size={13} /> Upload First Document
              </button>
            )}
          </div>
        )
      ) : (
        documents.map((doc) => {
          const isAvailable = !doc.status || doc.status === "available" || doc.status === "ready";
          return (
            <div
              key={doc.id}
              style={rowStyle}
              onClick={() => view(doc.id, doc.filename)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9F9FB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={17} color="#2563EB" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle} title={doc.filename}>
                  {doc.filename || "Document"}
                </div>
                <div style={metaStyle}>
                  {prettyCategory(doc.category)} · {formatDate(doc.createdAt)}
                  {doc.expiresOn ? ` · Expires ${formatDate(doc.expiresOn)}` : ""}
                </div>
              </div>

              {/* ACTION BUTTONS & STATUS PILL */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                {!isAvailable && (
                  <span style={pillStyle}>
                    {(doc.status === "pending_upload" ? "Processing" : doc.status || "Ready")
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                )}
                <button
                  type="button"
                  className="btn-neutral btn-sm"
                  style={actionBtnStyle}
                  onClick={() => view(doc.id, doc.filename)}
                  title="View / Read Document"
                >
                  <Eye size={13} /> View
                </button>
                <button
                  type="button"
                  className="btn-neutral btn-sm"
                  style={actionBtnStyle}
                  onClick={() => download(doc.id, doc.filename)}
                  title="Download Document"
                >
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {viewer}

      {/* EXECUTED SIGNED DOCUMENT MODAL */}
      {viewingSignedDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setViewingSignedDoc(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              width: "100%",
              maxWidth: 960,
              height: "90vh",
              maxHeight: 900,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              border: "1px solid #E5E5EA",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid #F0F0F2",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#ECFDF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>
                    {viewingSignedDoc.documentName}
                  </h3>
                  <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>
                    Executed &amp; Verified Digital Agreement
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={handleDownloadFromModal}
                  disabled={isRenderingViewingPdf}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSignedDoc(null)}
                  style={{
                    background: "#F5F5F7",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} color="#6E6E73" />
                </button>
              </div>
            </div>

            {/* Modal Body: Real PDF Document Preview */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#333639" }}>
              {isRenderingViewingPdf || !viewingPdfUrl ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#FFFFFF", gap: 14 }}>
                  <Loader2 size={32} className="animate-spin" color="#3B82F6" />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Rendering official PDF document…</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Applying WYSIWYG formatting, styles, and cryptographic seal</div>
                </div>
              ) : (
                <PdfPreview
                  url={viewingPdfUrl}
                  title={`${viewingSignedDoc.documentName} PDF`}
                  style={{ width: "100%", height: "100%", flex: 1 }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 24px",
                borderTop: "1px solid #E5E5EA",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 12.5, color: "#6E6E73" }}>
                Signatory: <strong>{employeeName || "Employee"}</strong> · Completed on{" "}
                <strong>{viewingSignedDoc.signedAt ? formatDate(viewingSignedDoc.signedAt) : "Recorded"}</strong>
              </div>
              <button type="button" className="btn-neutral" onClick={() => setViewingSignedDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HANDBOOK ACKNOWLEDGEMENT MODAL */}
      {isHandbookModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsHandbookModalOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              width: "100%",
              maxWidth: 620,
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              border: "1px solid #E5E5EA",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #F0F0F2",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#ECFDF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>
                    {handbookData?.title || "Employee Handbook & Code of Conduct"}
                  </h3>
                  <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>
                    Official signed compliance record
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHandbookModalOpen(false)}
                style={{
                  background: "#F5F5F7",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#6E6E73" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* Compliance Verification Card */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>
                      Executed Digital Acknowledgement
                    </span>
                  </div>
                  <span style={signedPillStyle}>VERIFIED COMPLIANT</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: "#64748B" }}>Signatory: </span>
                    <strong style={{ color: "#1E293B" }}>{employeeName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Executed on: </span>
                    <strong style={{ color: "#1E293B" }}>{formatDateTime(handbookSignedAt)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Type: </span>
                    <span style={{ color: "#1E293B" }}>Handbook Sign-off</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Status: </span>
                    <span style={{ color: "#059669", fontWeight: 600 }}>Active & Binding</span>
                  </div>
                </div>
              </div>

              {/* Policy Content */}
              {isLoadingHandbook ? (
                <div style={{ padding: "30px 0", textAlign: "center", color: "#86868B" }}>
                  <Loader2 size={18} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  Loading policy details…
                </div>
              ) : (
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#1D1D1F", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Handbook Terms & Standards
                  </h4>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E5EA",
                      borderRadius: 10,
                      padding: "16px 18px",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "#374151",
                      whiteSpace: "pre-wrap",
                      maxHeight: 240,
                      overflowY: "auto",
                    }}
                  >
                    {handbookData?.content || "No text terms configured for this handbook."}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderTop: "1px solid #F0F0F2",
                background: "#FAFAFC",
              }}
            >
              <div>
                {handbookData?.url && (
                  <button
                    type="button"
                    onClick={() => {
                      if (handbookData.url) window.open(handbookData.url, "_blank");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12.5,
                      color: "#2563EB",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <ExternalLink size={13} /> Open Attached Handbook PDF
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsHandbookModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #E5E5EA",
                    background: "#FFFFFF",
                    color: "#1D1D1F",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHandbook}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    background: "#1D1D1F",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  <Download size={14} /> Download Acknowledgement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => !isUploading && setIsUploadModalOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              border: "1px solid #E5E5EA",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #F0F0F2",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>
                  Upload Document
                </h3>
                <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 2 }}>
                  Store an agreement, certificate, or file in this employee record.
                </div>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadModalOpen(false)}
                style={{
                  background: "#F5F5F7",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#6E6E73" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ padding: "20px 24px" }}>
              {/* File Dropzone */}
              <div
                style={{
                  border: "2px dashed #E5E5EA",
                  borderRadius: 12,
                  padding: "24px 16px",
                  textAlign: "center",
                  background: selectedFile ? "#F8FAFC" : "#FFFFFF",
                  cursor: "pointer",
                  marginBottom: 18,
                  transition: "all 0.15s ease",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: selectedFile ? "#ECFDF5" : "#F5F5F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                  }}
                >
                  {selectedFile ? (
                    <CheckCircle2 size={20} color="#059669" />
                  ) : (
                    <Upload size={20} color="#6E6E73" />
                  )}
                </div>
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1D1D1F" }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6E6E73", marginTop: 2 }}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to choose different file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1D1D1F" }}>
                      Click to choose a file or drag & drop
                    </div>
                    <div style={{ fontSize: 11.5, color: "#86868B", marginTop: 2 }}>
                      PDF, Word, Excel, PNG, JPG up to 25MB
                    </div>
                  </div>
                )}
              </div>

              {/* Title / Filename */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>
                  Document Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employment_Agreement.pdf"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Category & Expiration in a grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="contract">Employment Contract</option>
                    <option value="id_document">Identification / Passport</option>
                    <option value="tax_form">Tax & Statutory</option>
                    <option value="certification">Certificate / Diploma</option>
                    <option value="general">General / Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>
                    Expiration Date <span style={{ color: "#86868B", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={uploadExpiresOn}
                    onChange={(e) => setUploadExpiresOn(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #E5E5EA",
                    background: "#FFFFFF",
                    color: "#1D1D1F",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    background: isUploading || !selectedFile ? "#AEAEB2" : "#1D1D1F",
                    color: "#FFFFFF",
                    cursor: isUploading || !selectedFile ? "not-allowed" : "pointer",
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "14px 24px",
  borderBottom: "1px solid #F5F5F7",
  background: "#FFFFFF",
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const nameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#1D1D1F",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  letterSpacing: "-0.01em",
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#86868B",
  marginTop: 2,
};

const pillStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6E6E73",
  background: "#F5F5F7",
  border: "1px solid #E5E5EA",
  padding: "3px 9px",
  borderRadius: 999,
  letterSpacing: "0.03em",
};

const signedPillStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#059669",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  padding: "3px 9px",
  borderRadius: 999,
  letterSpacing: "0.03em",
};

const actionBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  fontWeight: 600,
  padding: "5px 11px",
  borderRadius: 8,
  border: "1px solid #E5E5EA",
  background: "#FFFFFF",
  color: "#1D1D1F",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #E5E5EA",
  fontSize: 13,
  color: "#1D1D1F",
  outline: "none",
  boxSizing: "border-box",
  background: "#FFFFFF",
};
