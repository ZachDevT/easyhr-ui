"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  department?: string;
  jobTitle?: string;
}

const TEMPLATES = [
  { id: 'tpl_offer', name: 'Standard Offer Letter', category: 'Onboarding' },
  { id: 'tpl_handbook', name: 'Employee Handbook Acknowledgement', category: 'Policy' },
  { id: 'tpl_deposit', name: 'Direct Deposit Authorization Form', category: 'Finance' },
  { id: 'tpl_nda', name: 'Confidentiality and IP Agreement (NDA)', category: 'Legal' },
];

export default function SignaturesAdminPage() {
  const { getToken, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showSendModal, setShowSendModal] = useState(false);
  const [requestType, setRequestType] = useState<'template' | 'upload'>('template');
  const [searchQuery, setSearchQuery] = useState('');

  // Live state
  const [requests, setRequests] = useState<SignatureRequestItem[]>([]);
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Request Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [customDocName, setCustomDocName] = useState(TEMPLATES[0].name);
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

      const [reqRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/signatures`, { headers: getAuthHeaders(token) }),
        fetch(`${API_BASE_URL}/api/v1/employees`, { headers: getAuthHeaders(token) }),
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
    } catch (err) {
      console.error('Failed to load signatures data', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update doc name on template select
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = TEMPLATES.find((t) => t.id === tplId);
    if (found) {
      setCustomDocName(found.name);
    }
  };

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
          recEmail = emp.email || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@easyhr.internal`;
        }
      }

      if (!recName.trim() || !recEmail.trim()) {
        toast.error('Recipient required', 'Please select an employee or enter recipient contact details.');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/signatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          documentName: customDocName.trim(),
          customMessage: customMessage.trim(),
          recipients: [
            {
              name: recName,
              email: recEmail,
              employeeId: empId || undefined,
            },
          ],
        }),
      });

      if (res.ok) {
        toast.success('Signature Request Sent', `Sent "${customDocName}" to ${recName}.`);
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
        subtitle="Manage legally binding e-signatures, initiate requests from templates, and track execution statuses."
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
                              setSelectedTemplateId(TEMPLATES[0].id);
                              setCustomDocName(req.documentName);
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
                    Send pre-approved employment offers, handbook policies, and tax deposit forms to candidates or existing staff.
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
                    All signatures are tamper-sealed with SHA-256 cryptographic hashes and full ESIGN audit certificates.
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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: 800,
                background: 'white',
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                padding: 48,
                position: 'relative',
              }}
            >
              <div className="row-between mb-32 pb-24 border-b border-border">
                <div className="row gap-12 align-center">
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'var(--primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    EH
                  </div>
                  <div>
                    <h3 className="text-base fw-800 text-1 m-0">Standard Employment Offer Template</h3>
                    <div className="text-xs text-5 mt-2">Built-in Token Merging Enabled</div>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl fw-800 text-1 text-center mb-32">OFFER OF EMPLOYMENT</h1>

              <div className="text-sm text-1" style={{ lineHeight: 1.8 }}>
                <p>
                  Dear{' '}
                  <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>
                    [Candidate Name]
                  </span>
                  ,
                </p>
                <p>
                  We are delighted to offer you the position of{' '}
                  <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>
                    [Job Title]
                  </span>{' '}
                  at EasyHR. We believe your background and experience are an outstanding fit for our organization.
                </p>
                <p>
                  In this position, you will report to{' '}
                  <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>
                    [Manager Name]
                  </span>
                  . Your base compensation will be established at competitive market benchmark rates.
                </p>
              </div>

              <div className="grid-2 gap-40 mt-48">
                <div className="col gap-12">
                  <div className="text-sm fw-700 text-1">For EasyHR Inc.</div>
                  <div style={{ height: 48, borderBottom: '1px solid var(--border)' }} />
                  <div className="text-xs text-5">Authorized Corporate Officer</div>
                </div>
                <div className="col gap-12">
                  <div className="text-sm fw-700 text-1">Candidate Acceptance</div>
                  <div
                    style={{
                      height: 48,
                      borderBottom: '2px dashed var(--primary)',
                      background: 'var(--primary-tint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="text-sm text-primary fw-700">Digital Signature Anchor</span>
                  </div>
                </div>
              </div>
            </div>
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
          {/* Template Selector */}
          <div className="col gap-8">
            <label className="text-sm fw-700 text-1">Select Document Template</label>
            <Select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ padding: '10px 14px', fontSize: 14 }}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </Select>
          </div>

          {/* Document Title */}
          <div className="col gap-8">
            <label className="text-sm fw-700 text-1">Document Name</label>
            <Input
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
              placeholder="e.g. Standard Offer Letter - Frontend Engineer"
            />
          </div>

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
