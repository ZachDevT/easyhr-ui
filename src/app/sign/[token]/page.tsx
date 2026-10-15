'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Download, ExternalLink, FileText, Loader2, Printer, Shield, UserRound } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { downloadPdfUrl, openPdfUrl, renderPdfDocument } from '@/lib/pdfDocument';
import styles from './public-signature.module.css';

type Request = {
  requestId: string;
  documentUrl?: string;
  title: string;
  body: string;
  header?: string;
  footer?: string;
  logoUrl?: string;
  brandColor?: string;
  websiteUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  message: string;
  recipientName: string;
  companyName: string;
  status: string;
};

type SigningMode = 'typed' | 'drawn' | 'uploaded';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

function buildSigningPdf(request: Request, signature = '') {
  const header = request.header || request.companyName;
  const footer = request.footer || [request.websiteUrl, request.contactEmail, request.contactPhone].filter(Boolean).join('\n');
  const body = request.documentUrl ? '<p>Open the original attached document from the signing link to review its complete contents.</p>' : (request.body || '<p>Review this document and sign below.</p>');
  const logo = request.logoUrl ? `<img class="logo" src="${escapeHtml(request.logoUrl)}" alt="Company logo"/>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(request.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f4f7;color:#202124;font:14px/1.65 'Questrial',Inter,Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:28px auto;padding:20mm 22mm;background:#fff;box-shadow:0 4px 24px #10182818;display:flex;flex-direction:column}.brand{height:7px;background:${request.brandColor||'#4F46E5'};margin:-20mm -22mm 25px}.logo{display:block;max-width:180px;max-height:58px;object-fit:contain;margin:0 0 18px}.header{white-space:pre-wrap;color:#475467;font-size:11px;padding:0 0 14px;border-bottom:1px solid #d0d5dd}.title{text-align:center;margin:28px 0 24px}.title h1{font:700 24px/1.25 'Questrial',Inter,Arial,sans-serif;margin:0 0 8px}.muted{color:#667085;font-size:12px}.body{font:15px/1.75 'Questrial',Inter,Arial,sans-serif;min-height:360px;margin-bottom:30px}.body p{margin:0 0 1em}.body h1,.body h2,.body h3{line-height:1.25;margin:1.2em 0 .6em}.footer{white-space:pre-wrap;border-top:1px solid #d0d5dd;padding-top:14px;margin-top:auto;color:#475467;font-size:11px}.signatures{display:grid;grid-template-columns:1fr 180px;gap:32px;margin-top:30px;break-inside:avoid}.signatures label{display:block;color:#667085;font-size:11px;margin-bottom:8px}.signature{height:58px;border-bottom:1px solid #98a2b3;display:flex;align-items:center}.signature img{max-height:54px;max-width:100%;object-fit:contain}.date{height:58px;border-bottom:1px solid #98a2b3;padding:24px 0 4px;font-family:monospace}@page{size:A4;margin:0}@media print{body{background:#fff}.page{margin:0;box-shadow:none;width:auto;min-height:297mm;page-break-after:always}}</style></head><body><article class="page"><div class="brand"></div>${logo}<header class="header">${escapeHtml(header)}</header><div class="title"><h1>${escapeHtml(request.title)}</h1><div class="muted">Prepared for ${escapeHtml(request.recipientName)}</div></div><main class="body">${body}</main><section class="signatures"><div><label>Authorized recipient signature</label><div class="signature">${signature}</div></div><div><label>Date</label><div class="date">${new Date().toISOString().slice(0, 10)}</div></div></section><footer class="footer">${escapeHtml(footer)}</footer></article></body></html>`;
}

export default function ExternalSignPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [request, setRequest] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<SigningMode>('typed');
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [drawnImage, setDrawnImage] = useState('');
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [renderingPdf, setRenderingPdf] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/public/signatures/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('This signing link is invalid, expired, or already used.');
        setRequest(await response.json());
      })
      .catch((reason) => setError(reason.message || 'Could not load this document.'));
  }, [token]);

  const signatureMarkup = mode === 'typed'
    ? `<span style="font:italic 24px cursive">${escapeHtml(name)}</span>`
    : mode === 'drawn'
      ? (drawnImage ? `<img src="${drawnImage}" alt="Recipient signature"/>` : '')
      : (image ? `<img src="${image}" alt="Recipient signature"/>` : '');

  useEffect(() => {
    if (!request) return;
    let current = true;
    setRenderingPdf(true);
    renderPdfDocument(buildSigningPdf(request, signatureMarkup)).then((blob) => {
      if (!current) return;
      const next = URL.createObjectURL(blob);
      setPdfUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return next; });
    }).catch((reason) => {
      if (current) setError(reason instanceof Error ? reason.message : 'Could not prepare the PDF preview.');
    }).finally(() => { if (current) setRenderingPdf(false); });
    return () => { current = false; };
  }, [request, signatureMarkup]);

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const bounds = element.getBoundingClientRect();
    element.setPointerCapture(event.pointerId);
    context.strokeStyle = '#172554';
    context.lineWidth = 3.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo((event.clientX - bounds.left) * element.width / bounds.width, (event.clientY - bounds.top) * element.height / bounds.height);
    drawing.current = true;
    hasStroke.current = false;
  };

  const continueDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    event.preventDefault();
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const bounds = element.getBoundingClientRect();
    context.lineTo((event.clientX - bounds.left) * element.width / bounds.width, (event.clientY - bounds.top) * element.height / bounds.height);
    context.stroke();
    hasStroke.current = true;
  };

  const stopDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    const element = canvas.current;
    if (event && element?.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (hasStroke.current && element) {
      setDrawnImage(element.toDataURL('image/png'));
      setReady(true);
    }
  };

  const sign = async () => {
    const data = mode === 'typed' ? name.trim() : mode === 'uploaded' ? image : drawnImage;
    if (!data || !consent) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/signatures/${encodeURIComponent(token)}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureType: mode, signatureData: data, consent }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || 'Signing failed');
      }
      setDone(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Signing failed');
    } finally {
      setBusy(false);
    }
  };

  const clearDrawing = () => {
    const element = canvas.current;
    element?.getContext('2d')?.clearRect(0, 0, element.width, element.height);
    hasStroke.current = false;
    setDrawnImage('');
    setReady(false);
  };

  const documentTitle = request?.title || 'signed-document';
  const pdfFilename = `${documentTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;

  const signatureReady = mode === 'typed' ? !!name.trim() : mode === 'uploaded' ? !!image : ready && !!drawnImage;

  if (done) return <main className={styles.statusPage}><section className={styles.statusCard}><CheckCircle2 size={52} color="var(--success, #12a56a)"/><h1 className="text-2xl fw-800 text-1 mt-16">Document signed</h1><p className="text-sm text-4">Your signature has been recorded securely. You can close this page.</p></section></main>;
  if (!request && !error) return <main className={styles.statusPage}><section className={styles.statusCard}><Loader2 size={24} className="animate-spin text-primary"/><p className="text-sm text-4 mt-12">Loading your secure document…</p></section></main>;
  if (!request) return <main className={styles.statusPage}><section className={styles.statusCard}><Shield size={38} color="var(--error, #b42318)"/><h1 className="text-xl fw-800 text-1 mt-16">Unable to open this document</h1><p role="alert" className={styles.errorText}>{error}</p></section></main>;

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div className={styles.documentIdentity}>
        <div className={styles.identityMark}>{request.logoUrl ? <img src={request.logoUrl} alt=""/> : <Shield size={21}/>}</div>
        <div className={styles.identityCopy}><div className={styles.companyName}>{request.companyName || 'Secure signing'}</div><div className={styles.secureLine}><Shield size={12} color="var(--success, #12a56a)"/>Protected external signature link</div></div>
        <div className={styles.docTitle}>{request.title}</div>
      </div>
      <div className={styles.headerActions}>
        <button type="button" className="btn-neutral btn-sm" disabled={!pdfUrl} onClick={() => pdfUrl && openPdfUrl(pdfUrl, true)}><Printer size={14}/>Print PDF</button>
        <button type="button" className="btn-neutral btn-sm" disabled={!pdfUrl} onClick={() => pdfUrl && downloadPdfUrl(pdfUrl, pdfFilename)}><Download size={14}/>Download PDF</button>
      </div>
    </header>

    {error && <div role="alert" className="p-12" style={{ background: '#fff1f0', color: 'var(--error, #b42318)' }}>{error}</div>}
    <div className={styles.workspace}>
      <section className={styles.previewStage} aria-label="Document preview">
        {renderingPdf || !pdfUrl ? <div className={styles.previewState}><Loader2 className="animate-spin" size={19}/>Preparing PDF preview…</div> : <iframe className={styles.pdfFrame} src={`${pdfUrl}#toolbar=0&view=FitH`} title={`${request.title} PDF preview`}/>}
      </section>

      <aside className={styles.panel} aria-label="Signing details and controls">
        <div className={styles.panelContent}>
          <h2 className={styles.panelHeading}>Document details</h2>
          <div className={styles.detailGroup}>
            <div><span className={styles.fieldLabel}>Signing as</span><div className={styles.recipientRow}><span className={styles.recipientAvatar}>{request.recipientName.trim().charAt(0).toUpperCase() || <UserRound size={16}/>}</span><span className={styles.recipientName}>{request.recipientName}</span></div></div>
            {request.message && <div><span className={styles.fieldLabel}>Message from sender</span><div className={styles.senderMessage}>“{request.message}”</div></div>}
          </div>

          <div className={styles.sectionDivider}/>

          <div className={styles.detailGroup}>
            <div><h2 className={styles.panelHeading}>Your signature</h2><p className={styles.helpText} style={{ margin: '5px 0 0' }}>Choose how you’d like to sign this document.</p></div>
            <div className={styles.modeGroup} role="group" aria-label="Signature method">
              {(['typed', 'drawn', 'uploaded'] as const).map((value) => <button type="button" key={value} className={`${styles.modeButton} ${mode === value ? styles.modeButtonActive : ''}`} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'typed' ? 'Type' : value === 'drawn' ? 'Draw' : 'Upload'}</button>)}
            </div>
            {mode === 'typed' && <div><label className={styles.fieldLabel} htmlFor="signer-full-name">Full legal name</label><input id="signer-full-name" className={styles.fieldInput} value={name} maxLength={200} autoComplete="name" onChange={(event) => setName(event.target.value)} placeholder="Enter your full legal name"/></div>}
            {mode === 'drawn' && <div className={styles.detailGroup}><canvas ref={canvas} width={700} height={180} aria-label="Draw your signature" className={styles.drawCanvas} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing}/><div className={styles.recipientRow}><button type="button" className="btn-neutral btn-sm" onClick={clearDrawing}>Clear signature</button><span className={styles.helpText}>Use your mouse, trackpad, or finger.</span></div></div>}
            {mode === 'uploaded' && <div className={styles.uploadArea}><label className={styles.fieldLabel} htmlFor="signature-image" style={{ marginBottom: 0 }}>Upload a signature image</label><input id="signature-image" type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 512000) { setError('Signature images must be 500 KB or smaller.'); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : ''); reader.readAsDataURL(file); }}/>{image && <img className={styles.uploadedPreview} src={image} alt="Uploaded signature preview"/>}</div>}
          </div>

          {request.documentUrl && <a className="btn-neutral btn-sm row gap-8" href={request.documentUrl} target="_blank" rel="noreferrer"><FileText size={14}/>Open uploaded document<ExternalLink size={13}/></a>}
          <label className={styles.consent}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span>I have reviewed this document and consent to sign it electronically.</span></label>
        </div>
        <div className={styles.panelActions}>
          <button type="button" className={styles.finishButton} disabled={busy || !consent || !signatureReady} onClick={sign}>{busy ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} {busy ? 'Signing…' : 'Finish & Sign'}</button>
          <span className={styles.helpText} style={{ textAlign: 'center' }}><Shield size={11} style={{ verticalAlign: '-2px', marginRight: 4 }}/>Your signature will be submitted securely.</span>
        </div>
      </aside>
    </div>
  </main>;
}
