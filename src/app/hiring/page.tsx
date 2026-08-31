"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, Mail, Phone, MapPin, Briefcase, Calendar, FileText, Download, CheckCircle2, XCircle, Clock, Star, LayoutDashboard, Settings, ArrowLeft, MoreVertical, Edit, Copy, ExternalLink, ArrowRight, TrendingUp, Users, DollarSign, CornerUpLeft, MoreHorizontal, Type, Paperclip, ImageIcon, Smile, Trash2, Send, GripVertical, X, Eye, EyeOff, BarChart3, ChevronRight, User, MessageSquare } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { useHR } from '@/context/HRContext';

const INITIAL_JOBS = [
  { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', applicants: 42, daysOpen: 14, status: 'Published' },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'New York, NY', applicants: 18, daysOpen: 5, status: 'Published' },
  { id: 3, title: 'HR Business Partner', department: 'People', location: 'San Francisco, CA', applicants: 5, daysOpen: 2, status: 'Draft' },
];

// Initial data is now managed in HRContext

const STAGES = ['Sourced', 'Applied', 'Interviewing', 'Offer', 'Hired'];

type CustomField = {
  id: string;
  type: 'text' | 'textarea' | 'checkbox' | 'dropdown' | 'file';
  label: string;
  required: boolean;
  options?: string[]; // for dropdowns
};

export default function HiringPage() {
  const [activeTab, setActiveTab] = useState('Pipeline');
  const [selectedJob, setSelectedJob] = useState('Senior Frontend Engineer');
  
  // View states: 'list', 'create_job'
  const [viewState, setViewState] = useState<'list' | 'create_job'>('list');
  const router = useRouter();
  
  // HR Context
  const { candidates, updateCandidateStage } = useHR();
  
  // Data State
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  
  // Job Builder State
  const [builderStep, setBuilderStep] = useState(1);
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: '1', type: 'file', label: 'Resume / CV', required: true },
    { id: '2', type: 'text', label: 'Portfolio URL', required: false },
    { id: '3', type: 'dropdown', label: 'Years of Experience with React', required: true, options: ['0-2 years', '3-5 years', '5+ years'] },
  ]);

  const filteredCandidates = candidates.filter(c => selectedJob === 'All Roles' || c.role === selectedJob);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, candidateId: number) => {
    e.dataTransfer.setData('candidateId', candidateId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const candidateId = e.dataTransfer.getData('candidateId');
    if (candidateId) {
      updateCandidateStage(parseInt(candidateId), targetStage);
    }
  };

  const addCustomField = (type: CustomField['type']) => {
    const newField: CustomField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
    };
    setCustomFields([...customFields, newField]);
  };

  // -------------------------------------------------------------
  // VIEW: JOB BUILDER WIZARD
  // -------------------------------------------------------------
  if (viewState === 'create_job') {
    return (
      <div className="page-container" style={{ background: 'var(--bg-page)', padding: '32px 48px', height: '100%', overflowY: 'auto' }}>
        <button className="btn-secondary row gap-8 mb-32" onClick={() => setViewState('list')}>
          <ArrowLeft size={16}/> Back to ATS
        </button>
        
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="row-between mb-32 align-end">
            <div>
              <h1 className="text-3xl fw-800 text-1 m-0 mb-8">Job Post Builder</h1>
              <p className="text-lg text-5 m-0">Create a dynamic job posting and application form.</p>
            </div>
            
            <div className="row gap-12 align-center">
              {[1, 2, 3].map(step => (
                <div key={step} className="row gap-8 align-center">
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: builderStep >= step ? 'var(--primary)' : 'var(--bg-body)',
                    color: builderStep >= step ? 'white' : 'var(--text-4)',
                    fontWeight: 700,
                    border: builderStep >= step ? 'none' : '1px solid var(--border)'
                  }}>
                    {builderStep > step ? <CheckCircle2 size={16}/> : step}
                  </div>
                  {step < 3 && <div style={{ width: 40, height: 2, background: builderStep > step ? 'var(--primary)' : 'var(--border)' }} />}
                </div>
              ))}
            </div>
          </div>
          
          <Card>
            <CardBody style={{ padding: 40 }}>
              {builderStep === 1 && (
                <div className="col gap-32">
                  <h2 className="text-2xl fw-800 text-1 m-0">1. Job Details</h2>
                  <div className="col gap-12">
                    <label className="text-sm fw-700 text-1">Job Title</label>
                    <input type="text" className="input" placeholder="e.g. Senior Backend Engineer" defaultValue="Senior Backend Engineer" />
                  </div>
                  <div className="grid-2 gap-32">
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Department</label>
                      <select className="select">
                        <option>Engineering</option>
                        <option>Product</option>
                      </select>
                    </div>
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Location / Work Model</label>
                      <select className="select">
                        <option>Remote</option>
                        <option>Hybrid - New York</option>
                      </select>
                    </div>
                  </div>
                  <div className="col gap-12">
                    <label className="text-sm fw-700 text-1">Job Description</label>
                    <textarea className="input" rows={6} placeholder="Describe the role..." defaultValue="We are looking for an experienced engineer to join our core product team..." style={{ padding: 16, fontFamily: 'inherit', fontSize: 15 }}></textarea>
                  </div>
                  <div className="divider m-0" />
                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setViewState('list')} style={{ padding: '14px 28px' }}>Cancel</button>
                    <button className="btn-primary" onClick={() => setBuilderStep(2)} style={{ padding: '14px 36px' }}>Next: Build Form <ArrowRight size={16} style={{ marginLeft: 8 }}/></button>
                  </div>
                </div>
              )}

              {builderStep === 2 && (
                <div className="col gap-32">
                  <div className="row-between align-center">
                    <div>
                      <h2 className="text-2xl fw-800 text-1 m-0 mb-8">2. Application Form</h2>
                      <p className="text-base text-5 m-0">Build the questions candidates must answer when applying.</p>
                    </div>
                    <Link href="/careers/preview" target="_blank" className="btn-secondary btn-sm row gap-8">
                      <ExternalLink size={16}/> View Public Page
                    </Link>
                  </div>
                  
                  <div className="col gap-16 p-24" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div className="row gap-12 fw-700 text-sm text-5 uppercase tracking-wider mb-8">
                      Standard Fields (Locked)
                    </div>
                    <div className="row gap-24 align-center p-16" style={{ background: 'white', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="col gap-4 flex-1">
                        <span className="fw-700 text-1">Full Name</span>
                        <span className="text-sm text-5">Text Input • Required</span>
                      </div>
                    </div>
                    <div className="row gap-24 align-center p-16" style={{ background: 'white', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="col gap-4 flex-1">
                        <span className="fw-700 text-1">Email Address</span>
                        <span className="text-sm text-5">Email Input • Required</span>
                      </div>
                    </div>
                  </div>

                  <div className="col gap-16">
                    <div className="fw-700 text-sm text-5 uppercase tracking-wider">Custom Fields</div>
                    {customFields.map((field) => (
                      <div key={field.id} className="row gap-16 p-20 align-start" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: '8px 4px', cursor: 'grab', color: 'var(--text-4)' }}><GripVertical size={20}/></div>
                        <div className="col gap-16 flex-1">
                          <div className="grid-2 gap-24">
                            <div className="col gap-8">
                              <label className="text-xs fw-700 text-4 uppercase">Field Label</label>
                              <input type="text" className="input" value={field.label} readOnly />
                            </div>
                            <div className="col gap-8">
                              <label className="text-xs fw-700 text-4 uppercase">Field Type</label>
                              <select className="select" value={field.type} disabled>
                                <option value="text">Short Text</option>
                                <option value="textarea">Long Text (Paragraph)</option>
                                <option value="checkbox">Yes/No Checkbox</option>
                                <option value="dropdown">Multiple Choice (Dropdown)</option>
                                <option value="file">File Upload (PDF/Doc)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <button className="btn-secondary" style={{ padding: 8, color: 'var(--danger)', borderColor: 'transparent', background: '#FEF2F2' }} onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}>
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    ))}
                    
                    <div className="row gap-12 mt-8">
                      <button className="btn-secondary btn-sm row gap-8" onClick={() => addCustomField('text')}><Plus size={14}/> Text</button>
                      <button className="btn-secondary btn-sm row gap-8" onClick={() => addCustomField('dropdown')}><Plus size={14}/> Dropdown</button>
                      <button className="btn-secondary btn-sm row gap-8" onClick={() => addCustomField('checkbox')}><Plus size={14}/> Checkbox</button>
                      <button className="btn-secondary btn-sm row gap-8" onClick={() => addCustomField('file')}><Plus size={14}/> File</button>
                    </div>
                  </div>

                  <div className="divider m-0" />
                  <div className="row-between mt-8">
                    <button className="btn-neutral" onClick={() => setBuilderStep(1)} style={{ padding: '14px 28px' }}>Back</button>
                    <button className="btn-primary" onClick={() => setBuilderStep(3)} style={{ padding: '14px 36px' }}>Next: Publish <ArrowRight size={16} style={{ marginLeft: 8 }}/></button>
                  </div>
                </div>
              )}

              {builderStep === 3 && (
                <div className="col gap-40 text-center py-40">
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-tint)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <CheckCircle2 size={40}/>
                  </div>
                  <div>
                    <h2 className="text-3xl fw-800 text-1 mb-12">Ready to Publish!</h2>
                    <p className="text-lg text-5 max-w-md mx-auto">Your job post for "Senior Backend Engineer" is fully configured with custom application fields.</p>
                  </div>
                  <div className="row gap-16 justify-center mt-16">
                    <button className="btn-neutral" onClick={() => setBuilderStep(2)} style={{ padding: '14px 28px' }}>Back to Builder</button>
                    <button className="btn-primary" onClick={() => { setViewState('list'); setBuilderStep(1); }} style={{ padding: '14px 36px' }}>Publish Job to Careers Page</button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN ATS DASHBOARD (Pipeline, Job Postings, Reports)
  // -------------------------------------------------------------
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, background: 'var(--bg-page)', overflowY: 'auto' }}>
      {/* Top Header - Scrollable */}
      <div style={{ padding: '24px 32px 0 32px', flexShrink: 0 }}>
        <PageHeader 
          title="Applicant Tracking System"
          subtitle="Manage your hiring pipeline, candidate tracking, and custom job postings."
          variant="card"
          tabs={['Pipeline', 'Job Postings', 'Reports']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }} onClick={() => setViewState('create_job')}>
              <Plus size={16} style={{ marginRight: 8 }}/> Create Job Post
            </button>
          }
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative', marginTop: 16 }}>
        
        {/* ---------------- PIPELINE TAB ---------------- */}
        {activeTab === 'Pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <div className="row-between p-32" style={{ borderBottom: '1px solid var(--border)', background: 'white', flexShrink: 0 }}>
              <div className="row gap-24">
                <div className="col gap-8">
                  <span className="text-xs fw-800 text-5 uppercase tracking-wider">Active Pipeline</span>
                  <select className="select" style={{ width: 300, fontWeight: 700, padding: 14, fontSize: 16, background: '#F9FAFB' }} value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                    <option>All Roles</option>
                    <option>Senior Frontend Engineer</option>
                    <option>Product Manager</option>
                    <option>HR Business Partner</option>
                  </select>
                </div>
                
                <div className="col gap-8">
                  <span className="text-xs fw-800 text-5 uppercase tracking-wider">Search Candidates</span>
                  <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 20px', width: 400 }}>
                    <Search size={18} className="text-4" style={{ marginRight: 12 }} />
                    <input type="text" placeholder="Search by name, email, skills..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 15, width: '100%', fontWeight: 500 }} />
                  </div>
                </div>
              </div>
              <div className="row gap-16 align-end">
                <button className="btn-neutral" style={{ padding: '14px 24px', fontSize: 15, fontWeight: 700 }}><Filter size={18} style={{ marginRight: 8 }} /> Filters</button>
              </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              .drag-over {
                background: #EEF2FF !important;
                border: 2px dashed var(--primary) !important;
              }
            `}} />

            {/* Kanban Board */}
            <div style={{ padding: '32px 48px 64px 48px', display: 'flex', gap: 24, alignItems: 'flex-start', background: 'var(--bg-page)', overflowX: 'auto' }}>
              {STAGES.map(stage => {
                const stageCandidates = filteredCandidates.filter(c => c.stage === stage);
                return (
                  <div 
                    key={stage} 
                    style={{ minWidth: 320, width: 320, display: 'flex', flexDirection: 'column', gap: 16, background: '#F3F4F6', padding: 16, borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage)}
                  >
                    <div className="row-between align-center px-4">
                      <div className="row gap-12 align-center">
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: stage === 'Hired' ? 'var(--success)' : stage === 'Offer' ? 'var(--warning)' : 'var(--primary)' }}/>
                        <h3 className="text-sm fw-800 text-1 uppercase tracking-wider m-0">{stage}</h3>
                      </div>
                      <Badge variant="neutral" style={{ fontSize: 13, padding: '4px 12px', background: 'white', fontWeight: 800, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{stageCandidates.length}</Badge>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 400 }}>
                      {stageCandidates.map(candidate => (
                        <Card 
                          key={candidate.id} 
                          style={{ cursor: 'grab', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderRadius: 12, background: 'white' }} 
                          className="hover-scale"
                          draggable
                          onDragStart={(e: React.DragEvent) => handleDragStart(e, candidate.id)}
                          onClick={() => router.push(`/hiring/candidates/${candidate.id}`)}
                        >
                          <CardBody style={{ padding: 24 }}>
                            <div className="row-between mb-20 align-start">
                              <Badge variant="neutral" style={{ fontSize: 12, background: '#F3F4F6', color: 'var(--text-3)', fontWeight: 700 }}>{candidate.source}</Badge>
                              {candidate.rating && (
                                <div className="row gap-4 align-center text-warning fw-800 text-sm bg-warning-tint px-8 py-4" style={{ borderRadius: 12 }}>
                                  <Star size={14} fill="currentColor"/> {candidate.rating}.0
                                </div>
                              )}
                            </div>
                            
                            <div className="row gap-16 mb-24 align-center">
                              <Avatar name={candidate.name} size="lg" src={candidate.avatar} style={{ width: 56, height: 56 }} />
                              <div>
                                <h4 className="text-lg fw-800 text-1 m-0 mb-4">{candidate.name}</h4>
                                <p className="text-sm fw-600 text-4 m-0">{candidate.role}</p>
                              </div>
                            </div>
                            
                            <div className="row-between text-sm fw-600 text-5 pt-16" style={{ borderTop: '1px dashed var(--border)' }}>
                              <span className="row gap-8 align-center"><Clock size={16}/> {candidate.date}</span>
                              <span style={{ color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Profile <ChevronRight size={16}/></span>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                      
                      {stageCandidates.length === 0 && (
                        <div style={{ border: '2px dashed var(--border)', borderRadius: 12, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 14, fontWeight: 700 }}>
                          Drop candidate here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- JOB POSTINGS TAB ---------------- */}
        {activeTab === 'Job Postings' && (
          <div style={{ padding: '16px 40px 64px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <div className="row-between align-center mb-24">
              <div>
                <h2 className="text-2xl fw-800 text-1 m-0 mb-4">Active Job Listings</h2>
                <p className="text-sm text-5 m-0">Manage your published roles and open drafts.</p>
              </div>
              <div className="row gap-12">
                <Link href="/careers" target="_blank" className="btn-neutral row gap-8" style={{ padding: '10px 16px', fontSize: 14 }}>
                  <ExternalLink size={16}/> View Careers Page
                </Link>
                <button className="btn-primary row gap-8" onClick={() => setViewState('create_job')} style={{ padding: '10px 16px', fontSize: 14 }}>
                  <Plus size={16}/> New Job Post
                </button>
              </div>
            </div>

            <div className="grid-2 gap-20">
              {jobs.map(job => (
                <Card key={job.id} style={{ border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
                  <CardBody style={{ padding: 24 }}>
                    <div className="row-between align-start mb-24">
                      <div className="row gap-16 align-center">
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: job.status === 'Published' ? 'var(--primary-tint)' : 'var(--bg-body)', color: job.status === 'Published' ? 'var(--primary)' : 'var(--text-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg fw-800 text-1 m-0 mb-4">{job.title}</h3>
                          <Badge variant={job.status === 'Published' ? 'success' : 'neutral'} style={{ fontSize: 12, padding: '2px 8px' }}>{job.status}</Badge>
                        </div>
                      </div>
                      
                      <div className="col gap-4 text-center">
                        <span className="text-2xl fw-800 text-1">{job.applicants}</span>
                        <span className="text-xs fw-700 text-4 uppercase tracking-wider">Candidates</span>
                      </div>
                    </div>

                    <div className="row gap-16 text-sm text-5 fw-500 mb-20" style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                      <span className="row gap-6 align-center"><LayoutDashboard size={14}/> {job.department}</span>
                      <span>•</span>
                      <span className="row gap-6 align-center"><MapPin size={14}/> {job.location}</span>
                      <span>•</span>
                      <span className="row gap-6 align-center"><Clock size={14}/> {job.daysOpen} days open</span>
                    </div>

                    <div className="row-between align-center">
                      <div className="row gap-12">
                        <button className="btn-secondary row gap-6" style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}><Edit size={14}/> Edit</button>
                        <select className="select" style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, fontWeight: 700, background: '#F9FAFB', border: '1px solid var(--border)', cursor: 'pointer', outline: 'none' }} defaultValue={job.status}>
                          <option value="Published">🟢 Active / Published</option>
                          <option value="Paused">🟡 Paused</option>
                          <option value="Closed">🔴 Closed / Finished</option>
                          <option value="Draft">⚪ Draft</option>
                        </select>
                      </div>
                      <Link href="/careers" target="_blank" className="text-primary text-sm fw-700 row gap-6" style={{ textDecoration: 'none' }}>Preview Job <ArrowRight size={14}/></Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- REPORTS TAB ---------------- */}
        {activeTab === 'Reports' && (
          <div style={{ padding: '16px 40px 64px 40px' }}>
            <div className="row-between align-center mb-24">
              <h2 className="text-2xl fw-800 text-1 m-0">Hiring Analytics</h2>
              <div className="row gap-12">
                <select className="select" style={{ padding: '10px 16px', fontWeight: 600, fontSize: 14 }}>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Year to Date</option>
                </select>
                <button className="btn-secondary row gap-8" style={{ padding: '10px 16px', fontSize: 14 }}><Download size={16}/> Export PDF</button>
              </div>
            </div>

            <div className="grid-3 gap-24 mb-24">
              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
                <CardBody style={{ padding: 24 }}>
                  <div className="row-between mb-16 text-5">
                    <span className="fw-700 uppercase tracking-wider text-xs">Time to Hire</span>
                    <Clock size={20} />
                  </div>
                  <h3 className="text-3xl fw-800 text-1 m-0 mb-8">18 Days</h3>
                  <div className="row gap-6 align-center text-sm fw-700 text-success">
                    <TrendingUp size={16}/> -12% vs last period
                  </div>
                </CardBody>
              </Card>
              
              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
                <CardBody style={{ padding: 24 }}>
                  <div className="row-between mb-16 text-5">
                    <span className="fw-700 uppercase tracking-wider text-xs">Total Candidates</span>
                    <Users size={20} />
                  </div>
                  <h3 className="text-3xl fw-800 text-1 m-0 mb-8">1,240</h3>
                  <div className="row gap-6 align-center text-sm fw-700 text-success">
                    <TrendingUp size={16}/> +24% vs last period
                  </div>
                </CardBody>
              </Card>

              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
                <CardBody style={{ padding: 24 }}>
                  <div className="row-between mb-16 text-5">
                    <span className="fw-700 uppercase tracking-wider text-xs">Cost per Hire</span>
                    <DollarSign size={20} />
                  </div>
                  <h3 className="text-3xl fw-800 text-1 m-0 mb-8">$4,200</h3>
                  <div className="row gap-6 align-center text-sm fw-700 text-danger">
                    <TrendingUp size={16}/> +5% vs last period
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="grid-2 gap-24 pb-48">
              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
                <CardBody style={{ padding: 32 }}>
                  <h3 className="text-xl fw-800 text-1 m-0 mb-24">Pipeline Funnel Conversion</h3>
                  <div className="col gap-20">
                    {[
                      { stage: 'Applied', count: 1240, percent: 100 },
                      { stage: 'Screened', count: 420, percent: 34 },
                      { stage: 'Interviewed', count: 115, percent: 9 },
                      { stage: 'Offered', count: 24, percent: 2 },
                      { stage: 'Hired', count: 18, percent: 1.5 },
                    ].map(funnel => (
                      <div key={funnel.stage} className="row align-center gap-16">
                        <div style={{ width: 100, fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{funnel.stage}</div>
                        <div style={{ flex: 1, background: 'var(--bg-body)', height: 24, borderRadius: 12, overflow: 'hidden' }}>
                          <div style={{ width: `${funnel.percent}%`, background: 'var(--primary)', height: '100%', borderRadius: 12 }} />
                        </div>
                        <div style={{ width: 60, textAlign: 'right', fontSize: 14, fontWeight: 700 }}>{funnel.count}</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
              
              <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 16 }}>
                <CardBody style={{ padding: 32 }}>
                  <h3 className="text-xl fw-800 text-1 m-0 mb-24">Source of Hire</h3>
                  <div className="col gap-24">
                    {[
                      { source: 'LinkedIn', percent: 45, color: '#0077B5' },
                      { source: 'Referrals', percent: 30, color: 'var(--success)' },
                      { type: 'Direct Website', percent: 15, color: 'var(--primary)' },
                      { type: 'Agency', percent: 10, color: 'var(--warning)' },
                    ].map(src => (
                      <div key={src.source || src.type} className="row align-center gap-16">
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: src.color }}/>
                        <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{src.source || src.type}</div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{src.percent}%</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

      </div>



    </div>
  );
}
