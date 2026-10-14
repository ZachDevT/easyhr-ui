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

  const saveTemplate = async () => { setIsSavingTemplate(true); try { const token=await getToken(); if(!token)throw new Error('Not authenticated'); const res=await fetch(`${API_BASE_URL}/api/v1/signatures/templates${editingTemplateId?`/${editingTemplateId}`:''}`,{method:editingTemplateId?'PUT':'POST',headers:{...getAuthHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({name:templateName,category:templateCategory,body:templateBody,headerText:templateHeader,footerText:templateFooter,expiresInDays:templateDays})}); if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.detail||'Could not save template')}toast.success('Template saved','Your organization template is ready to use.');setTemplateName('');setTemplateBody('');setEditingTemplateId('');await loadData();}catch(e){toast.error('Template not saved',e instanceof Error?e.message:'Could not save template')}finally{setIsSavingTemplate(false)} };

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
  const declinedRequests = requests.filter((r) => r.status === 'declined' || r.recipients?.some((rec) => rec.status === 'declined'));

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <PageHeader
        title="Document Signatures"
        subtitle="Send uploaded documents for signature and track recipient responses."
        icon={<FileSignature size={28} className="text-white" />}
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
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 20,
            }}
            onClick={() => setShowSendModal(true)}
          >
            <Plus size={16} style={{ marginRight: 8 }} /> New Request
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--bg-page)' }}>
        {activeTab === 'Overview' && (
          <div className="col gap-32">
            {/* Stats Row */}
            <StatRibbon
              stats={[
                { label: 'Pending Signatures', value: pendingCount, icon: <Clock size={18} />, color: 'var(--warning)' },
                {
                  label: 'Completed Signatures',
                  value: completedCount,
                  icon: <CheckCircle2 size={18} />,
                  color: 'var(--success)',
                },
                {
                  label: 'Declined / Action Required',
                  value: declinedRequests.length,
                  icon: <AlertTriangle size={18} />,
                  color: 'var(--error)',
                },
              ]}
            />

            {/* Action Required if any declined */}
            {declinedRequests.length > 0 && (
              <div>
                <h2 className="text-lg fw-700 text-1 mb-16 row gap-12 align-center">
                  <Bell size={20} className="text-error" /> Needs Attention
                </h2>
                {declinedRequests.map((req) => {
                  const declinedRec = req.recipients?.find((rec) => rec.status === 'declined');
                  return (
                    <Card key={req.id} style={{ border: '1px solid var(--error-tint)', marginBottom: 12 }}>
                      <CardBody className="row-between align-center p-20">
                        <div className="row gap-16 align-center">
                          <Avatar name={declinedRec?.name || 'Recipient'} size="md" />
                          <div>
                            <h4 className="text-base fw-700 text-1 m-0 mb-4">{req.documentName}</h4>
                            <div className="text-sm text-5">
                              Declined by {declinedRec?.name} •{' '}
                              <span className="text-error fw-600">
                                Reason: {declinedRec?.declineReason || 'Disagreed with clauses'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="row gap-12">
                          <button
                            className="btn-secondary row gap-8"
                            onClick={() => {
                              setShowSendModal(true);
                            }}
                          >
                            <FileText size={16} /> Send Revised Version
                          </button>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <Card>
                <CardBody style={{ padding: 24 }}>
                  <div className="icon-chip mb-16" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                    <FileSignature size={24} />
                  </div>
                  <h3 className="text-base fw-700 text-1 mb-8">Standard Document Templates</h3>
                  <p className="text-xs text-4 mb-20">
                    Choose an uploaded, available company document and send it to an employee or external signer.
                  </p>
                  <button className="btn-primary w-full" onClick={() => setShowSendModal(true)}>
                    Create Signature Request
                  </button>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: 24 }}>
                  <div className="icon-chip mb-16" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Shield size={24} />
                  </div>
                  <h3 className="text-base fw-700 text-1 mb-8">Audit Trail & Compliance</h3>
                  <p className="text-xs text-4 mb-20">
                    Signature records capture the signer’s consent, typed name, timestamp, request details, and a SHA-256 digest in the audit trail.
                  </p>
                  <button
                    className="btn-neutral w-full"
                    onClick={() => setActiveTab('Sent Requests')}
                  >
                    View All Tracking Logs
                  </button>
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
                              <button
                                className="btn-secondary btn-sm row gap-6"
                                onClick={() => toast.success('Tracking record', `ID: ${req.id}`)}
                              >
                                <Download size={13} /> Audit
                              </button>
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
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <Card>
              <CardBody style={{ padding: 28 }}>
                <h2 className="text-xl fw-800 text-1 mb-8">Professional document template generator</h2>
                <p className="text-sm text-4 mb-20">Write reusable HR documents with safe merge fields. Available fields: <code>{'{{employee_name}}'}</code>, <code>{'{{company_name}}'}</code>, <code>{'{{job_title}}'}</code>, <code>{'{{effective_date}}'}</code>, <code>{'{{today}}'}</code>.</p>
                <div className="grid-2 gap-12 mb-16"><Input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Template name, e.g. Employment Agreement"/><Input value={templateCategory} onChange={e=>setTemplateCategory(e.target.value)} placeholder="Category"/></div>
                <div className="grid-2 gap-16 mb-16">
                  <div className="col gap-8"><label className="text-sm fw-700 text-1">Editable company header</label><Textarea rows={5} value={templateHeader} onChange={e=>setTemplateHeader(e.target.value)} placeholder="Company name, registration number, office address"/><button type="button" className="btn-neutral btn-sm" style={{alignSelf:'flex-start'}} onClick={()=>{setTemplateHeader(templateBranding?.defaultHeader||'');setTemplateFooter(templateBranding?.defaultFooter||'')}}>Reset to company defaults</button></div>
                  <div className="col gap-8"><label className="text-sm fw-700 text-1">Editable company footer</label><Textarea rows={5} value={templateFooter} onChange={e=>setTemplateFooter(e.target.value)} placeholder="Website, contact email, phone, office locations"/><span className="text-xs text-5">Defaults include active locations, and can be edited for this template.</span></div>
                </div>
                <label className="text-sm fw-700 text-1 mb-8" style={{display:'block'}}>Main document content</label><RichTextEditor value={templateBody} onChange={setTemplateBody} placeholder={'EMPLOYMENT AGREEMENT\n\nThis agreement is between {{company_name}} and {{employee_name}}...'} minHeight={320} showFooter />
                <div className="p-16 mt-12" style={{background:'white',border:'1px solid var(--border)',borderRadius:10}}><div className="text-xs fw-700 text-5 mb-8">BRANDED DOCUMENT PREVIEW</div><div style={{height:5,background:templateBranding?.brandColor||'#4F46E5',borderRadius:4,marginBottom:14}}/>{templateBranding?.logoUrl&&<img src={templateBranding.logoUrl} alt={`${templateBranding.companyName} logo`} style={{maxWidth:180,maxHeight:56,objectFit:'contain',marginBottom:12}}/>}<div className="text-xs text-4 mb-16" style={{whiteSpace:'pre-wrap'}}>{templateHeader.replaceAll('{{company_name}}',templateBranding?.companyName||'Company').replaceAll('{{today}}',new Date().toISOString().slice(0,10))}</div><div className="text-sm text-2" style={{lineHeight:1.7,minHeight:100}}><RichTextRenderer content={templateBody.replaceAll('{{employee_name}}','Alex Morgan').replaceAll('{{company_name}}',templateBranding?.companyName||'Your Company').replaceAll('{{job_title}}','People Operations Specialist').replaceAll('{{effective_date}}','2026-11-01').replaceAll('{{today}}',new Date().toISOString().slice(0,10))||'Your generated document preview will appear here.'}/></div><div className="divider my-12"/><div className="text-xs text-4" style={{whiteSpace:'pre-wrap'}}>{templateFooter.replaceAll('{{company_name}}',templateBranding?.companyName||'Company').replaceAll('{{today}}',new Date().toISOString().slice(0,10))}</div></div>
                <div className="row-between mt-16"><label className="text-sm text-4">Signing link expiry (days) <Input type="number" min={1} max={365} value={templateDays} onChange={e=>setTemplateDays(Number(e.target.value))}/></label><button className="btn-primary" onClick={saveTemplate} disabled={isSavingTemplate||!templateName.trim()||!templateBody.trim()}>{isSavingTemplate?<Loader2 size={16} className="animate-spin"/>:editingTemplateId?'Update reusable template':'Save reusable template'}</button></div>
                <div className="divider my-20"/><h3 className="text-base fw-700 text-1">Organization templates ({templates.length})</h3>
                <div className="col gap-8 mt-12">{templates.map(t=><div key={t.id} className="row-between p-12" style={{border:'1px solid var(--border)',borderRadius:10}}><div><strong>{t.name}</strong><div className="text-xs text-5">{t.category} · expires in {t.expiresInDays} days</div></div><div className="row gap-8"><button className="btn-neutral btn-sm" onClick={()=>{setEditingTemplateId(t.id);setTemplateName(t.name);setTemplateCategory(t.category);setTemplateBody(t.body);setTemplateHeader(t.headerText||'');setTemplateFooter(t.footerText||'');setTemplateDays(t.expiresInDays);window.scrollTo({top:0,behavior:'smooth'})}}>Edit</button><button className="btn-secondary btn-sm" onClick={()=>{setSelectedTemplateId(t.id);setRequestSource('template');setShowSendModal(true)}}>Generate &amp; send</button></div></div>)}</div>
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
          {requestSource==='template' ? <div className="col gap-8"><label className="text-sm fw-700 text-1">Organization template</label><Select value={selectedTemplateId} onChange={e=>setSelectedTemplateId(e.target.value)}><option value="">Choose a saved template</option>{templates.filter(t=>t.isActive).map(t=><option value={t.id} key={t.id}>{t.name} · {t.category}</option>)}</Select><p className="text-xs text-4">Generated documents include employee and company merge fields. External signers receive a unique expiring link by email.</p></div> : <>
          {/* Uploaded document selector */}
          <div className="col gap-8">
            <label className="text-sm fw-700 text-1">Select Uploaded Document</label>
            <Select
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
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 14 }}
            >
              <option value="">-- Choose from Directory --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.department || 'General'})
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
    </div>
  );
}
