"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileSignature,
  Shield,
  Download,
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
  const [consentToSign, setConsentToSign] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

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
  const signatureReady = signatureMode === 'typed' ? !!typedSignature.trim() : signatureMode === 'uploaded' ? !!signatureImage : hasDrawnSignature;

  // Handle Sign
  const handleSignComplete = async () => {
    if (!signingDoc) return;
    let signatureType = signatureMode;
    let signatureData = typedSignature.trim();
    if (signatureMode === 'drawn') {
      signatureData = signatureCanvasRef.current?.toDataURL('image/png') || '';
    } else if (signatureMode === 'uploaded') {
      signatureData = signatureImage;
    }
    if (!signatureData || !consentToSign) {
      toast.error('Signature required', 'Add a signature and confirm consent before signing.');
      return;
    }
    setIsSubmittingSign(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE_URL}/api/v1/signatures/${signingDoc.id}/sign`, {
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

      const res = await fetch(`${API_BASE_URL}/api/v1/signatures/${signingDoc.id}/decline`, {
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
            <div className="row gap-16">
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
                disabled={isSubmittingSign || !signatureReady || !consentToSign}
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
            <div style={{ flex: 1, overflowY: 'auto', padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 850,
                  minHeight: 1100,
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative',
                  padding: 80,
                }}
              >
                <div style={{height:5,background:signingDoc.brandColor||'#4F46E5',marginBottom:20}} />
                {signingDoc.logoUrl && <img src={signingDoc.logoUrl} alt={`${signingDoc.senderName} logo`} style={{maxWidth:180,maxHeight:56,objectFit:'contain',marginBottom:20}} />}
                {(signingDoc.header || signingDoc.footer) && <div style={{whiteSpace:'pre-wrap',fontSize:12,color:'#667085',borderBottom:'1px solid #e5e7eb',paddingBottom:16,marginBottom:24}}>{signingDoc.header}</div>}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <h1 className="text-2xl fw-800 text-1 mb-8" style={{ fontFamily: 'serif' }}>
                    {signingDoc.documentName}
                  </h1>
                  <p className="text-sm text-5">
                    Sent Date: {signingDoc.sentAt ? new Date(signingDoc.sentAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>

                <div className="text-sm text-1" style={{ lineHeight: 1.8, fontFamily: 'serif' }}>
                  {signingDoc.documentUrl ? (
                    <iframe src={signingDoc.documentUrl} title={signingDoc.documentName} style={{ width: '100%', height: '850px', border: 0 }} />
                  ) : signingDoc.body ? (
                    <div style={{whiteSpace:'pre-wrap',fontFamily:'Georgia,serif'}}>{signingDoc.body}</div>
                  ) : (
                    <p className="mb-16">The uploaded document preview is unavailable. Return to your signatures list and try again.</p>
                  )}
                  {!signingDoc.documentUrl && (signingDoc.footer || signingDoc.websiteUrl || signingDoc.contactEmail || signingDoc.contactPhone) && <div style={{whiteSpace:'pre-wrap',borderTop:'1px solid #e5e7eb',marginTop:28,paddingTop:14,fontSize:12,color:'#667085'}}>{[signingDoc.footer,signingDoc.websiteUrl,signingDoc.contactEmail,signingDoc.contactPhone].filter(Boolean).join('\n')}</div>}
                  <br />
                  <br />
                  <br />
                  <br />

                  <div className="row-between align-end">
                    <div style={{ width: 300 }}>
                      <div className="text-xs text-5 mb-8">Authorized Recipient Signature</div>
                      <div
                        style={{
                          borderBottom: '2px solid var(--border)',
                          height: 48,
                          position: 'relative',
                          background: 'rgba(124, 58, 237, 0.08)',
                          borderRadius: '4px 4px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        {signatureMode === 'typed' ? <span className="text-primary fw-600 text-sm" style={{ fontFamily: 'cursive', fontSize: 22 }}>{typedSignature || 'Type your signature below'}</span> : signatureMode === 'uploaded' ? (signatureImage ? <img src={signatureImage} alt="Signature preview" style={{ maxWidth: 240, maxHeight: 44, objectFit: 'contain' }} /> : <span className="text-primary fw-600 text-sm">Upload your signature image</span>) : hasDrawnSignature ? <img src={signatureCanvasRef.current?.toDataURL('image/png')} alt="Signature preview" style={{ maxWidth: 240, maxHeight: 44, objectFit: 'contain' }} /> : <span className="text-primary fw-600 text-sm">Draw your signature below</span>}
                      </div>
                    </div>

                    <div style={{ width: 200 }}>
                      <div className="text-xs text-5 mb-8">Date</div>
                      <div style={{ borderBottom: '2px solid var(--border)', height: 48, position: 'relative' }}>
                        <div
                          style={{
                            fontSize: 15,
                            color: 'var(--text-1)',
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            fontFamily: 'monospace',
                          }}
                        >
                          {new Date().toISOString().slice(0, 10)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  {signatureMode === 'drawn' && <div className="col gap-6"><canvas ref={signatureCanvasRef} width={500} height={160} aria-label="Draw your signature" style={{ width: '100%', height: 128, border: '1px solid var(--border)', borderRadius: 8, touchAction: 'none', background: '#fff' }} onPointerDown={(e) => { const canvas = signatureCanvasRef.current; if (!canvas) return; canvas.setPointerCapture(e.pointerId); const rect = canvas.getBoundingClientRect(); const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height); setHasDrawnSignature(true); }} onPointerMove={(e) => { if (!(e.buttons & 1)) return; const canvas = signatureCanvasRef.current; const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return; const rect = canvas.getBoundingClientRect(); ctx.lineTo((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height); ctx.stroke(); }} /><button type="button" className="btn-neutral btn-sm" onClick={() => { const canvas = signatureCanvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); setHasDrawnSignature(false); }}>Clear drawing</button></div>}
                  {signatureMode === 'uploaded' && <div className="col gap-6"><input type="file" accept="image/png,image/jpeg" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 512000) { toast.error('Image too large', 'Signature images must be 500 KB or smaller.'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setSignatureImage(typeof reader.result === 'string' ? reader.result : ''); reader.readAsDataURL(file); }} /><span className="text-xs text-5">Upload a PNG or JPEG signature image, up to 500 KB.</span></div>}
                </div>
                <label className="row gap-8 align-start text-xs text-4">
                  <input type="checkbox" checked={consentToSign} onChange={(e) => setConsentToSign(e.target.checked)} />
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
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 className="text-base fw-700 text-1 mb-8">Decline Signature Request</h3>
            <p className="text-xs text-4 mb-16">
              Please provide the rationale for declining so the sender can revise the terms or follow up.
            </p>
            <textarea
              className="input mb-16"
              rows={4}
              placeholder="e.g. Disagreed with clause 4, or compensation details require amendment..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="row-end gap-12">
              <button
                className="btn-neutral"
                onClick={() => {
                  setDeclineModalOpen(false);
                  setDeclineReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: 'var(--error)' }}
                onClick={handleDecline}
                disabled={isSubmittingSign || !declineReason.trim()}
              >
                {isSubmittingSign ? 'Declining...' : 'Confirm Decline'}
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
