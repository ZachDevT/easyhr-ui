"use client";

import { useState } from 'react';
import { FileSignature, Shield, Edit3, Download, ArrowRight, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';

const PENDING_DOCS = [
  { id: 1, title: 'Employee Handbook Acknowledgement', sender: 'David Kim', senderRole: 'VP of HR', date: 'Sep 24, 2026', type: 'Policy', pages: 12 },
  { id: 2, title: 'Direct Deposit Authorization', sender: 'Payroll Dept', senderRole: 'Finance', date: 'Sep 25, 2026', type: 'Finance', pages: 2 },
];

const SIGNED_DOCS = [
  { id: 3, title: 'Offer Letter - Senior Frontend Engineer', sender: 'David Kim', date: 'Sep 1, 2026', type: 'Contract' },
  { id: 4, title: 'Confidentiality and IP Agreement', sender: 'Legal Dept', date: 'Sep 1, 2026', type: 'Legal' },
];

export default function MySignaturesPage() {
  const [activeTab, setActiveTab] = useState('Action Required');
  
  const [signingDoc, setSigningDoc] = useState<any>(null);
  const [signProgress, setSignProgress] = useState(0);

  const handleSignComplete = () => {
    setSignProgress(100);
    setTimeout(() => {
      setSigningDoc(null);
      setSignProgress(0);
    }, 1500);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      
      {/* Full-screen signing experience */}
      {signingDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#F4F4F4', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="row-between p-16" style={{ background: 'white', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div className="row gap-16">
              <button className="btn-circle" style={{ background: 'var(--bg-page)' }} onClick={() => setSigningDoc(null)}>
                <FileText size={16} />
              </button>
              <div>
                <h2 className="text-base fw-700 text-1 m-0">{signingDoc.title}</h2>
                <div className="text-xs text-5 mt-2 row gap-8">
                  <Shield size={12} className="text-success" /> Secure E-Signature
                </div>
              </div>
            </div>
            
            <div className="row gap-16">
              <span className="text-sm text-5">{signProgress === 100 ? 'Signed Successfully!' : '1 of 1 Required Fields'}</span>
              <button className="btn-primary" onClick={handleSignComplete} disabled={signProgress === 100} style={{ background: signProgress === 100 ? 'var(--success)' : 'var(--primary)' }}>
                {signProgress === 100 ? <><CheckCircle2 size={16}/> Document Signed</> : 'Finish & Sign'}
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Document Preview (Left) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 850, minHeight: 1100, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', padding: 80 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <h1 className="text-2xl fw-800 text-1 mb-8" style={{ fontFamily: 'serif' }}>{signingDoc.title}</h1>
                  <p className="text-sm text-5">Effective Date: {signingDoc.date}</p>
                </div>
                
                <div className="text-sm text-1" style={{ lineHeight: 1.8, fontFamily: 'serif' }}>
                  <p className="mb-16">This Employee Handbook Acknowledgement ("Agreement") is made effective as of the date signed below.</p>
                  <p className="mb-16">By signing this document, the employee acknowledges that they have received, read, and understood the EasyHR Employee Handbook. The employee agrees to comply with all policies, rules, and procedures outlined therein.</p>
                  <p className="mb-16">Furthermore, the employee understands that the handbook is not a contract of employment and that employment is strictly on an at-will basis, meaning either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.</p>
                  <br/><br/><br/><br/>
                  
                  <div className="row-between align-end">
                    <div style={{ width: 300 }}>
                      <div className="text-xs text-5 mb-8">Employee Signature</div>
                      <div style={{ 
                        borderBottom: '2px solid var(--border)', 
                        height: 48, 
                        position: 'relative',
                        background: signProgress === 100 ? 'transparent' : 'rgba(162, 56, 255, 0.1)'
                      }}>
                        {signProgress === 100 ? (
                          <div style={{ fontFamily: 'cursive', fontSize: 24, color: 'var(--primary)', position: 'absolute', bottom: 4, left: 8 }}>
                            Signed by Employee
                          </div>
                        ) : (
                          <div className="row gap-8 text-primary fw-600 text-sm" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <Edit3 size={16} /> Click to Sign
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ width: 200 }}>
                      <div className="text-xs text-5 mb-8">Date</div>
                      <div style={{ borderBottom: '2px solid var(--border)', height: 48, position: 'relative' }}>
                        {signProgress === 100 && (
                          <div style={{ fontSize: 16, color: 'var(--text-1)', position: 'absolute', bottom: 4, left: 8, fontFamily: 'monospace' }}>
                            2026-09-26
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tools Panel (Right) */}
            <div style={{ width: 300, background: 'white', borderLeft: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 className="text-sm fw-700 text-1 mb-24 uppercase tracking-wider">Document Details</h3>
              
              <div className="col gap-24 text-sm">
                <div>
                  <div className="text-xs text-5 mb-4">Sender</div>
                  <div className="row gap-8">
                    <Avatar name={signingDoc.sender} size="sm" />
                    <span className="fw-600 text-1">{signingDoc.sender}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-5 mb-4">Message</div>
                  <div className="p-12 text-4" style={{ background: '#F9FAFB', borderRadius: 8, fontStyle: 'italic' }}>
                    "Please review and sign this acknowledgement for your records. Let me know if you have any questions!"
                  </div>
                </div>
                
                <div className="divider" />
                
                <button className="btn-secondary w-full row-center gap-8"><Download size={14}/> Download PDF</button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Top Banner */}
      <PageHeader 
        title="My Signatures"
        icon={<FileSignature size={28} className="text-white" />}
        tabs={['Action Required', 'Completed Documents']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--bg-page)' }}>
        
        {activeTab === 'Action Required' && (
          <div>
            <div className="row-between mb-24">
              <h3 className="text-xl fw-700 text-1 row gap-12">
                <Clock className="text-warning" size={24} /> Action Required
              </h3>
            </div>
            
            <div className="grid-2 gap-24 mb-40">
              {PENDING_DOCS.map(doc => (
                <Card key={doc.id} style={{ border: '1px solid var(--warning)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.05)' }} className="hover-scale">
                  <CardBody>
                    <div className="row-between mb-16">
                      <div className="row gap-12">
                        <div className="icon-chip" style={{ width: 40, height: 40, background: 'var(--warning-tint)', color: 'var(--warning)' }}>
                          <FileSignature size={20} />
                        </div>
                        <Badge variant="warning">Awaiting Your Signature</Badge>
                      </div>
                    </div>
                    
                    <h3 className="text-lg fw-700 text-1 mb-16">{doc.title}</h3>
                    
                    <div className="row gap-12 mb-24 p-12" style={{ background: '#F9FAFB', borderRadius: 8 }}>
                      <Avatar name={doc.sender} size="sm" />
                      <div>
                        <div className="text-sm fw-600 text-1">{doc.sender}</div>
                        <div className="text-xs text-5 mt-2">{doc.senderRole}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div className="text-xs fw-600 text-4 mb-2">Sent</div>
                        <div className="text-xs text-1">{doc.date}</div>
                      </div>
                    </div>
                    
                    <button className="btn-primary w-full row-center gap-8" onClick={() => setSigningDoc(doc)}>
                      Review & Sign <ArrowRight size={16} />
                    </button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'Completed Documents' && (
          <div>
            <h2 className="text-xl fw-700 text-1 mb-24 row gap-12">
              <CheckCircle2 className="text-success" size={24} /> Completed Documents
            </h2>
            
            <Card>
              <CardBody style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB' }}>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-4)', fontSize: 12, textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Document Name</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Sender</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Completed On</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Audit Trail</th>
                      <th style={{ padding: '16px 24px', width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIGNED_DOCS.map((doc, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === SIGNED_DOCS.length - 1 ? 'none' : '1px solid var(--border)' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <div className="row gap-12">
                            <div className="icon-chip" style={{ width: 32, height: 32, background: 'var(--success-tint)', color: 'var(--success)' }}>
                              <CheckCircle2 size={16} />
                            </div>
                            <div>
                              <div className="text-sm fw-700 text-1">{doc.title}</div>
                              <div className="text-xs text-5 mt-4">{doc.type} Document</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', fontSize: 14 }}>
                          <div className="row gap-8">
                            <Avatar name={doc.sender} size="sm" />
                            <span className="fw-600 text-1">{doc.sender}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', color: 'var(--text-4)', fontSize: 14 }}>{doc.date}</td>
                        <td style={{ padding: '20px 24px' }}>
                          <div className="row gap-8 text-xs text-5"><Shield size={14} className="text-success"/> Verified</div>
                        </td>
                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                          <button className="btn-secondary btn-sm row gap-8"><Download size={14}/> PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
