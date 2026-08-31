"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { FileText, Briefcase, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CareerJobPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-tint)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <FileText size={40}/>
        </div>
        <h1 className="text-4xl fw-800 text-1 mb-16 text-center">Application Received!</h1>
        <p className="text-lg text-5 mb-32 text-center max-w-md">Thank you for applying to the Senior Backend Engineer role at EasyHR. Our team will review your application and be in touch soon.</p>
        <Link href="/careers" className="btn-primary" style={{ padding: '16px 32px', fontSize: 16, textDecoration: 'none' }}>Back to Careers</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'var(--font-sans)', paddingBottom: 100 }}>
      {/* Fake Company Public Header */}
      <div style={{ background: '#111827', padding: '24px 48px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/careers" style={{ textDecoration: 'none' }}>
          <div className="row gap-12 align-center">
            <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>
              E
            </div>
            <span className="fw-800 text-xl text-white">EasyHR Careers</span>
          </div>
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '40px auto' }}>
        <Card style={{ border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', overflow: 'visible' }}>
          <CardBody style={{ padding: 0 }}>
            {/* Job Header */}
            <div style={{ padding: '48px 48px 32px 48px', borderBottom: '1px solid var(--border)' }}>
              <div className="row gap-12 mb-24">
                <Badge variant="primary" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>Engineering</Badge>
                <Badge variant="neutral">Remote</Badge>
                <Badge variant="neutral">Full-Time</Badge>
              </div>
              <h1 className="text-4xl fw-800 text-1 m-0 mb-16">Senior Backend Engineer</h1>
              <p className="text-lg text-5 m-0 mb-32">$140,000 — $180,000 USD</p>
              
              {step === 1 && (
                <button className="btn-primary" style={{ padding: '16px 40px', fontSize: 18, borderRadius: 8 }} onClick={() => setStep(2)}>
                  Apply for this Job
                </button>
              )}
            </div>

            {/* Job Description OR Application Form */}
            <div style={{ padding: '48px' }}>
              {step === 1 ? (
                <div className="col gap-24 text-base text-2" style={{ lineHeight: 1.7 }}>
                  <h3 className="text-xl fw-800 text-1 m-0">About the Role</h3>
                  <p>We are looking for an experienced engineer to join our core product team. You will be responsible for architecting high-performance distributed systems, mentoring junior engineers, and driving technical strategy for our platform.</p>
                  
                  <h3 className="text-xl fw-800 text-1 m-0 mt-16">Requirements</h3>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <li>5+ years of experience with Node.js and TypeScript.</li>
                    <li>Deep understanding of PostgreSQL and database optimization.</li>
                    <li>Experience with Docker, Kubernetes, and AWS infrastructure.</li>
                    <li>Ability to write clean, maintainable, and well-tested code.</li>
                  </ul>
                  
                  <h3 className="text-xl fw-800 text-1 m-0 mt-16">Benefits</h3>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <li>Fully remote work with flexible hours.</li>
                    <li>Comprehensive health, dental, and vision insurance.</li>
                    <li>Unlimited PTO and generous parental leave.</li>
                    <li>Annual home-office stipend.</li>
                  </ul>
                </div>
              ) : (
                <div className="col gap-40">
                  <div>
                    <h2 className="text-3xl fw-800 text-1 m-0 mb-12">Submit your Application</h2>
                    <p className="text-lg text-5 m-0">Please fill out the form below to apply for the Senior Backend Engineer role.</p>
                  </div>

                  <div className="col gap-24">
                    <h3 className="text-xl fw-800 text-1 m-0">Personal Information</h3>
                    <div className="grid-2 gap-24">
                      <div className="col gap-12">
                        <label className="text-sm fw-700 text-1">First Name *</label>
                        <input type="text" className="input" placeholder="e.g. Jane" />
                      </div>
                      <div className="col gap-12">
                        <label className="text-sm fw-700 text-1">Last Name *</label>
                        <input type="text" className="input" placeholder="e.g. Doe" />
                      </div>
                    </div>
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Email Address *</label>
                      <input type="email" className="input" placeholder="e.g. jane@example.com" />
                    </div>
                    <div className="col gap-12">
                      <label className="text-sm fw-700 text-1">Phone Number</label>
                      <input type="tel" className="input" placeholder="e.g. (555) 123-4567" />
                    </div>
                  </div>

                  <div className="divider m-0" />

                  <div className="col gap-24">
                    <h3 className="text-xl fw-800 text-1 m-0">Application Questions</h3>
                    <div className="col gap-32">
                      <div className="col gap-12">
                        <label className="text-sm fw-700 text-1">Resume / CV *</label>
                        <div className="col gap-12 align-center justify-center p-32" style={{ border: '2px dashed var(--border)', borderRadius: 12, background: '#F9FAFB' }}>
                          <FileText size={32} className="text-4 mb-8" />
                          <span className="fw-600 text-1">Click to upload or drag & drop</span>
                          <span className="text-sm text-5">PDF, DOCX up to 10MB</span>
                        </div>
                      </div>
                      
                      <div className="col gap-12">
                        <label className="text-sm fw-700 text-1">Portfolio URL</label>
                        <input type="text" className="input" placeholder="https://" />
                      </div>
                      
                      <div className="col gap-12">
                        <label className="text-sm fw-700 text-1">Years of Experience with Node.js *</label>
                        <select className="select">
                          <option value="">Select an option...</option>
                          <option>0-2 years</option>
                          <option>3-5 years</option>
                          <option>5+ years</option>
                        </select>
                      </div>
                      
                      <div className="col gap-12">
                        <label className="text-sm fw-700 text-1">Do you require visa sponsorship? *</label>
                        <label className="row gap-12 align-center cursor-pointer p-16" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid var(--border)' }}>
                          <input type="checkbox" style={{ width: 18, height: 18 }} />
                          <span className="text-base text-1 fw-500">Yes, I require sponsorship</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="divider m-0" />
                  
                  <button className="btn-primary" style={{ padding: '16px', fontSize: 18, borderRadius: 8, width: '100%' }} onClick={() => setSubmitted(true)}>
                    Submit Application
                  </button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
