"use client";

import { useState } from 'react';
import { FileSignature, CheckCircle2, Clock, Search, FileText, Download, Shield, Mail, ArrowRight, Plus, Users, Send, Bell, X, UploadCloud, Edit3, XCircle, LayoutTemplate, Layers, AlertTriangle, Type } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatRibbon } from '@/components/ui/StatRibbon';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const SENT_REQUESTS = [
  { id: 1, docName: 'Offer Letter - Senior Developer', recipient: 'Alex Johnson', dateSent: 'Sep 24, 2026', status: 'Pending', expires: 'In 2 days', type: 'Generated from Template' },
  { id: 2, docName: 'Employee Handbook Acknowledgement', recipient: 'Maria Garcia', dateSent: 'Sep 22, 2026', status: 'Refused', expires: 'Overdue', reason: 'Disagreed with non-compete clause in section 4.', type: 'Generated from Template' },
  { id: 3, docName: 'Direct Deposit Authorization', recipient: 'Wei Chen', dateSent: 'Sep 20, 2026', status: 'Completed', expires: '-', type: 'Uploaded PDF' },
  { id: 4, docName: 'Confidentiality Agreement', recipient: 'Jessica Smith', dateSent: 'Sep 18, 2026', status: 'Completed', expires: '-', type: 'Generated from Template' },
];

const TEMPLATES = [
  { id: 1, name: 'Standard Offer Letter', category: 'Onboarding', uses: 124 },
  { id: 2, name: 'Employee Handbook 2026', category: 'Policy', uses: 56 },
  { id: 3, name: 'Direct Deposit Form', category: 'Finance', uses: 89 },
];

export default function SignaturesAdminPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showSendModal, setShowSendModal] = useState(false);
  const [requestType, setRequestType] = useState('template'); // 'template' | 'upload'
  const [builderStep, setBuilderStep] = useState(1);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      
      <PageHeader 
        title="Document Signatures"
        subtitle="Manage e-signatures, create templates, and track document workflows."
        icon={<FileSignature size={28} className="text-white" />}
        tabs={['Overview', 'Sent Requests', 'Template Builder']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }} onClick={() => setShowSendModal(true)}>
            <Plus size={16} style={{ marginRight: 8 }}/> New Request
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--bg-page)' }}>
        
        {activeTab === 'Overview' && (
          <div className="col gap-32">
            
            {/* Stats Row */}
            <StatRibbon 
              stats={[
                { label: 'Pending Signatures', value: 12, icon: <Clock size={18}/>, color: 'var(--warning)' },
                { label: 'Completed This Month', value: 45, icon: <CheckCircle2 size={18}/>, color: 'var(--success)' },
                { label: 'Refused / Overdue', value: 3, icon: <AlertTriangle size={18}/>, color: 'var(--error)' }
              ]}
            />

            {/* Action Required */}
            <div>
              <h2 className="text-lg fw-700 text-1 mb-16 row gap-12">
                <Bell size={20} className="text-error" /> Needs Attention
              </h2>
              <Card style={{ border: '1px solid var(--error-tint)' }}>
                <CardBody className="row-between align-center p-20">
                  <div className="row gap-16">
                    <Avatar name="Maria Garcia" size="md" />
                    <div>
                      <h4 className="text-base fw-700 text-1 m-0 mb-4">Employee Handbook Acknowledgement</h4>
                      <div className="text-sm text-5">Refused by Maria Garcia • <span className="text-error fw-600">Reason: Disagreed with non-compete clause in section 4.</span></div>
                    </div>
                  </div>
                  <div className="row gap-12">
                    <button className="btn-secondary row gap-8"><FileText size={16}/> Send Alternative</button>
                    <button className="btn-primary row gap-8" style={{ background: 'var(--error)' }}><Mail size={16}/> Follow Up</button>
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
                <span className="text-sm text-4 fw-500">{SENT_REQUESTS.length} documents</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '0 16px', height: 40, gap: 10, width: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Search size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search tracking..."
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-1)', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            
            <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: 16 }}>
              <CardBody style={{ padding: 0 }}>
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
                    {SENT_REQUESTS.map((req, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === SENT_REQUESTS.length - 1 ? 'none' : '1px solid var(--border)', background: req.status === 'Refused' ? '#FEF2F2' : 'white' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <div className="text-sm fw-800 text-1 mb-4">{req.docName}</div>
                          <div className="text-xs fw-600 text-5">{req.type}</div>
                        </td>
                        <td style={{ padding: '20px 24px', fontSize: 14 }}>
                          <div className="row gap-8 align-center">
                            <Avatar name={req.recipient} size="sm" />
                            <span className="fw-700 text-1">{req.recipient}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', color: 'var(--text-3)', fontSize: 14, fontWeight: 500 }}>{req.dateSent}</td>
                        <td style={{ padding: '20px 24px' }}>
                          <div className="col gap-4">
                            <Badge variant={req.status === 'Completed' ? 'success' : req.status === 'Refused' ? 'danger' : 'warning'}>{req.status}</Badge>
                            {req.status === 'Refused' && (
                              <div className="text-xs text-error fw-600 mt-4" style={{ maxWidth: 200, lineHeight: 1.4 }}>{req.reason}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                          {req.status === 'Completed' ? (
                            <button className="btn-secondary row gap-6" style={{ padding: '6px 12px', fontSize: 13 }}><Download size={14}/> Download</button>
                          ) : req.status === 'Refused' ? (
                            <button className="btn-primary row gap-6" style={{ padding: '6px 12px', fontSize: 13, background: 'var(--error)' }}><Mail size={14}/> Follow up</button>
                          ) : (
                            <button className="btn-neutral text-primary fw-700" style={{ padding: '6px 12px', fontSize: 13 }}>Remind</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'Template Builder' && (
          <div className="row gap-24 h-full" style={{ minHeight: 700 }}>
            {/* Sidebar Tools */}
            <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="text-sm fw-800 text-1 uppercase tracking-wider mb-8">Builder Blocks</div>
              
              {[
                { icon: <LayoutTemplate size={18}/>, name: 'Header / Company Logo' },
                { icon: <Type size={18}/>, name: 'Text Block' },
                { icon: <Users size={18}/>, name: 'Dynamic Field (Employee)' },
                { icon: <FileSignature size={18}/>, name: 'Signature Box' },
                { icon: <Layers size={18}/>, name: 'Footer / Pagination' },
              ].map((block, i) => (
                <div key={i} className="row gap-12 align-center p-16" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', cursor: 'grab', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div className="text-primary">{block.icon}</div>
                  <span className="text-sm fw-700 text-1">{block.name}</span>
                </div>
              ))}

              <div className="mt-24 text-sm fw-800 text-1 uppercase tracking-wider mb-8">Saved Templates</div>
              <div className="col gap-12">
                {TEMPLATES.map(t => (
                  <div key={t.id} className="row-between align-center p-12 hover-bg-subtle" style={{ borderRadius: 8, cursor: 'pointer', border: '1px solid transparent' }}>
                    <div className="row gap-8 align-center">
                      <FileText size={16} className="text-5" />
                      <span className="text-sm fw-600 text-1">{t.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Canvas */}
            <div style={{ flex: 1, background: '#E5E7EB', borderRadius: 16, padding: 40, display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ width: 850, background: 'white', minHeight: 1100, boxShadow: '0 12px 40px rgba(0,0,0,0.1)', padding: '60px 80px', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header Mock */}
                <div className="row-between align-start mb-48" style={{ borderBottom: '2px solid var(--primary)', paddingBottom: 24 }}>
                  <div className="row gap-12 align-center">
                    <div style={{ width: 40, height: 40, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 20, fontWeight: 800 }}>E</div>
                    <span className="text-2xl fw-800 text-1">EasyHR Inc.</span>
                  </div>
                  <div className="text-right text-sm text-5" style={{ lineHeight: 1.6 }}>
                    123 Innovation Drive<br/>
                    San Francisco, CA 94105<br/>
                    hr@easyhr.com
                  </div>
                </div>

                {/* Body Mock */}
                <h1 className="text-2xl fw-800 text-1 text-center mb-40">OFFER OF EMPLOYMENT</h1>
                
                <div className="text-base text-1" style={{ lineHeight: 1.8 }}>
                  <p>Dear <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>[Candidate Name]</span>,</p>
                  <p>We are delighted to offer you the position of <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>[Job Title]</span> at EasyHR Inc. We believe your skills and experience are an excellent match for our company.</p>
                  <p>In this position, you will report to <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>[Manager Name]</span>. Your starting base salary will be <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>[Salary]</span> per year, paid on a semi-monthly basis.</p>
                  <p>If you accept this offer, your start date will be <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>[Start Date]</span>.</p>
                </div>

                <div style={{ flex: 1 }}></div>

                {/* Signatures Mock */}
                <div className="grid-2 gap-40 mt-48">
                  <div className="col gap-12">
                    <div className="text-sm fw-700 text-1">For EasyHR Inc.</div>
                    <div style={{ height: 60, borderBottom: '1px solid var(--border)' }}></div>
                    <div className="text-xs text-5">Authorized Signature</div>
                  </div>
                  <div className="col gap-12">
                    <div className="text-sm fw-700 text-1">Accepted by: <span style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E', fontWeight: 700 }}>[Candidate Name]</span></div>
                    <div style={{ height: 60, borderBottom: '2px dashed var(--primary)', background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="text-sm text-primary fw-700">Signature Block</span>
                    </div>
                    <div className="row-between text-xs text-5">
                      <span>Signature</span>
                      <span>Date</span>
                    </div>
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
        subtitle="Generate from a template or upload a custom file."
      >
        <div className="col h-100" style={{ padding: '32px' }}>
          
          <div className="p-24 col gap-24 flex-1">
            
            {/* Type Switcher */}
            <div className="row p-4" style={{ background: '#F3F4F6', borderRadius: 12 }}>
              <button 
                onClick={() => setRequestType('template')}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: requestType === 'template' ? 'white' : 'transparent', fontWeight: 700, color: requestType === 'template' ? 'var(--text-1)' : 'var(--text-4)', boxShadow: requestType === 'template' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}
              >
                Generate from Template
              </button>
              <button 
                onClick={() => setRequestType('upload')}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: requestType === 'upload' ? 'white' : 'transparent', fontWeight: 700, color: requestType === 'upload' ? 'var(--text-1)' : 'var(--text-4)', boxShadow: requestType === 'upload' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}
              >
                Upload Custom File
              </button>
            </div>

            {requestType === 'template' ? (
              <div className="col gap-8">
                <label className="text-sm fw-700 text-1">Select Template</label>
                <Select style={{ padding: '12px 16px', fontSize: 15 }}>
                  <option>Standard Offer Letter</option>
                  <option>Employee Handbook 2026</option>
                  <option>Direct Deposit Form</option>
                </Select>
              </div>
            ) : (
              <div className="col gap-8">
                <label className="text-sm fw-700 text-1">Upload PDF</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', background: '#F9FAFB', cursor: 'pointer' }}>
                  <UploadCloud size={32} className="text-4 mb-12 mx-auto" />
                  <div className="text-sm fw-700 text-1 mb-4">Click to upload or drag and drop</div>
                  <div className="text-xs text-5">PDF, DOCX up to 10MB</div>
                </div>
              </div>
            )}
            
            <div className="col gap-8">
              <label className="text-sm fw-700 text-1">Recipients (One or Multiple)</label>
              <Input 
                type="text" 
                placeholder="Search employees or type emails..." 
                leftIcon={<Search size={16} />} 
                style={{ padding: '12px 16px', paddingLeft: '40px', fontSize: 15 }} 
              />
              <div className="row gap-8 mt-8">
                <Badge variant="primary" className="row gap-4 align-center">Alex Johnson <X size={12}/></Badge>
                <Badge variant="neutral" className="row gap-4 align-center text-5">Maria Garcia <X size={12}/></Badge>
              </div>
            </div>
            
            <div className="col gap-8">
              <label className="text-sm fw-700 text-1">Custom Message (Optional)</label>
              <Textarea rows={3} placeholder="Please review and sign..." style={{ padding: '12px 16px', resize: 'none', fontSize: 15 }} />
            </div>
          </div>
          
          <div className="row-end align-center pt-24 border-t border-border mt-auto">
            <div className="row gap-12">
              <button className="btn-neutral fw-700" onClick={() => setShowSendModal(false)}>Cancel</button>
              <button className="btn-primary row gap-8" style={{ padding: '10px 24px', borderRadius: 8, fontWeight: 700 }}>
                <Send size={16}/> Send Request
              </button>
            </div>
          </div>
          
        </div>
      </Modal>

    </div>
  );
}
