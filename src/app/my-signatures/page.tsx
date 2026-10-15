"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileSignature,
  Shield,
  Download,
  Printer,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { downloadPdfUrl, openPdfUrl, renderPdfDocument } from '@/lib/pdfDocument';
import { PdfPreview } from '@/components/shared/PdfPreview';

interface MySignatureDoc {
  id: string;
  requestId: string;
  documentId: string;
  documentName: string;
  documentUrl?: string;
  body?: string;
  header?: string;
  footer?: string;
  logoUrl?: string;
  brandColor?: string;
  websiteUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  senderName: string;
  senderRole: string;
  status: 'pending' | 'signed' | 'declined';
  sentAt: string;
  signedAt?: string | null;
  message?: string;
}

export default function MySignaturesPage() {
  const { getToken, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('Action Required');

  const [docs, setDocs] = useState<MySignatureDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signingDoc, setSigningDoc] = useState<MySignatureDoc | null>(null);
  const [isSubmittingSign, setIsSubmittingSign] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureMode, setSignatureMode] = useState<'typed' | 'drawn' | 'uploaded'>('typed');
  const [signatureImage, setSignatureImage] = useState('');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [drawnSignatureImage, setDrawnSignatureImage] = useState('');
  const [signingPdfUrl, setSigningPdfUrl] = useState('');
  const [isRenderingSigningPdf, setIsRenderingSigningPdf] = useState(false);
  const [consentToSign, setConsentToSign] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const didDrawRef = useRef(false);

  const fetchMySignatures = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/signatures/me`, {
        headers: getAuthHeaders(token),
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setDocs(list);
      }
    } catch (err) {
      console.error('Failed to load my signatures', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchMySignatures();
  }, [fetchMySignatures]);

  const pendingDocs = docs.filter((d) => d.status === 'pending');
  const completedDocs = docs.filter((d) => d.status === 'signed');
  const signatureReady = signatureMode === 'typed' ? !!typedSignature.trim() : signatureMode === 'uploaded' ? !!signatureImage : hasDrawnSignature && !!drawnSignatureImage;

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    canvas.setPointerCapture(event.pointerId);
    context.strokeStyle = '#172554';
    context.lineWidth = 3.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo((event.clientX - bounds.left) * canvas.width / bounds.width, (event.clientY - bounds.top) * canvas.height / bounds.height);
    drawingRef.current = true;
    didDrawRef.current = false;
  };

  const continueDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    context.lineTo((event.clientX - bounds.left) * canvas.width / bounds.width, (event.clientY - bounds.top) * canvas.height / bounds.height);
    context.stroke();
    didDrawRef.current = true;
  };

  const finishDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = signatureCanvasRef.current;
    if (event && canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (didDrawRef.current && canvas) {
      setDrawnSignatureImage(canvas.toDataURL('image/png'));
      setHasDrawnSignature(true);
    }
  };

  const clearDrawing = () => {
    const canvas = signatureCanvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    didDrawRef.current = false;
    setHasDrawnSignature(false);
    setDrawnSignatureImage('');
  };

  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
  const signingDocumentHtml = (doc: MySignatureDoc, signature = '') => {
    const color = doc.brandColor || '#4F46E5';
    const logo = doc.logoUrl ? `<img src="${escapeHtml(doc.logoUrl)}" alt="Company logo" class="logo"/>` : '';
    const header = doc.header || [doc.senderName, doc.contactEmail, doc.contactPhone].filter(Boolean).join('\n');
    const footer = doc.footer || [doc.websiteUrl, doc.contactEmail, doc.contactPhone].filter(Boolean).join('\n');
    const body = doc.documentUrl ? '<p>This is an uploaded document. Open the original file using the document link.</p>' : (doc.body || '<p>Document content is unavailable.</p>');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(doc.documentName)}</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f4f7;color:#202124;font:14px/1.65 'Questrial',Inter,Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:28px auto;padding:20mm 22mm;background:#fff;box-shadow:0 4px 24px #10182818;display:flex;flex-direction:column}.brand{height:7px;background:${color};margin:-20mm -22mm 25px}.logo{display:block;max-width:180px;max-height:58px;object-fit:contain;margin:0 0 18px}.doc-header{white-space:pre-wrap;color:#475467;font-size:11px;padding:0 0 14px;border-bottom:1px solid #d0d5dd}.title{text-align:center;margin:28px 0 24px}.title h1{font:700 24px/1.25 'Questrial',Inter,Arial,sans-serif;margin:0 0 8px}.muted{color:#667085;font-size:12px}.body{font:15px/1.75 'Questrial',Inter,Arial,sans-serif;min-height:360px;margin-bottom:30px}.body p{margin:0 0 1em}.body h1,.body h2,.body h3{line-height:1.25;margin:1.2em 0 .6em}.doc-footer{white-space:pre-wrap;border-top:1px solid #d0d5dd;padding-top:14px;margin-top:auto;color:#475467;font-size:11px}.signatures{display:grid;grid-template-columns:1fr 180px;gap:32px;margin-top:30px;break-inside:avoid}.signatures label{display:block;color:#667085;font-size:11px;margin-bottom:8px}.signature{height:58px;border-bottom:1px solid #98a2b3;display:flex;align-items:center}.signature img{max-height:54px;max-width:100%;object-fit:contain}.date{height:58px;border-bottom:1px solid #98a2b3;padding:24px 0 4px;font-family:monospace}@page{size:A4;margin:0}@media print{body{background:#fff}.page{margin:0;box-shadow:none;width:auto;min-height:297mm;page-break-after:always}}</style></head><body><article class="page"><div class="brand"></div>${logo}<header class="doc-header">${escapeHtml(header)}</header><div class="title"><h1>${escapeHtml(doc.documentName)}</h1><div class="muted">Sent ${escapeHtml(doc.sentAt || '')}</div></div><main class="body">${body}</main><section class="signatures"><div><label>Authorized recipient signature</label><div class="signature">${signature}</div></div><div><label>Date</label><div class="date">${new Date().toISOString().slice(0,10)}</div></div></section><footer class="doc-footer">${escapeHtml(footer)}</footer></article></body></html>`;
  };

  const printSigningDocument = () => {
    if (!signingDoc) return;
    if (!signingPdfUrl) { toast.info('Preparing PDF', 'The PDF preview is still being generated.'); return; }
    openPdfUrl(signingPdfUrl, true);
  };

  const downloadSigningDocument = () => {
    if (!signingDoc) return;
    if (!signingPdfUrl) { toast.info('Preparing PDF', 'The PDF preview is still being generated.'); return; }
    downloadPdfUrl(signingPdfUrl, `${signingDoc.documentName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`);
  };

  // Handle Sign
  const handleSignComplete = async () => {
    if (!signingDoc) return;
    let signatureType = signatureMode;
    let signatureData = typedSignature.trim();
    if (signatureMode === 'drawn') {
      signatureData = drawnSignatureImage;
    } else if (signatureMode === 'uploaded') {
      signatureData = signatureImage;
    }
    if (!consentToSign) {
      toast.warning('Review confirmation required', 'Please confirm that you have reviewed the document before signing.');
      consentCheckboxRef.current?.focus();
      consentCheckboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!signatureData) {
      toast.error('Signature required', 'Add your signature before signing.');
      return;
    }
    setIsSubmittingSign(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE_URL}/api/v1/signatures/${encodeURIComponent(signingDoc.requestId || signingDoc.id)}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signatureType, signatureData, consent: consentToSign }),
      });

      if (res.ok) {
        toast.success('Document Signed', `You have successfully signed "${signingDoc.documentName}".`);
        setSigningDoc(null);
        await fetchMySignatures();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error('Signing failed', err.detail || 'Could not complete e-signature.');
      }
    } catch (err: any) {
      toast.error('Network error', err.message || 'Failed to sign document.');
    } finally {
      setIsSubmittingSign(false);
    }
  };

  const activeSignaturePreview = signatureMode === 'typed'
    ? `<span style="font:italic 24px cursive">${escapeHtml(typedSignature)}</span>`
    : signatureMode === 'drawn'
      ? (drawnSignatureImage ? `<img src="${drawnSignatureImage}" alt="Recipient signature"/>` : '')
      : (signatureImage ? `<img src="${signatureImage}" alt="Recipient signature"/>` : '');

  useEffect(() => {
    if (!signingDoc) {
      setSigningPdfUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return ''; });
      return;
    }
    let current = true;
    setIsRenderingSigningPdf(true);
    renderPdfDocument(signingDocumentHtml(signingDoc, activeSignaturePreview)).then((blob) => {
      if (!current) return;
      const nextUrl = URL.createObjectURL(blob);
      setSigningPdfUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return nextUrl; });
    }).catch((error) => {
      if (current) toast.error('PDF preview unavailable', error instanceof Error ? error.message : 'Could not render this document as a PDF.');
    }).finally(() => { if (current) setIsRenderingSigningPdf(false); });
    return () => { current = false; };
  }, [signingDoc, activeSignaturePreview]);

  // Handle Decline
  const handleDecline = async () => {
    if (!signingDoc || !declineReason.trim()) {
      toast.error('Reason required', 'Please explain why you are declining to sign.');
      return;
    }
    setIsSubmittingSign(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE_URL}/api/v1/signatures/${encodeURIComponent(signingDoc.requestId || signingDoc.id)}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: declineReason.trim() }),
      });

      if (res.ok) {
        toast.success('Document Declined', 'Sender has been notified with your reason.');
        setDeclineModalOpen(false);
        setSigningDoc(null);
        setDeclineReason('');
        await fetchMySignatures();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error('Decline failed', err.detail || 'Could not decline request.');
      }
    } catch (err: any) {
      toast.error('Network error', err.message || 'Failed to decline document.');
    } finally {
      setIsSubmittingSign(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* Full-screen signing experience */}
      {signingDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#F4F4F4',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="row-between p-16"
            style={{ background: 'white', borderBottom: '1px solid var(--border)', flexShrink: 0 }}
          >
            <div className="row gap-8">
              <button type="button" className="btn-neutral btn-sm" onClick={printSigningDocument} disabled={!signingPdfUrl}><Printer size={14}/> Print PDF</button>
              <button type="button" className="btn-neutral btn-sm" onClick={downloadSigningDocument} disabled={!signingPdfUrl}><Download size={14}/> Download PDF</button>
              <button
                className="btn-circle"
                style={{ background: 'var(--bg-page)' }}
                onClick={() => setSigningDoc(null)}
              >
                <FileText size={16} />
              </button>
              <div>
                <h2 className="text-base fw-700 text-1 m-0">{signingDoc.documentName}</h2>
                <div className="text-xs text-5 mt-2 row gap-8">
                  <Shield size={12} className="text-success" /> Secure E-Signature
                </div>
              </div>
            </div>

            <div className="row gap-16">
              <button
                className="btn-neutral btn-sm"
                style={{ color: 'var(--error)' }}
                onClick={() => setDeclineModalOpen(true)}
              >
                <XCircle size={14} /> Decline & Give Reason
              </button>
              <button
                className="btn-primary"
                onClick={handleSignComplete}
                disabled={isSubmittingSign || !signatureReady}
              >
                {isSubmittingSign ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Finish & Sign
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Document Preview (Left) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', justifyContent: 'center' }}>
              {isRenderingSigningPdf || !signingPdfUrl ? <div className="text-sm text-4"><Loader2 size={18} className="animate-spin"/> Preparing PDF preview…</div> : <PdfPreview url={signingPdfUrl} title={`${signingDoc.documentName} PDF signing preview`} style={{ width: 'min(100%, 900px)', minHeight: 'calc(100vh - 190px)', height: '100%' }} />}
            </div>

            {/* Tools Panel (Right) */}
            <div
              style={{
                width: 300,
                background: 'white',
                borderLeft: '1px solid var(--border)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 className="text-sm fw-700 text-1 mb-24 uppercase tracking-wider">Document Details</h3>

              <div className="col gap-24 text-sm">
                <div>
                  <div className="text-xs text-5 mb-4">Sender</div>
                  <div className="row gap-8 align-center">
                    <Avatar name={signingDoc.senderName} size="sm" />
                    <div>
                      <div className="fw-600 text-1">{signingDoc.senderName}</div>
                      <div className="text-xs text-5">{signingDoc.senderRole}</div>
                    </div>
                  </div>
                </div>

                {signingDoc.message && (
                  <div>
                    <div className="text-xs text-5 mb-4">Message from Sender</div>
                    <div className="p-12 text-4" style={{ background: '#F9FAFB', borderRadius: 8, fontStyle: 'italic', fontSize: 13 }}>
                      &ldquo;{signingDoc.message}&rdquo;
                    </div>
                  </div>
                )}

                <div className="col gap-8">
                  <span className="text-xs text-5">Choose how to sign</span>
                  <div className="row gap-6">
                    {(['typed', 'drawn', 'uploaded'] as const).map((mode) => <button type="button" key={mode} className={signatureMode === mode ? 'btn-primary btn-sm' : 'btn-neutral btn-sm'} onClick={() => setSignatureMode(mode)}>{mode === 'typed' ? 'Type' : mode === 'drawn' ? 'Draw' : 'Upload'}</button>)}
                  </div>
                  {signatureMode === 'typed' && <input className="input" aria-label="Type your full legal name" value={typedSignature} maxLength={200} onChange={(e) => setTypedSignature(e.target.value)} autoComplete="name" placeholder="Type your full legal name" />}
                  {signatureMode === 'drawn' && <div className="col gap-6"><canvas ref={signatureCanvasRef} width={600} height={180} aria-label="Draw your signature" style={{ width: '100%', height: 144, border: '1px solid var(--border)', borderRadius: 8, touchAction: 'none', background: '#fff', cursor: 'crosshair' }} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} /><span className="text-xs text-5">Sign with your mouse, trackpad, or finger. Your signature appears on the document.</span><button type="button" className="btn-neutral btn-sm" onClick={clearDrawing}>Clear drawing</button></div>}
                  {signatureMode === 'uploaded' && <div className="col gap-6"><input type="file" accept="image/png,image/jpeg" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 512000) { toast.error('Image too large', 'Signature images must be 500 KB or smaller.'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setSignatureImage(typeof reader.result === 'string' ? reader.result : ''); reader.readAsDataURL(file); }} /><span className="text-xs text-5">Upload a PNG or JPEG signature image, up to 500 KB.</span></div>}
                </div>
                <label className="row gap-8 align-start text-xs text-4">
                  <input ref={consentCheckboxRef} type="checkbox" checked={consentToSign} onChange={(e) => setConsentToSign(e.target.checked)} />
                  <span>I have reviewed the attached document and consent to apply my {signatureMode} signature to this request.</span>
                </label>

                <div className="divider" />

                {signingDoc.documentUrl ? <a className="btn-secondary w-full row-center gap-8" href={signingDoc.documentUrl} target="_blank" rel="noreferrer"><Download size={14} /> Open uploaded document</a> : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxSizing: 'border-box',
              maxHeight: 'calc(100dvh - 40px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 className="text-base fw-700 text-1 mb-8">Decline Signature Request</h3>
            <p className="text-xs text-4 mb-16">
              Please provide the rationale for declining so the sender can revise the terms or follow up.
            </p>
            <textarea
              className="input mb-16"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              rows={4}
              placeholder="e.g. Disagreed with clause 4, or compensation details require amendment..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button
                className="btn-neutral"
                type="button"
                style={{ minHeight: 42 }}
                onClick={() => {
                  setDeclineModalOpen(false);
                  setDeclineReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                style={{ display: 'inline-flex', visibility: 'visible', minHeight: 42, minWidth: 0, padding: '10px 14px', backgroundColor: '#b42318', backgroundImage: 'none', color: '#fff', whiteSpace: 'nowrap', opacity: isSubmittingSign ? 0.65 : 1 }}
                onClick={handleDecline}
                disabled={isSubmittingSign || !declineReason.trim()}
              >
                {isSubmittingSign ? 'Declining…' : 'Confirm decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <PageHeader
        title="My Signatures"
        subtitle="Review, electronically sign, and access documents assigned to you."
        icon={<FileSignature size={28} className="text-white" />}
        tabs={['Action Required', 'Completed Documents']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--bg-page)' }}>
        {activeTab === 'Action Required' && (
          <div>
            <div className="row-between mb-24">
              <h3 className="text-xl fw-700 text-1 row gap-12 align-center">
                <Clock className="text-warning" size={24} /> Action Required
              </h3>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : pendingDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', background: 'white', borderRadius: 16 }}>
                <CheckCircle2 size={44} className="text-success mb-12" style={{ margin: '0 auto 12px' }} />
                <h4 className="text-base fw-700 text-1">All Caught Up!</h4>
                <p className="text-xs text-5 mt-4">You have no pending documents awaiting your signature.</p>
              </div>
            ) : (
              <div className="grid-2 gap-24 mb-40">
                {pendingDocs.map((doc) => (
                  <Card
                    key={doc.id}
                    style={{ border: '1px solid var(--warning)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.05)' }}
                    className="hover-scale"
                  >
                    <CardBody>
                      <div className="row-between mb-16">
                        <div className="row gap-12 align-center">
                          <div
                            className="icon-chip"
                            style={{ width: 40, height: 40, background: 'var(--warning-tint)', color: 'var(--warning)' }}
                          >
                            <FileSignature size={20} />
                          </div>
                          <Badge variant="warning">Awaiting Your Signature</Badge>
                        </div>
                      </div>

                      <h3 className="text-lg fw-700 text-1 mb-16">{doc.documentName}</h3>

                      <div className="row gap-12 mb-24 p-12 align-center" style={{ background: '#F9FAFB', borderRadius: 8 }}>
                        <Avatar name={doc.senderName} size="sm" />
                        <div>
                          <div className="text-sm fw-600 text-1">{doc.senderName}</div>
                          <div className="text-xs text-5 mt-2">{doc.senderRole}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div className="text-xs fw-600 text-4 mb-2">Sent</div>
                          <div className="text-xs text-1">
                            {doc.sentAt ? new Date(doc.sentAt).toLocaleDateString() : 'Recently'}
                          </div>
                        </div>
                      </div>

                      <button className="btn-primary w-full row-center gap-8" onClick={() => { setTypedSignature(''); setSignatureImage(''); setSignatureMode('typed'); setHasDrawnSignature(false); setConsentToSign(false); setSigningDoc(doc); }}>
                        Review & Sign <ArrowRight size={16} />
                      </button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Completed Documents' && (
          <div>
            <h2 className="text-xl fw-700 text-1 mb-24 row gap-12 align-center">
              <CheckCircle2 className="text-success" size={24} /> Completed Documents
            </h2>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : completedDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', background: 'white', borderRadius: 16 }}>
                <FileSignature size={44} className="text-4 mb-12" style={{ margin: '0 auto 12px' }} />
                <h4 className="text-base fw-700 text-1">No completed records yet</h4>
                <p className="text-xs text-5 mt-4">Signed agreements and acknowledgements will appear here.</p>
              </div>
            ) : (
              <Card>
                <CardBody style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F9FAFB' }}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-4)',
                          fontSize: 12,
                          textTransform: 'uppercase',
                        }}
                      >
                        <th style={{ padding: '16px 24px', fontWeight: 600 }}>Document Name</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600 }}>Sender</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600 }}>Completed On</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600 }}>Audit Trail</th>
                        <th style={{ padding: '16px 24px', width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedDocs.map((doc, idx) => (
                        <tr
                          key={doc.id}
                          style={{
                            borderBottom: idx === completedDocs.length - 1 ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          <td style={{ padding: '20px 24px' }}>
                            <div className="row gap-12 align-center">
                              <div
                                className="icon-chip"
                                style={{ width: 32, height: 32, background: 'var(--success-tint)', color: 'var(--success)' }}
                              >
                                <CheckCircle2 size={16} />
                              </div>
                              <div>
                                <div className="text-sm fw-700 text-1">{doc.documentName}</div>
                                <div className="text-xs text-5 mt-2">Executed Document</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '20px 24px', fontSize: 14 }}>
                            <div className="row gap-8 align-center">
                              <Avatar name={doc.senderName} size="sm" />
                              <span className="fw-600 text-1">{doc.senderName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '20px 24px', color: 'var(--text-4)', fontSize: 14 }}>
                            {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : 'Signed'}
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <div className="row gap-8 text-xs text-5 align-center">
                              <Shield size={14} className="text-success" /> Signature recorded
                            </div>
                          </td>
                          <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                            {doc.documentUrl ? <a className="btn-secondary btn-sm row gap-8" href={doc.documentUrl} target="_blank" rel="noreferrer"><Download size={14} /> Open document</a> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
