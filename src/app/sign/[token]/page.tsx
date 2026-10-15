'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Download, Loader2, Printer, Shield } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { downloadPdfUrl, openPdfUrl, renderPdfDocument } from '@/lib/pdfDocument';

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
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(request.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f4f7;color:#202124;font:14px/1.65 'Questrial',Inter,Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:28px auto;padding:20mm 22mm;background:#fff;box-shadow:0 4px 24px #10182818;display:flex;flex-direction:column}.brand{height:7px;background:${request.brandColor||'#4F46E5'};margin:-20mm -22mm 25px}.logo{display:block;max-width:180px;max-height:58px;object-fit:contain;margin:0 0 18px}.header{white-space:pre-wrap;color:#475467;font-size:11px;padding:0 0 14px;border-bottom:1px solid #d0d5dd}.title{text-align:center;margin:28px 0 24px}.title h1{font:700 24px/1.25 'Questrial',Inter,Arial,sans-serif;margin:0 0 8px}.muted{color:#667085;font-size:12px}.body{font:15px/1.75 'Questrial',Inter,Arial,sans-serif;min-height:360px;margin-bottom:30px}.body p{margin:0 0 1em}.body h1,.body h2,.body h3{line-height:1.25;margin:1.2em 0 .6em}.footer{white-space:pre-wrap;border-top:1px solid #d0d5dd;padding-top:14px;margin-top:auto;color:#475467;font-size:11px}.signatures{display:grid;grid-template-columns:1fr 180px;gap:32px;margin-top:30px;break-inside:avoid}.signatures label{display:block;color:#667085;font-size:11px;margin-bottom:8px}.signature{height:58px;border-bottom:1px solid #98a2b3;display:flex;align-items:center}.signature img{max-height:54px;max-width:100%;object-fit:contain}.date{height:58px;border-bottom:1px solid #98a2b3;padding:24px 0 4px;font-family:monospace}@page{size:A4;margin:0}@media print{body{background:#fff}.page{margin:0;box-shadow:none;width:auto;min-height:297mm;page-break-after:always}}</style></head><body><article class="page"><div class="brand"></div>${logo}<header class="header">${escapeHtml(header)}</header><div class="title"><h1>${escapeHtml(request.title)}</h1><div class="muted">Prepared for ${escapeHtml(request.recipientName)}</div></div><main class="body">${body}</main><footer class="footer">${escapeHtml(footer)}</footer><section class="signatures"><div><label>Authorized recipient signature</label><div class="signature">${signature}</div></div><div><label>Date</label><div class="date">${new Date().toISOString().slice(0, 10)}</div></div></section></article></body></html>`;
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

  return <main style={{ minHeight: '100vh', background: '#f3f4f6', padding: 24, fontFamily: 'system-ui' }}><section style={{ maxWidth: 1040, margin: '0 auto', background: 'white', borderRadius: 18, padding: 28, boxShadow: '0 8px 32px #0001' }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#4f46e5' }}><Shield/><div><strong>{request?.companyName || 'Secure signing'}</strong><div style={{ color: '#667085', fontSize: 13 }}>Protected external signature link</div></div>
      {request && pdfUrl && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}><button onClick={() => openPdfUrl(pdfUrl, true)} style={buttonStyle}><Printer size={15}/>Print PDF</button><button onClick={() => downloadPdfUrl(pdfUrl, pdfFilename)} style={buttonStyle}><Download size={15}/>Download PDF</button></div>}
    </div>
    {error && <p role="alert" style={{ color: '#b42318', marginTop: 24 }}>{error}</p>}
    {done ? <div style={{ textAlign: 'center', padding: 56 }}><CheckCircle2 size={48} color="#059669"/><h1>Document signed</h1><p>Your signature has been recorded securely.</p></div> : request && <>
      <h1 style={{ marginTop: 24 }}>{request.title}</h1><p style={{ color: '#667085' }}>Prepared for {request.recipientName}. {request.message}</p>
      <div style={{ height: 'min(62vh, 760px)', minHeight: 440, background: '#edf0f4', borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
        {renderingPdf || !pdfUrl ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#667085' }}><Loader2 className="animate-spin" size={18}/> Preparing PDF preview…</div> : <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title={`${request.title} PDF preview`} style={{ width: '100%', height: '100%', border: 0, background: 'white' }}/ >}
      </div>
      {request.documentUrl && <a href={request.documentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 12, color: '#344054' }}>Open original uploaded document</a>}
      <h2 style={{ fontSize: 17, marginTop: 24 }}>Choose how to sign</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(['typed', 'drawn', 'uploaded'] as const).map((value) => <button key={value} onClick={() => setMode(value)} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #d0d5dd', background: mode === value ? '#eef2ff' : 'white' }}>{value === 'typed' ? 'Type name' : value === 'drawn' ? 'Draw signature' : 'Upload image'}</button>)}</div>
      {mode === 'typed' && <input value={name} maxLength={200} onChange={(event) => setName(event.target.value)} placeholder="Your full legal name" style={inputStyle}/>}
      {mode === 'drawn' && <div style={{ marginTop: 12 }}><canvas ref={canvas} width={700} height={180} aria-label="Draw your signature" style={{ width: '100%', height: 140, border: '1px solid #d0d5dd', borderRadius: 8, touchAction: 'none', cursor: 'crosshair' }} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing}/><div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}><button type="button" onClick={clearDrawing}>Clear drawing</button><span style={{ color: '#667085', fontSize: 12 }}>Sign with a mouse, trackpad, or finger.</span></div></div>}
      {mode === 'uploaded' && <input type="file" accept="image/png,image/jpeg" style={{ display: 'block', marginTop: 12 }} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 512000) { setError('Signature images must be 500 KB or smaller.'); return; } const reader = new FileReader(); reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : ''); reader.readAsDataURL(file); }}/ >}
      <label style={{ display: 'flex', gap: 10, marginTop: 18 }}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/>I reviewed the document and consent to sign electronically.</label>
      <button disabled={busy || !consent || (mode === 'typed' ? !name.trim() : mode === 'uploaded' ? !image : !ready)} onClick={sign} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '12px 20px', background: '#4f46e5', color: 'white', border: 0, borderRadius: 10, opacity: busy || !consent ? 0.5 : 1 }}>{busy ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}Finish &amp; Sign</button>
    </>}
  </section></main>;
}

const buttonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 12px', border: '1px solid #d0d5dd', background: 'white', borderRadius: 8, color: '#344054', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: 12, marginTop: 12, border: '1px solid #d0d5dd', borderRadius: 8 };
