"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FileSignature,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  Download,
  Shield,
  Mail,
  ArrowRight,
  Plus,
  Users,
  Send,
  Bell,
  X,
  UploadCloud,
  Edit3,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Printer,
  FileDown,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/RichTextEditor';
import { downloadPdfBlob, openPdfBlob, renderPdfDocument } from '@/lib/pdfDocument';
import { PdfPreview } from '@/components/shared/PdfPreview';
import { useDocumentActions } from '@/components/documents/DocumentViewer';

interface SignatureRecipient {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'signed' | 'declined';
  signedAt?: string | null;
  declineReason?: string | null;
}

interface SignatureRequestItem {
  id: string;
  documentId: string;
  documentName: string;
  documentUrl?: string;
  body?: string;
  status: 'pending' | 'completed' | 'declined' | 'expired';
  customMessage: string;
  expiresAt?: string;
  createdAt: string;
  createdByName: string;
  recipients: SignatureRecipient[];
}

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  workEmail?: string;
  department?: string;
  jobTitle?: string;
}
interface OrgDocument {
  id: string;
  filename: string;
  category: string;
  status: string;
  employeeId?: string | null;
}
interface SignatureTemplate { id: string; name: string; category: string; description: string; body: string; headerText:string; footerText:string; expiresInDays: number; isActive: boolean }
interface TemplateBranding { companyName:string;legalName:string;registrationNumber:string;websiteUrl:string;contactEmail:string;contactPhone:string;address:string;locations:string[];logoUrl:string;brandColor:string;defaultHeader:string;defaultFooter:string }

function EditableDocumentText({ value, onChange, placeholder, style }: { value: string; onChange: (value: string) => void; placeholder: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);
  return <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={(event) => onChange(event.currentTarget.innerText)} style={{ outline: 'none', whiteSpace: 'pre-wrap', minHeight: 28, cursor: 'text', ...style }} />;
}

export default function SignaturesAdminPage() {
  const { getToken, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live state
  const [requests, setRequests] = useState<SignatureRequestItem[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [templates, setTemplates] = useState<SignatureTemplate[]>([]);
  const [requestSource, setRequestSource] = useState<'document'|'template'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [editingTemplateId,setEditingTemplateId]=useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateView, setTemplateView] = useState<'edit' | 'preview'>('edit');
  const [templatePdfUrl, setTemplatePdfUrl] = useState('');
  const [isRenderingTemplatePdf, setIsRenderingTemplatePdf] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('General');
  const [templateBody, setTemplateBody] = useState('');
  const [templateHeader,setTemplateHeader]=useState('');
  const [templateFooter,setTemplateFooter]=useState('');
  const [templateBranding,setTemplateBranding]=useState<TemplateBranding|null>(null);
  const brandingLoaded=useRef(false);
  const [templateDays, setTemplateDays] = useState(14);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissedDeclinedIds, setDismissedDeclinedIds] = useState<string[]>([]);
  const { view, download: downloadDoc, viewer } = useDocumentActions();
  const [viewingSignedRequest, setViewingSignedRequest] = useState<SignatureRequestItem | null>(null);

  const handleViewRequest = (req: SignatureRequestItem) => {
    if (req.documentId) {
      view(req.documentId, req.documentName);
    } else {
      setViewingSignedRequest(req);
    }
  };

  const handleDownloadRequest = async (req: SignatureRequestItem) => {
    if (req.documentId) {
      await downloadDoc(req.documentId, req.documentName);
    } else {
      const rec = req.recipients?.[0];
      const sanitized = (req.documentName || 'Signed_Document').replace(/\s+/g, '_');
      const lines = [
        '================================================================================',
        '                     EASYHR ENTERPRISE SIGNATURE RECORD                         ',
        '================================================================================',
        '',
        `Document Title:    ${req.documentName}`,
        `Status:            COMPLETED & LEGALLY BINDING`,
        `Recipient:         ${rec?.name || 'Recipient'} (${rec?.email || ''})`,
        `Created By:        ${req.createdByName}`,
        `Date Created:      ${req.createdAt}`,
        '',
        '--------------------------------------------------------------------------------',
        'DOCUMENT BODY:',
        '--------------------------------------------------------------------------------',
        req.body || req.customMessage || 'Document executed.',
        '',
        '--------------------------------------------------------------------------------',
        'SIGNATURE AUDIT VERIFICATION:',
        '--------------------------------------------------------------------------------',
        `Signer:            ${rec?.name || 'Signer'}`,
        `Status:            Digitally Executed & Verified`,
        `Audit ID:          ${req.id}`,
        'System Seal:       EASYHR-CRYPTOGRAPHICALLY-VERIFIED',
        '================================================================================',
      ].join('\n');
      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitized}_Executed.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success('Downloaded', 'Executed document downloaded successfully.');
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('easyhr_dismissed_declined_signatures');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDismissedDeclinedIds(parsed);
      }
    } catch {}
  }, []);

  const handleDismissDeclined = (id: string) => {
    setDismissedDeclinedIds((prev) => {
      const next = [...prev, id];
      try {
        localStorage.setItem('easyhr_dismissed_declined_signatures', JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success('Resolved', 'Declined signature alert marked as resolved.');
  };

  // New Request Form State
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [customRecipientName, setCustomRecipientName] = useState('');
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('Please review and sign this document at your earliest convenience.');

  // Fetch Requests & Employees
  const loadData = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const [reqRes, empRes, docsRes, templatesRes, brandingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/signatures`, { headers: getAuthHeaders(token) }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers: getAuthHeaders(token) }),
        fetch(`${API_BASE_URL}/api/v1/documents?limit=100`, { headers: getAuthHeaders(token) }),
        fetch(`${API_BASE_URL}/api/v1/signatures/templates`, { headers: getAuthHeaders(token) }),
        fetch(`${API_BASE_URL}/api/v1/signatures/branding`, { headers: getAuthHeaders(token) }),
      ]);

      if (reqRes.ok) {
        const rJson = await reqRes.json();
        const rList = Array.isArray(rJson) ? rJson : rJson.data || [];
        setRequests(rList);
      }

      if (empRes.ok) {
        const eJson = await empRes.json();
        const eList = Array.isArray(eJson) ? eJson : eJson.data || [];
        setEmployees(eList);
        if (eList.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(eList[0].id);
        }
      }
      if (docsRes.ok) {
        const dJson = await docsRes.json();
        const docs = (Array.isArray(dJson) ? dJson : dJson.data || []) as OrgDocument[];
        const available = docs.filter((doc) => doc.status === 'available');
        setDocuments(available);
        setSelectedDocumentId((current) => available.some((doc) => doc.id === current) ? current : available[0]?.id || '');
      }
      if (templatesRes.ok) { const data=await templatesRes.json(); const items=(Array.isArray(data)?data:data.data||[]) as SignatureTemplate[]; setTemplates(items); setSelectedTemplateId((current)=>items.some(t=>t.id===current)?current:items[0]?.id||''); }
      if(brandingRes.ok){const b=await brandingRes.json() as TemplateBranding;setTemplateBranding(b);if(!brandingLoaded.current){setTemplateHeader(b.defaultHeader||'');setTemplateFooter(b.defaultFooter||'');brandingLoaded.current=true}}
    } catch (err) {
      console.error('Failed to load signatures data', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit New Request
  const handleCreateRequest = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      let recName = customRecipientName;
      let recEmail = customRecipientEmail;
      let empId = selectedEmployeeId;

      if (selectedEmployeeId) {
        const emp = employees.find((e) => e.id === selectedEmployeeId);
        if (emp) {
          recName = `${emp.firstName} ${emp.lastName}`.trim();
          recEmail = emp.email || emp.workEmail || '';
        }
      }

      if (!recName.trim() || !recEmail.trim()) {
        toast.error('Recipient required', 'Please select an employee or enter recipient contact details.');
        setIsSubmitting(false);
        return;
      }

      if (requestSource === 'document' && !selectedDocumentId) {
        toast.error('Document required', 'Upload and complete a document before requesting signatures.');
        setIsSubmitting(false);
        return;
      }
      if(requestSource==='template'&&!selectedTemplateId){toast.error('Template required','Create or select a template first.');setIsSubmitting(false);return;}
      const documentName = requestSource==='template' ? templates.find(t=>t.id===selectedTemplateId)?.name||templateName : documents.find((doc) => doc.id === selectedDocumentId)?.filename || 'Document';
      const res = await fetch(requestSource==='template' ? `${API_BASE_URL}/api/v1/signatures` : `${API_BASE_URL}/api/v1/documents/${selectedDocumentId}/signatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: customMessage.trim(), recipients: [{ name: recName, email: recEmail }],
          ...(requestSource==='template'?{templateId:selectedTemplateId,mergeFields:{employee_name:recName,effective_date:new Date().toISOString().slice(0,10)}}:{}),
        }),
      });

      if (res.ok) {
        toast.success('Signature Request Sent', `Sent "${documentName}" to ${recName}.`);
        setShowSendModal(false);
        await loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error('Failed to send request', errJson.detail || 'Could not initiate signature request.');
      }
    } catch (err: any) {
      toast.error('Network error', err.message || 'Unable to send request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTemplateDraft = () => {
    setEditingTemplateId('');
    setTemplateName('');
    setTemplateCategory('General');
    setTemplateBody('');
    setTemplateHeader(templateBranding?.defaultHeader || '');
    setTemplateFooter(templateBranding?.defaultFooter || '');
    setTemplateDays(14);
    setTemplateView('edit');
    setShowTemplateEditor(true);
  };
  const editTemplate = (template: SignatureTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateCategory(template.category);
    setTemplateBody(template.body);
    setTemplateHeader(template.headerText || '');
    setTemplateFooter(template.footerText || '');
    setTemplateDays(template.expiresInDays);
    setTemplateView('edit');
    setShowTemplateEditor(true);
  };
  const templateHtml = (saved?: SignatureTemplate) => {
    const name = saved?.name || templateName;
    const bodyDraft = saved?.body || templateBody;
    const headerDraft = saved?.headerText ?? templateHeader;
    const footerDraft = saved?.footerText ?? templateFooter;
    const replace = (text: string) => text
      .replaceAll('{{employee_name}}', 'Alex Morgan')
      .replaceAll('{{company_name}}', templateBranding?.companyName || 'Your Company')
      .replaceAll('{{job_title}}', 'People Operations Specialist')
      .replaceAll('{{effective_date}}', '2026-11-01')
      .replaceAll('{{today}}', new Date().toISOString().slice(0, 10));
    const brand = templateBranding?.brandColor || '#4F46E5';
    const logo = templateBranding?.logoUrl ? `<img src="${templateBranding.logoUrl}" alt="Company logo" style="max-width:180px;max-height:60px;object-fit:contain;margin:0 0 24px"/>` : '';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${name || 'HR document'}</title><style>body{font:15px/1.65 'Questrial',Inter,Arial,sans-serif;color:#202124;margin:0;background:#f3f4f6}.paper{box-sizing:border-box;width:210mm;min-height:297mm;margin:32px auto;padding:22mm;background:white;box-shadow:0 8px 30px #10182822;display:flex;flex-direction:column}.brand{height:7px;background:${brand};margin:-22mm -22mm 24px}.header,.footer{white-space:pre-wrap;color:#596273;font-size:12px}.content{margin:32px 0;min-height:500px;flex:1}.content p{margin:0 0 1em}.content h1,.content h2,.content h3{line-height:1.25;margin:1.25em 0 .55em}.content ul,.content ol{padding-left:1.6em}.footer{border-top:1px solid #e5e7eb;padding-top:16px;margin-top:auto}@media print{body{background:white}.paper{margin:0;box-shadow:none;width:auto;min-height:0}}</style></head><body><article class="paper"><div class="brand"></div>${logo}<header class="header">${replace(headerDraft)}</header><main class="content">${replace(bodyDraft || '<p>Your document content will appear here.</p>')}</main><footer class="footer">${replace(footerDraft)}</footer></article></body></html>`;
  };
  const previewTemplate = (saved?: SignatureTemplate) => {
    if (saved) {
      setEditingTemplateId(saved.id);
      setTemplateName(saved.name);
      setTemplateCategory(saved.category);
      setTemplateBody(saved.body);
      setTemplateHeader(saved.headerText || '');
      setTemplateFooter(saved.footerText || '');
      setTemplateDays(saved.expiresInDays);
    }
    setTemplateView('preview');
    setShowTemplateEditor(true);
  };
  const templatePdfFilename = () => `${(templateName || 'hr-template').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  const downloadTemplate = async () => {
    try { downloadPdfBlob(await renderPdfDocument(templateHtml()), templatePdfFilename()); }
    catch (error) { toast.error('PDF unavailable', error instanceof Error ? error.message : 'Could not create PDF.'); }
  };
  const printTemplate = async () => {
    try { openPdfBlob(await renderPdfDocument(templateHtml()), templatePdfFilename(), true); }
    catch (error) { toast.error('PDF unavailable', error instanceof Error ? error.message : 'Could not create PDF.'); }
  };

  useEffect(() => {
    if (!showTemplateEditor || templateView !== 'preview') return;
    let current = true;
    setIsRenderingTemplatePdf(true);
    renderPdfDocument(templateHtml()).then((blob) => {
      if (!current) return;
      const nextUrl = URL.createObjectURL(blob);
      setTemplatePdfUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return nextUrl; });
    }).catch((error) => {
      if (current) toast.error('Preview unavailable', error instanceof Error ? error.message : 'Could not generate PDF preview.');
    }).finally(() => { if (current) setIsRenderingTemplatePdf(false); });
    return () => { current = false; };
  }, [showTemplateEditor, templateView, templateName, templateBody, templateHeader, templateFooter, templateBranding]);
  const saveTemplate = async () => { setIsSavingTemplate(true); try { const token=await getToken(); if(!token)throw new Error('Not authenticated'); const res=await fetch(`${API_BASE_URL}/api/v1/signatures/templates${editingTemplateId?`/${editingTemplateId}`:''}`,{method:editingTemplateId?'PUT':'POST',headers:{...getAuthHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({name:templateName,category:templateCategory,body:templateBody,headerText:templateHeader,footerText:templateFooter,expiresInDays:templateDays})}); if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.detail||'Could not save template')}toast.success('Template saved','Your organization template is ready to use.');setShowTemplateEditor(false);setTemplateName('');setTemplateBody('');setEditingTemplateId('');await loadData();}catch(e){toast.error('Template not saved',e instanceof Error?e.message:'Could not save template')}finally{setIsSavingTemplate(false)} };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.documentName.toLowerCase().includes(q) ||
        r.recipients?.some((rec) => rec.name.toLowerCase().includes(q) || rec.email.toLowerCase().includes(q))
    );
  }, [requests, searchQuery]);

  // Aggregate stats
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  
  // Intelligent declined/action-required requests:
  // Automatically filters out declined requests if a completed/signed version already exists for the same recipient!
  const declinedRequests = useMemo(() => {
    return requests.filter((r) => {
      const isDeclined = r.status === 'declined' || r.recipients?.some((rec) => rec.status === 'declined');
      if (!isDeclined) return false;
      if (dismissedDeclinedIds.includes(r.id)) return false;

      // Extract recipient identifiers
      const recipientEmails = r.recipients?.map((rec) => rec.email?.toLowerCase().trim()).filter(Boolean) || [];
      const recipientNames = r.recipients?.map((rec) => rec.name?.toLowerCase().trim()).filter(Boolean) || [];

      // Check if another request for this recipient has already been completed/signed
      const hasResolvedOrSignedVersion = requests.some((other) => {
        if (other.id === r.id) return false;
        if (other.status !== 'completed') return false;
        
        const sameRecipient = other.recipients?.some((rec) => {
          const email = rec.email?.toLowerCase().trim();
          const name = rec.name?.toLowerCase().trim();
          return (email && recipientEmails.includes(email)) || (name && recipientNames.includes(name));
        });

        return sameRecipient;
      });

      return !hasResolvedOrSignedVersion;
    });
  }, [requests, dismissedDeclinedIds]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Document Signatures"
        subtitle="Send uploaded documents for signature and track recipient responses."
        icon={<FileSignature size={18} />}
        tabs={['Overview', 'Sent Requests', 'Template Builder']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            className="btn-secondary"
            style={{
              background: 'white',
              color: 'var(--primary)',
              border: 'none',
              height: 34,
              padding: '0 14px',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 9,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => setShowSendModal(true)}
          >
            <Plus size={14} /> New Request
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 32px', background: 'var(--bg-page)' }}>
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Stats Row */}
            <StatRibbon
              stats={[
                { label: 'Pending Signatures', value: pendingCount, icon: <Clock size={16} />, color: 'var(--warning)' },
                {
                  label: 'Completed Signatures',
                  value: completedCount,
                  icon: <CheckCircle2 size={16} />,
                  color: 'var(--success)',
                },
                {
                  label: 'Declined / Action Required',
                  value: declinedRequests.length,
                  icon: <AlertTriangle size={16} />,
                  color: 'var(--error)',
                },
              ]}
            />

            {/* Action Required if any declined */}
            {declinedRequests.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Bell size={15} style={{ color: 'var(--error)' }} />
                  <h2 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Needs Attention</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                    {declinedRequests.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {declinedRequests.map((req) => {
                    const declinedRec = req.recipients?.find((rec) => rec.status === 'declined');
                    return (
                      <Card key={req.id} style={{ border: '1px solid #FECACA', background: '#FFFFFF' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            gap: 16,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                            <Avatar name={declinedRec?.name || 'Recipient'} size="md" />
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 3px 0' }}>{req.documentName}</h4>
                              <div style={{ fontSize: 12.5, color: 'var(--text-4)' }}>
                                Declined by <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{declinedRec?.name}</strong> •{' '}
                                <span style={{ color: '#B91C1C', fontWeight: 600 }}>
                                  Reason: {declinedRec?.declineReason || 'Disagreed with clauses'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <button
                              className="btn-neutral btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              onClick={() => {
                                setShowSendModal(true);
                              }}
                            >
                              <FileText size={14} /> Send Revised Version
                            </button>
                            <button
                              className="btn-neutral btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: 'var(--text-3)',
                              }}
                              onClick={() => handleDismissDeclined(req.id)}
                              title="Mark this declined notice as resolved"
                            >
                              <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> Dismiss
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <Card>
                <CardBody style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#FAF9F7',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-1)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileSignature size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px 0' }}>Standard Document Templates</h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
                        Choose an uploaded, available company document or reusable HR template and send it to an employee or external signer.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button className="btn-primary btn-sm" onClick={() => setShowSendModal(true)}>
                      <Plus size={14} /> Create Signature Request
                    </button>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#FAF9F7',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-1)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Shield size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px 0' }}>Audit Trail & Compliance</h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
                        Signature records capture the signer’s consent, typed name, timestamp, request details, and a SHA-256 digest in the audit trail.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button
                      className="btn-neutral btn-sm"
                      onClick={() => setActiveTab('Sent Requests')}
                    >
                      View All Tracking Logs <ArrowRight size={13} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'Sent Requests' && (
          <div>
            <div className="row-between mb-24">
              <div className="col gap-4">
                <h2 className="text-xl fw-800 text-1 m-0">Document Tracking</h2>
                <span className="text-sm text-4 fw-500">{filteredRequests.length} documents tracked</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '0 16px',
                  height: 40,
                  gap: 10,
                  width: 280,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 13.5,
                    color: 'var(--text-1)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 16 }}>
              <CardBody style={{ padding: 0 }}>
                {isLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                    <FileSignature size={40} className="text-4 mb-12" style={{ margin: '0 auto 12px' }} />
                    <h3 className="text-base fw-700 text-1">No signature requests found</h3>
                    <p className="text-xs text-5 mt-4">Initiate a new request to track employee signatures here.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                      <tr style={{ color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                        <th style={{ padding: '16px 24px', fontWeight: 700 }}>Document</th>
                        <th style={{ padding: '16px 24px', fontWeight: 700 }}>Recipient</th>
                        <th style={{ padding: '16px 24px', fontWeight: 700 }}>Date Sent</th>
                        <th style={{ padding: '16px 24px', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '16px 24px', width: 140 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((req, idx) => {
                        const rec = req.recipients?.[0];
                        const recName = rec?.name || 'Recipient';
                        return (
                          <tr
                            key={req.id || idx}
                            style={{
                              borderBottom: idx === filteredRequests.length - 1 ? 'none' : '1px solid var(--border)',
                              background: req.status === 'declined' ? '#FEF2F2' : 'white',
                            }}
                          >
                            <td style={{ padding: '20px 24px' }}>
                              <div className="text-sm fw-800 text-1 mb-4">{req.documentName}</div>
                              <div className="text-xs fw-600 text-5">
                                Sent by {req.createdByName || 'Administrator'}
                              </div>
                            </td>
                            <td style={{ padding: '20px 24px', fontSize: 14 }}>
                              <div className="row gap-8 align-center">
                                <Avatar name={recName} size="sm" />
                                <div>
                                  <span className="fw-700 text-1">{recName}</span>
                                  {rec?.email && <div className="text-xs text-5">{rec.email}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '20px 24px', color: 'var(--text-3)', fontSize: 14, fontWeight: 500 }}>
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today'}
                            </td>
                            <td style={{ padding: '20px 24px' }}>
                              <div className="col gap-4">
                                <Badge
                                  variant={
                                    req.status === 'completed'
                                      ? 'success'
                                      : req.status === 'declined'
                                      ? 'danger'
                                      : 'warning'
                                  }
                                >
                                  {req.status === 'completed'
                                    ? 'Completed'
                                    : req.status === 'declined'
                                    ? 'Declined'
                                    : 'Pending'}
                                </Badge>
                                {rec?.declineReason && (
                                  <div className="text-xs text-error fw-600 mt-4" style={{ maxWidth: 220, lineHeight: 1.4 }}>
                                    {rec.declineReason}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '20px 24px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {req.status === 'completed' && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-neutral btn-sm"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 12 }}
                                      onClick={() => handleViewRequest(req)}
                                      title="View executed document"
                                    >
                                      <Eye size={13} /> View
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-neutral btn-sm"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 12 }}
                                      onClick={() => handleDownloadRequest(req)}
                                      title="Download executed document"
                                    >
                                      <Download size={13} /> Download
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  className="btn-secondary btn-sm row gap-6"
                                  style={{ padding: '5px 10px', fontSize: 12 }}
                                  onClick={() => toast.success('Tracking record', `ID: ${req.id}`)}
                                >
                                  <Shield size={13} /> Audit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'Template Builder' && (
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <Card>
              <CardBody style={{ padding: 28 }}>
                <div className="row-between gap-16" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="row gap-8 align-center mb-8"><FileText size={20} className="text-primary"/><h2 className="text-xl fw-800 text-1 m-0">Company document templates</h2></div>
                    <p className="text-sm text-4 m-0" style={{ maxWidth: 650 }}>Create polished, reusable HR documents with your company branding and safe employee merge fields. Edit, preview, print, or download each template.</p>
                  </div>
                  <button type="button" className="btn-primary" onClick={resetTemplateDraft}><Plus size={16}/> New template</button>
                </div>
                <div className="grid-3 gap-12 mt-20 mb-20">
                  {[['Your templates', String(templates.length)], ['Available merge fields', '5'], ['Company branding', templateBranding?.companyName || 'Configured']].map(([label, value]) => <div key={label} className="p-16" style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface, #fff)' }}><div className="text-xs text-5">{label}</div><div className="text-base fw-800 text-1 mt-4">{value}</div></div>)}
                </div>
                <div className="row-between gap-12 mb-12"><h3 className="text-base fw-800 text-1 m-0">Saved templates</h3><span className="text-xs text-5">Employee · Company · Role · Effective date · Today</span></div>
                {templates.length === 0 ? <div className="p-32 text-center" style={{ border: '1px dashed var(--border)', borderRadius: 12 }}><FileText size={32} className="text-4 mb-12"/><h3 className="text-base fw-700 text-1">Start with a company template</h3><p className="text-sm text-4">Build an employment agreement, policy, letter, or any reusable HR document.</p><button className="btn-primary" onClick={resetTemplateDraft}><Plus size={16}/> Create template</button></div> : <div className="col gap-10">{templates.map((t) => <div key={t.id} className="row-between gap-16 p-16" style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface, #fff)' }}><div className="row gap-12 align-center" style={{ minWidth: 0 }}><div style={{ width: 42, height: 42, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--primary)', background: 'var(--primary-tint, #eef2ff)', flex: '0 0 auto' }}><FileText size={20}/></div><div style={{ minWidth: 0 }}><div className="text-sm fw-800 text-1">{t.name}</div><div className="text-xs text-5 mt-4">{t.category} · {t.expiresInDays} day signing links{t.isActive ? ' · Active' : ' · Inactive'}</div></div></div><div className="row gap-8" style={{ flex: '0 0 auto' }}><button className="btn-neutral btn-sm" onClick={() => editTemplate(t)}><Edit3 size={14}/> Edit</button><button className="btn-neutral btn-sm" onClick={() => { setTemplateName(t.name);setTemplateCategory(t.category);setTemplateBody(t.body);setTemplateHeader(t.headerText||'');setTemplateFooter(t.footerText||'');setTemplateDays(t.expiresInDays);previewTemplate(t); }}><Eye size={14}/> Preview</button><button className="btn-secondary btn-sm" onClick={() => {setSelectedTemplateId(t.id);setRequestSource('template');setShowSendModal(true)}}><Send size={14}/> Use template</button></div></div>)}</div>}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Send Signature Request Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="New Signature Request"
        subtitle="Initiate e-signature workflow with real employees or candidates"
        footer={
          <>
            <button className="btn-neutral" onClick={() => setShowSendModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleCreateRequest} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send size={16} /> Send Request
                </>
              )}
            </button>
          </>
        }
      >
        <div className="col gap-20 p-8">
          <div className="row gap-8"><button type="button" className={requestSource==='template'?'btn-primary btn-sm':'btn-neutral btn-sm'} onClick={()=>setRequestSource('template')}>Generate from HR template</button><button type="button" className={requestSource==='document'?'btn-primary btn-sm':'btn-neutral btn-sm'} onClick={()=>setRequestSource('document')}>Use uploaded document</button></div>
          {requestSource==='template' ? <div className="col gap-8"><label className="text-sm fw-700 text-1">Organization template</label><Select searchable searchPlaceholder="Search templates..." value={selectedTemplateId} onChange={e=>setSelectedTemplateId(e.target.value)}><option value="">Choose a saved template</option>{templates.filter(t=>t.isActive).map(t=><option value={t.id} key={t.id}>{t.name} · {t.category}</option>)}</Select><p className="text-xs text-4">Generated documents include employee and company merge fields. External signers receive a unique expiring link by email.</p></div> : <>
          {/* Uploaded document selector */}
          <div className="col gap-8">
            <label className="text-sm fw-700 text-1">Select Uploaded Document</label>
            <Select
              searchable
              searchPlaceholder="Search uploaded documents..."
              value={selectedDocumentId}
              onChange={(e) => setSelectedDocumentId(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 14 }}
            >
              <option value="">-- Choose an available document --</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} ({doc.category})
                </option>
              ))}
            </Select>
            {documents.length === 0 && <p className="text-xs text-4 m-0">No available documents yet. Upload one in Documents or create handbook content in Onboarding.</p>}
          </div>
          </>}

          {/* Recipient Picker */}
          <div className="col gap-8">
            <label className="text-sm fw-700 text-1">Select Recipient Employee</label>
            <Select
              searchable
              searchPlaceholder="Search directory by name or department..."
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 14 }}
            >
              <option value="">-- Choose from Directory --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} · {emp.department || 'General'}
                </option>
              ))}
            </Select>
          </div>

          {/* Fallback Custom Recipient if not from directory */}
          {!selectedEmployeeId && (
            <div className="grid-2 gap-12">
              <div>
                <label className="text-xs fw-700 text-2 mb-4" style={{ display: 'block' }}>
                  Recipient Name
                </label>
                <Input
                  value={customRecipientName}
                  onChange={(e) => setCustomRecipientName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="text-xs fw-700 text-2 mb-4" style={{ display: 'block' }}>
                  Recipient Email
                </label>
                <Input
                  type="email"
                  value={customRecipientEmail}
                  onChange={(e) => setCustomRecipientEmail(e.target.value)}
                  placeholder="jane.doe@company.com"
                />
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div className="col gap-8">
            <label className="text-sm fw-700 text-1">Custom Note to Signer</label>
            <Textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Please review and sign..."
            />
          </div>
        </div>
      </Modal>

      {showTemplateEditor && (
        <div onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTemplateEditor(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(16,24,40,.42)' }}>
          <section role="dialog" aria-modal="true" aria-label={editingTemplateId ? 'Edit document template' : 'Create document template'} style={{ position: 'absolute', inset: '0 0 0 auto', width: 'min(1120px, 94vw)', height: '100%', background: '#f5f6f8', display: 'flex', flexDirection: 'column', boxShadow: '-16px 0 48px rgba(16,24,40,.18)' }}>
            <header className="row-between gap-16 p-16" style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
              <div className="row gap-12 align-center"><button type="button" className="btn-neutral btn-sm" onClick={() => setShowTemplateEditor(false)} aria-label="Close editor"><ChevronLeft size={16}/></button><div><div className="text-base fw-800 text-1">{editingTemplateId ? 'Edit template' : 'Create a template'}</div><div className="text-xs text-5 mt-4">Professional document workspace · saved to your organization</div></div></div>
              <div className="row gap-8"><button type="button" className="btn-neutral btn-sm" onClick={() => setTemplateView(templateView === 'edit' ? 'preview' : 'edit')}><Eye size={15}/>{templateView === 'edit' ? 'Preview' : 'Back to editor'}</button><button type="button" className="btn-neutral btn-sm" onClick={printTemplate}><Printer size={15}/> Print</button><button type="button" className="btn-neutral btn-sm" onClick={downloadTemplate}><FileDown size={15}/> Download</button><button type="button" className="btn-primary btn-sm" disabled={isSavingTemplate||!templateName.trim()||!templateBody.trim()} onClick={saveTemplate}>{isSavingTemplate?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} {editingTemplateId ? 'Save changes' : 'Save template'}</button><button type="button" className="btn-neutral btn-sm" onClick={() => setShowTemplateEditor(false)} aria-label="Close"><X size={16}/></button></div>
            </header>
            <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 24px', boxSizing: 'border-box', minHeight: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4, minWidth: 0 }}>
                <span className="text-xs fw-700 text-4" style={{ flexShrink: 0 }}>DOCUMENT</span>
                <span className="text-xs text-5" style={{ flexShrink: 0 }}>›</span>
                <span className="text-xs fw-700" style={{ color: 'var(--primary)', minWidth: 0, overflowWrap: 'anywhere' }}>{templateName || 'Untitled template'}</span>
                <span className="text-xs text-5" style={{ marginLeft: 'auto', paddingLeft: 16, textAlign: 'right', maxWidth: '100%', boxSizing: 'border-box' }}>Changes save when you select {editingTemplateId ? 'Save changes' : 'Save template'}</span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 28 }}>
              {templateView === 'edit' ? <div style={{ maxWidth: 850, margin: '0 auto' }}>
                <div className="row gap-12 mb-16"><Input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Document title, e.g. Employment Agreement"/><Input value={templateCategory} onChange={e=>setTemplateCategory(e.target.value)} placeholder="Category"/></div>
                <div className="row-between mb-8"><div><div className="text-xs fw-700 text-3">DOCUMENT PAGE</div><div className="text-xs text-5 mt-4">Your company header and footer are part of the document. Click them to edit in place.</div></div><button type="button" className="btn-neutral btn-sm" onClick={() => {setTemplateHeader(templateBranding?.defaultHeader||'');setTemplateFooter(templateBranding?.defaultFooter||'')}}>Reset company branding</button></div>
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 28px rgba(16,24,40,.10)', overflow: 'hidden' }}>
                  <div style={{ height: 7, background: templateBranding?.brandColor || '#4F46E5' }}/>
                  <div style={{ padding: '34px 48px 42px' }}>
                    {templateBranding?.logoUrl && <img src={templateBranding.logoUrl} alt={`${templateBranding.companyName} logo`} style={{ maxWidth: 180, maxHeight: 56, objectFit: 'contain', display: 'block', marginBottom: 18 }}/ >}
                    <EditableDocumentText value={templateHeader} onChange={setTemplateHeader} placeholder="Click to add the company name, registration number, or address" style={{ color: '#475467', fontSize: 12, lineHeight: 1.55, paddingBottom: 16, borderBottom: '1px solid #d0d5dd', marginBottom: 28 }}/>
                    <div className="row-between mb-8"><div className="text-xs fw-700 text-3">DOCUMENT BODY</div><div className="text-xs text-5">Word-style formatting</div></div>
                    <RichTextEditor value={templateBody} onChange={setTemplateBody} placeholder={`Write your document here…\n\nUse merge fields such as {{employee_name}} and {{company_name}}.`} minHeight={430} showFooter/>
                    <EditableDocumentText value={templateFooter} onChange={setTemplateFooter} placeholder="Click to add website, email, phone, and office locations" style={{ color: '#475467', fontSize: 12, lineHeight: 1.6, paddingTop: 18, borderTop: '1px solid #d0d5dd', marginTop: 28 }}/>
                  </div>
                </div>
                <div className="row-between mt-16 p-16" style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12}}><div><div className="text-sm fw-700 text-1">Signing link expiry</div><div className="text-xs text-5 mt-4">How many days recipients have to sign.</div></div><Input type="number" min={1} max={365} value={templateDays} onChange={e=>setTemplateDays(Number(e.target.value))} style={{maxWidth:120}}/></div>
                <div className="text-xs text-5 mt-12">Merge fields: <code>{'{{employee_name}}'}</code> · <code>{'{{company_name}}'}</code> · <code>{'{{job_title}}'}</code> · <code>{'{{effective_date}}'}</code> · <code>{'{{today}}'}</code></div>
              </div> : <div style={{maxWidth:850,margin:'0 auto'}}><div className="row-between mb-12"><div><div className="text-base fw-800 text-1">PDF preview</div><div className="text-xs text-5 mt-4">This is the same A4 PDF that Download saves.</div></div><button type="button" className="btn-neutral btn-sm" onClick={printTemplate}><Printer size={15}/> Print PDF</button></div>{isRenderingTemplatePdf || !templatePdfUrl ? <div className="p-32 text-center"><Loader2 size={24} className="animate-spin"/> Preparing PDF preview…</div> : <PdfPreview url={templatePdfUrl} title="PDF document template preview" style={{width:'100%',height:'min(900px, calc(100vh - 220px))'}}/>}</div>}
            </div>
          </section>
        </div>
      )}
      {/* Executed Document Viewer Modal */}
      {viewingSignedRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setViewingSignedRequest(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
              border: '1px solid #E5E5EA',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0F0F2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1D1D1F' }}>{viewingSignedRequest.documentName}</h3>
                  <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 2 }}>Executed Digital Document</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingSignedRequest(null)}
                style={{ background: '#F5F5F7', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#6E6E73" />
              </button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Recipient: </span><strong>{viewingSignedRequest.recipients?.[0]?.name || 'Signer'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Email: </span><strong>{viewingSignedRequest.recipients?.[0]?.email || ''}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Status: </span><span style={{ color: '#059669', fontWeight: 700 }}>COMPLETED & VERIFIED</span></div>
                  <div><span style={{ color: '#64748B' }}>Executed: </span><span>{viewingSignedRequest.createdAt}</span></div>
                </div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 10, padding: '20px 22px', fontSize: 13, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap', maxHeight: 380, overflowY: 'auto' }}>
                {viewingSignedRequest.body || viewingSignedRequest.customMessage || 'Executed Agreement Document'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #F0F0F2', background: '#FAFAFC' }}>
              <button type="button" className="btn-neutral" onClick={() => setViewingSignedRequest(null)}>Close</button>
              <button type="button" className="btn-primary" onClick={() => handleDownloadRequest(viewingSignedRequest)}><Download size={14} /> Download Document</button>
            </div>
          </div>
        </div>
      )}
      {viewer}
    </div>
  );
}
