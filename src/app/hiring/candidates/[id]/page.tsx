"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, Briefcase, Calendar, FileText, Download, CheckCircle2, Star, ArrowLeft, MoreHorizontal, CornerUpLeft, Plus, Send, X, Type, Paperclip, ImageIcon, Smile, Trash2, Clock, User } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';

const INITIAL_CANDIDATES = [
  { id: 1, name: 'Alex Johnson', role: 'Senior Frontend Engineer', stage: 'Interviewing', source: 'LinkedIn', date: '2 days ago', rating: 4, avatar: 'https://i.pravatar.cc/150?img=11', email: 'alex.j@example.com', phone: '+1 (555) 123-4567' },
  { id: 2, name: 'Maria Garcia', role: 'Senior Frontend Engineer', stage: 'Applied', source: 'Referral', date: '1 day ago', rating: null, avatar: 'https://i.pravatar.cc/150?img=5', email: 'maria.g@example.com', phone: '+1 (555) 987-6543' },
  { id: 3, name: 'Wei Chen', role: 'Senior Frontend Engineer', stage: 'Offer', source: 'Direct Website', date: '5 days ago', rating: 5, avatar: 'https://i.pravatar.cc/150?img=12', email: 'wei.c@example.com', phone: '+1 (555) 555-5555' },
  { id: 4, name: 'Jessica Smith', role: 'Product Manager', stage: 'Sourced', source: 'Agency', date: 'Today', rating: null, avatar: 'https://i.pravatar.cc/150?img=47', email: 'jess.s@example.com', phone: '+1 (555) 111-2222' },
  { id: 5, name: 'David Kim', role: 'Senior Frontend Engineer', stage: 'Interviewing', source: 'Indeed', date: '3 days ago', rating: 3, avatar: 'https://i.pravatar.cc/150?img=15', email: 'david.k@example.com', phone: '+1 (555) 333-4444' },
];

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params.id);
  
  const selectedCandidate = INITIAL_CANDIDATES.find(c => c.id === candidateId);

  const [candidateProfileTab, setCandidateProfileTab] = useState('Overview');
  const [showComposeEmailModal, setShowComposeEmailModal] = useState(false);

  if (!selectedCandidate) {
    return <div style={{ padding: 48 }}>Candidate not found.</div>;
  }

  return (
    <div className="page-container" style={{ background: 'var(--bg-page)', padding: 0, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      
      {/* Compose Email Modal */}
      <Modal
        isOpen={showComposeEmailModal}
        onClose={() => setShowComposeEmailModal(false)}
        title="Compose Email"
        subtitle={`To: ${selectedCandidate.name} <${selectedCandidate.email}>`}
        width={1000}
      >
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          
          {/* Editor Area (Left) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 32px' }}>
              
              <div className="row gap-16 align-center py-16" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm fw-700 text-4" style={{ width: 60 }}>Subject:</span>
                <input type="text" className="input text-base fw-600 w-full" placeholder="Enter subject line..." defaultValue="Invitation to Final Interview - EasyHR" style={{ border: 'none', padding: 0, background: 'transparent' }} />
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '0 32px', display: 'flex', flexDirection: 'column' }}>
              <textarea 
                className="input flex-1 w-full text-base" 
                placeholder="Write your message here..."
                style={{ border: 'none', background: 'transparent', resize: 'none', padding: 0, lineHeight: 1.6 }}
                defaultValue={`Hi ${selectedCandidate.name},\n\nWe were very impressed with your background and would like to invite you to a final round interview with our engineering team.\n\nPlease let us know what times work best for you next week.\n\nBest,\nEasyHR Team`}
              />
            </div>

            {/* Formatting Toolbar & Actions */}
            <div className="row-between align-center p-20" style={{ borderTop: '1px solid var(--border)', background: '#F9FAFB' }}>
              <div className="row gap-8 text-4">
                <button className="btn-neutral" style={{ padding: 8 }}><Type size={18}/></button>
                <button className="btn-neutral" style={{ padding: 8 }}><Paperclip size={18}/></button>
                <button className="btn-neutral" style={{ padding: 8 }}><ImageIcon size={18}/></button>
                <button className="btn-neutral" style={{ padding: 8 }}><Smile size={18}/></button>
              </div>
              <div className="row gap-16 align-center">
                <button className="btn-neutral" style={{ color: 'var(--danger)', padding: 8 }}><Trash2 size={18}/></button>
                <button className="btn-primary row gap-8 px-24 py-12" style={{ borderRadius: 8, fontSize: 14, fontWeight: 700 }} onClick={() => setShowComposeEmailModal(false)}>
                  <Send size={16}/> Send Email
                </button>
              </div>
            </div>
          </div>

          {/* Macros Sidebar (Right) */}
          <div style={{ width: 300, background: '#FAFAFA', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm fw-800 text-1 m-0 uppercase tracking-wider">Email Placeholders</h3>
              <p className="text-xs text-5 m-0 mt-8">Click to insert into your email</p>
            </div>
            <div className="col gap-12 p-20 flex-1 overflow-y-auto">
              <div className="col gap-8">
                <div className="text-xs fw-700 text-4 uppercase mb-4">Candidate</div>
                <button className="btn-neutral w-full row justify-start" style={{ padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid var(--border)' }}>{"{{candidate.first_name}}"}</button>
                <button className="btn-neutral w-full row justify-start" style={{ padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid var(--border)' }}>{"{{candidate.last_name}}"}</button>
              </div>
              <div className="col gap-8 mt-16">
                <div className="text-xs fw-700 text-4 uppercase mb-4">Job Details</div>
                <button className="btn-neutral w-full row justify-start" style={{ padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid var(--border)' }}>{"{{job.title}}"}</button>
                <button className="btn-neutral w-full row justify-start" style={{ padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid var(--border)' }}>{"{{company.name}}"}</button>
              </div>
              <div className="col gap-8 mt-16">
                <div className="text-xs fw-700 text-4 uppercase mb-4">Scheduling</div>
                <button className="btn-neutral w-full row justify-start" style={{ padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid var(--border)', color: 'var(--primary)' }}>Insert Calendar Link</button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Candidate Profile Header */}
      <div style={{ padding: '24px 32px 0 32px', flexShrink: 0 }}>
        <div style={{ background: 'var(--gradient)', color: 'white', padding: '32px 40px', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
          <button className="btn-secondary row gap-8 mb-20 hover-scale" onClick={() => router.push('/hiring')} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '8px 16px', fontSize: 13, borderRadius: 20 }}>
            <ArrowLeft size={16}/> Back to Pipeline
          </button>
          
          <div className="row-between align-end">
            <div className="row gap-24 align-center">
              <Avatar name={selectedCandidate.name} size="xl" src={selectedCandidate.avatar} style={{ width: 88, height: 88, border: '4px solid white', fontSize: 28 }} />
              <div>
                <h1 className="text-3xl fw-800 m-0 mb-8">{selectedCandidate.name}</h1>
                <div className="row gap-16 text-base fw-500" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <span className="row gap-8 align-center"><Briefcase size={16}/> {selectedCandidate.role}</span>
                  <span>•</span>
                  <span className="row gap-8 align-center"><MapPin size={16}/> New York, USA</span>
                </div>
              </div>
            </div>
            
            <div className="row gap-12">
              <button className="btn-secondary hover-scale" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600 }} onClick={() => setShowComposeEmailModal(true)}>
                <Mail size={16} style={{ marginRight: 8 }}/> Email Candidate
              </button>
              <button className="btn-primary" style={{ background: 'white', color: 'var(--primary)', padding: '10px 20px', fontSize: 14, borderRadius: 20 }}>
                <Calendar size={16} style={{ marginRight: 8 }}/> Schedule Interview
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Tabs */}
      <div style={{ padding: '0 48px', display: 'flex', gap: 12, flexShrink: 0, marginTop: 24, marginBottom: 24 }}>
        {['Overview', 'Resume & Files', 'Scorecards', 'Emails', 'Activity Log'].map(tab => (
          <button
            key={tab}
            onClick={() => setCandidateProfileTab(tab)}
            style={{
              background: candidateProfileTab === tab ? 'white' : 'transparent',
              color: candidateProfileTab === tab ? 'var(--primary)' : 'var(--text-3)',
              border: candidateProfileTab === tab ? '1px solid var(--border)' : '1px solid transparent',
              padding: '10px 20px',
              fontSize: 14,
              borderRadius: 24,
              fontWeight: candidateProfileTab === tab ? 700 : 600,
              cursor: 'pointer',
              transition: '0.2s',
              boxShadow: candidateProfileTab === tab ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Content */}
      <div style={{ flex: 1, padding: '0 48px 48px 48px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {candidateProfileTab === 'Overview' && (
          <div className="grid-3 gap-32">
            <div className="col gap-32" style={{ gridColumn: 'span 2' }}>
              <Card>
                <CardBody style={{ padding: 32 }}>
                  <h3 className="text-xl fw-800 text-1 m-0 mb-24">Application Details</h3>
                  <div className="col gap-24">
                    <div className="grid-2 gap-24">
                      <div>
                        <div className="text-sm fw-700 text-5 uppercase tracking-wider mb-8">Stage</div>
                        <Badge variant="primary" style={{ padding: '6px 12px', fontSize: 14 }}>{selectedCandidate.stage}</Badge>
                      </div>
                      <div>
                        <div className="text-sm fw-700 text-5 uppercase tracking-wider mb-8">Source</div>
                        <Badge variant="neutral" style={{ padding: '6px 12px', fontSize: 14 }}>{selectedCandidate.source}</Badge>
                      </div>
                    </div>
                    
                    <div className="divider m-0" />
                    
                    <div>
                      <div className="text-sm fw-700 text-5 uppercase tracking-wider mb-8">Years of Experience with React</div>
                      <div className="text-lg fw-600 text-1">5+ years</div>
                    </div>
                    <div>
                      <div className="text-sm fw-700 text-5 uppercase tracking-wider mb-8">Portfolio URL</div>
                      <a href="#" className="text-lg fw-600 text-primary">https://github.com/alexj</a>
                    </div>
                    <div>
                      <div className="text-sm fw-700 text-5 uppercase tracking-wider mb-8">Sponsorship Required?</div>
                      <div className="text-lg fw-600 text-1">No</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody style={{ padding: 32 }}>
                  <div className="row-between align-center mb-24">
                    <h3 className="text-xl fw-800 text-1 m-0">Recent Feedback</h3>
                    <button className="btn-secondary btn-sm row gap-8"><Plus size={14}/> Add Note</button>
                  </div>
                  
                  <div className="col gap-24">
                    <div className="row gap-16 align-start p-24" style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <Avatar name="David Kim" size="sm" src="https://i.pravatar.cc/150?img=15" />
                      <div>
                        <div className="row gap-12 align-center mb-8">
                          <span className="fw-700 text-1">David Kim</span>
                          <span className="text-sm text-5">Oct 12 at 2:30 PM</span>
                          {selectedCandidate.rating && (
                            <div className="row gap-4 text-warning">
                              {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= selectedCandidate.rating! ? "currentColor" : "none"} color={i <= selectedCandidate.rating! ? "currentColor" : "var(--border)"} />)}
                            </div>
                          )}
                        </div>
                        <p className="text-base text-2 m-0" style={{ lineHeight: 1.6 }}>
                          Alex demonstrated deep knowledge of React hooks and state management. Strong communication skills. Answered the system design question perfectly. Recommended for final round.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="col gap-24">
              <Card>
                <CardBody style={{ padding: 24 }}>
                  <h3 className="text-lg fw-800 text-1 m-0 mb-20">Contact Information</h3>
                  <div className="col gap-16">
                    <div className="row gap-12 align-center text-sm fw-600 text-2">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={16}/></div>
                      {selectedCandidate.email}
                    </div>
                    <div className="row gap-12 align-center text-sm fw-600 text-2">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success-tint)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16}/></div>
                      {selectedCandidate.phone}
                    </div>
                    <div className="row gap-12 align-center text-sm fw-600 text-2">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--warning-tint)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={16}/></div>
                      New York, USA
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody style={{ padding: 24 }}>
                  <h3 className="text-lg fw-800 text-1 m-0 mb-20">Attached Files</h3>
                  <div className="col gap-8">
                    <div className="row-between align-center p-12" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="row gap-12 align-center">
                        <FileText size={20} className="text-primary"/>
                        <div>
                          <div className="fw-700 text-1 text-xs">Resume.pdf</div>
                          <div className="text-xs text-5">1.2 MB</div>
                        </div>
                      </div>
                      <button className="btn-neutral" style={{ padding: 6 }}><Download size={14}/></button>
                    </div>
                    <div className="row-between align-center p-12" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="row gap-12 align-center">
                        <FileText size={20} className="text-primary"/>
                        <div>
                          <div className="fw-700 text-1 text-xs">Cover_Letter.docx</div>
                          <div className="text-xs text-5">450 KB</div>
                        </div>
                      </div>
                      <button className="btn-neutral" style={{ padding: 6 }}><Download size={14}/></button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {candidateProfileTab === 'Resume & Files' && (
          <Card style={{ height: 800 }}>
            <CardBody style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="row-between p-24" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-xl fw-800 text-1 m-0">Resume.pdf</h3>
                <button className="btn-secondary row gap-8"><Download size={16}/> Download PDF</button>
              </div>
              <div style={{ flex: 1, background: '#525659', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ width: 600, height: '90%', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: 48, color: '#333' }}>
                  <h1 style={{ fontSize: 32, marginBottom: 8 }}>{selectedCandidate.name}</h1>
                  <p style={{ color: '#666', borderBottom: '2px solid #333', paddingBottom: 16, marginBottom: 24 }}>{selectedCandidate.email} • {selectedCandidate.phone} • New York, NY</p>
                  <h2 style={{ fontSize: 20, marginBottom: 12, color: 'var(--primary)' }}>Experience</h2>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 4 }}>Senior Frontend Engineer - TechCorp</h3>
                    <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>2020 - Present</p>
                    <ul style={{ fontSize: 14, paddingLeft: 20, lineHeight: 1.6 }}>
                      <li>Architected and built the main React application serving 2M+ DAU.</li>
                      <li>Reduced bundle size by 45% through aggressive code splitting.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {candidateProfileTab === 'Scorecards' && (
          <div className="col gap-24">
            <div className="row-between align-center mb-16">
              <h3 className="text-xl fw-800 text-1 m-0">Interview Scorecards</h3>
              <button className="btn-primary row gap-8" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14 }}><Plus size={16}/> Add Scorecard</button>
            </div>
            <Card style={{ border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
              <CardBody style={{ padding: '24px 32px' }}>
                <div className="row-between align-start mb-24" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
                  <div className="row gap-20 align-center" style={{ flex: 1, paddingRight: 24 }}>
                    <Avatar name="David Kim" size="xl" src="https://i.pravatar.cc/150?img=15" style={{ width: 48, height: 48, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    <div className="col gap-4">
                      <div className="fw-800 text-lg text-1 m-0">Technical Interview (System Design)</div>
                      <div className="text-sm text-5 fw-500 row gap-8 align-center">
                        <User size={14}/> <span className="text-2 fw-600">David Kim</span> 
                        <span>•</span>
                        <Clock size={14}/> Oct 12, 2026 at 2:30 PM
                      </div>
                    </div>
                  </div>
                  <div style={{ marginLeft: 24, padding: '16px 24px', borderRadius: 12, background: '#F0FDF4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0', minWidth: 160 }}>
                    <span className="text-xs fw-800 text-success uppercase tracking-wider">Overall Rating</span>
                    <div className="row gap-4 text-success" style={{ background: 'white', padding: '6px 12px', borderRadius: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={18} fill={i <= 4 ? "currentColor" : "none"} color={i <= 4 ? "currentColor" : "var(--border)"} />)}
                    </div>
                  </div>
                </div>
                
                <div className="grid-2 gap-40">
                  <div className="col gap-20">
                    <h4 className="text-sm fw-800 text-1 uppercase tracking-wider m-0">Skills Assessment</h4>
                    <div className="col gap-16" style={{ background: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                      {[
                        { skill: 'React & Hooks', score: 5 },
                        { skill: 'System Architecture', score: 4 },
                        { skill: 'Problem Solving', score: 4 },
                        { skill: 'Communication', score: 5 },
                      ].map(item => (
                        <div key={item.skill} className="col gap-8">
                          <div className="row-between text-sm fw-700 text-2">
                            <span>{item.skill}</span>
                            <span className="text-1">{item.score} / 5</span>
                          </div>
                          <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(item.score / 5) * 100}%`, background: 'var(--primary)', borderRadius: 4 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col gap-20">
                    <h4 className="text-sm fw-800 text-1 uppercase tracking-wider m-0">Interviewer Notes</h4>
                    <div className="col gap-12" style={{ background: 'white', padding: 20, borderRadius: 12, borderLeft: '4px solid var(--primary)', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <p className="m-0">Alex demonstrated deep knowledge of React hooks and state management. Strong communication skills when explaining complex tradeoffs.</p>
                      <p className="m-0">Answered the system design question perfectly, showing great intuition for scalable architecture. Recommended for final round.</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {candidateProfileTab === 'Emails' && (
          <div className="col gap-24 h-full" style={{ minHeight: 700 }}>
            <div className="row-between align-center">
              <h3 className="text-2xl fw-800 text-1 m-0">Email Thread</h3>
            </div>
            <div className="row flex-1" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
              {/* Sidebar */}
              <div style={{ width: 340, background: '#F9FAFB', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => setShowComposeEmailModal(true)} className="btn-primary w-full row justify-center gap-8" style={{ padding: '14px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}><Plus size={16}/> Compose Email</button>
                </div>
                <div className="col flex-1 overflow-y-auto">
                  {/* Active Item */}
                  <div className="col gap-8" style={{ padding: '20px 24px', background: 'white', borderLeft: '4px solid var(--primary)', borderBottom: '1px solid var(--border)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div className="row-between align-center">
                      <span className="fw-800 text-1" style={{ fontSize: 15 }}>Alex Johnson</span>
                      <span className="text-xs fw-700" style={{ color: 'var(--primary)', background: 'var(--primary-tint)', padding: '2px 8px', borderRadius: 12 }}>Oct 14</span>
                    </div>
                    <div className="text-sm fw-800 text-1 truncate">Re: Invitation to Final Interview</div>
                    <div className="text-sm text-5 truncate" style={{ lineHeight: 1.5 }}>Thank you for the update! I am very excited...</div>
                  </div>
                  {/* Inactive Item */}
                  <div className="col gap-8 hover-bg-subtle" style={{ padding: '20px 24px', borderLeft: '4px solid transparent', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: '0.2s' }}>
                    <div className="row-between align-center">
                      <span className="fw-700 text-2" style={{ fontSize: 15 }}>EasyHR Team</span>
                      <span className="text-xs text-5 fw-600">Oct 10</span>
                    </div>
                    <div className="text-sm fw-600 text-2 truncate">Application Received</div>
                    <div className="text-sm text-5 truncate" style={{ lineHeight: 1.5 }}>Hi Alex, we have successfully received...</div>
                  </div>
                </div>
              </div>

              {/* Main Email Area */}
              <div className="col flex-1" style={{ display: 'flex', flexDirection: 'column', background: 'white' }}>
                {/* Email Header */}
                <div className="col gap-20 p-32" style={{ borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
                  <h2 className="text-2xl fw-800 text-1 m-0">Re: Invitation to Final Interview</h2>
                  <div className="row-between align-center">
                    <div className="row gap-16 align-center">
                      <Avatar name={selectedCandidate.name} size="md" src={selectedCandidate.avatar} style={{ width: 48, height: 48, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      <div className="col gap-4">
                        <div className="row gap-8 align-center">
                          <span className="fw-800 text-1 text-base">{selectedCandidate.name}</span>
                          <span className="text-sm text-5 fw-500">&lt;alex.j@example.com&gt;</span>
                        </div>
                        <div className="text-sm fw-600 text-4">To: <span className="text-primary">recruiting@easyhr.com</span></div>
                      </div>
                    </div>
                    <div className="row gap-16 align-center text-5">
                      <div className="row gap-8 align-center text-sm fw-600 bg-neutral py-4 px-12 rounded-full text-2">
                        <Clock size={14}/> Oct 14, 2026, 10:30 AM
                      </div>
                      <div className="row gap-8">
                        <button className="btn-neutral" style={{ padding: 8, borderRadius: 8, background: 'white', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><CornerUpLeft size={16}/></button>
                        <button className="btn-neutral" style={{ padding: 8, borderRadius: 8, background: 'white', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><MoreHorizontal size={16}/></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-40 flex-1 overflow-y-auto">
                  <div className="text-base text-1" style={{ lineHeight: 1.8, maxWidth: 800, fontFamily: 'system-ui' }}>
                    <p>Hi Team,</p>
                    <p>Thank you for the update! I am very excited to move forward to the final round.</p>
                    <p>I am available this Thursday at 2 PM EST or Friday anytime before noon. Please let me know which time works best for your team.</p>
                    <br/>
                    <p style={{ color: 'var(--text-3)' }}>Best regards,<br/><strong style={{ color: 'var(--text-1)' }}>{selectedCandidate.name}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {candidateProfileTab === 'Activity Log' && (
          <Card style={{ border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
            <CardBody style={{ padding: 40 }}>
              <h3 className="text-xl fw-800 text-1 m-0 mb-40">Activity History</h3>
              <div className="col gap-40 relative">
                <div style={{ position: 'absolute', top: 24, bottom: 24, left: 24, width: 2, background: '#E5E7EB', borderRadius: 2 }}></div>
                
                {[
                  { icon: <Mail size={16}/>, color: 'var(--primary)', bg: '#EEF2FF', title: 'Email Sent: Invitation to Final Interview', time: 'Oct 14, 2026 at 10:30 AM', user: 'David Kim', content: 'Sent the standard "Invitation to Final Interview" template.' },
                  { icon: <Star size={16}/>, color: 'var(--warning)', bg: '#FFFBEB', title: 'Moved to Interviewing Stage', time: 'Oct 12, 2026 at 3:15 PM', user: 'David Kim', content: 'Candidate successfully passed the technical round with flying colors.' },
                  { icon: <FileText size={16}/>, color: '#8b5cf6', bg: '#F5F3FF', title: 'Submitted Technical Assessment', time: 'Oct 12, 2026 at 2:30 PM', user: 'Alex Johnson', content: 'Scorecard submitted. Overall score: 4.5/5.' },
                  { icon: <CheckCircle2 size={16}/>, color: 'var(--success)', bg: '#F0FDF4', title: 'Application Received', time: 'Oct 10, 2026 at 9:00 AM', user: 'System', content: 'Applied via Careers Page. Resume parsed successfully.' },
                ].map((log, idx) => (
                  <div key={idx} className="row gap-32 align-start relative">
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: log.bg, border: `2px solid white`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: log.color, zIndex: 1, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      {log.icon}
                    </div>
                    <div className="flex-1" style={{ background: '#F9FAFB', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="row-between align-center mb-12">
                        <div className="text-base fw-800 text-1">{log.title}</div>
                        <div className="text-xs fw-600 bg-white text-5" style={{ padding: '4px 12px', borderRadius: 12, border: '1px solid var(--border)' }}>{log.time}</div>
                      </div>
                      <div className="text-sm text-2 mb-12" style={{ lineHeight: 1.6 }}>{log.content}</div>
                      <div className="row gap-8 align-center text-sm fw-600 text-4">
                        <User size={14}/> {log.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
