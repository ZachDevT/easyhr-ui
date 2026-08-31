"use client";

import React, { useState } from 'react';
import { Book, Plus, Search, MoreHorizontal, FileText, CheckSquare, UploadCloud, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatRibbon } from '@/components/ui/StatRibbon';

const POLICIES = [
  { id: 1, title: 'Employee Handbook 2026', category: 'General', lastUpdated: 'Jan 01, 2026', requiresSig: true, signatures: '110/111' },
  { id: 2, title: 'Remote Work Policy', category: 'Operations', lastUpdated: 'Mar 15, 2026', requiresSig: true, signatures: '45/111' },
  { id: 3, title: 'IT Security Guidelines', category: 'Security', lastUpdated: 'Sep 02, 2026', requiresSig: false, signatures: '-' },
  { id: 4, title: 'Holiday Schedule 2026', category: 'Time Off', lastUpdated: 'Dec 10, 2025', requiresSig: false, signatures: '-' },
  { id: 5, title: 'Code of Conduct', category: 'Compliance', lastUpdated: 'Aug 20, 2026', requiresSig: true, signatures: '111/111' },
];

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState('Policy Library');

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      
      <PageHeader 
        title="Company Policies"
        subtitle="Distribute handbooks, track compliance, and manage company rules."
        icon={<Book size={28} className="text-white" />}
        tabs={['Policy Library', 'Acknowledgments', 'Categories']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 20 }}>
            <UploadCloud size={16} style={{ marginRight: 8 }}/> Upload Policy
          </button>
        }
      />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--bg-page)' }}>
        
        {activeTab === 'Policy Library' && (
          <div className="col gap-32">
            
            <StatRibbon 
              stats={[
                { label: 'Total Policies', value: POLICIES.length, icon: <Book size={18}/>, color: 'var(--primary)', description: 'In company library' },
                { label: 'Pending Signatures', value: 67, icon: <CheckSquare size={18}/>, color: 'var(--warning)', trend: 'Remote Work Policy', trendType: 'negative', description: 'Employees not yet signed' },
                { label: 'Compliance Rate', value: '98%', icon: <ShieldAlert size={18}/>, color: 'var(--success)', trend: '+3% vs last quarter', trendType: 'positive', description: 'Across all active policies' }
              ]}
            />

            <div className="row-between align-center">
              <h2 className="text-xl fw-800 text-1 m-0">Document Repository</h2>
              <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 16px', width: 300 }}>
                <Search size={16} className="text-4" style={{ marginRight: 8 }} />
                <input type="text" placeholder="Search policies..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
              </div>
            </div>

            <div className="grid-2 gap-24">
              {POLICIES.map(policy => (
                <Card key={policy.id} style={{ borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer' }} className="hover-lift">
                  <CardBody className="p-24 col gap-16">
                    <div className="row-between align-start">
                      <div className="row gap-16 align-center">
                        <div className="icon-chip" style={{ background: 'var(--primary-tint)', color: 'var(--primary)', width: 48, height: 48 }}>
                          <FileText size={24} />
                        </div>
                        <div>
                          <h3 className="m-0 text-lg fw-700 text-1">{policy.title}</h3>
                          <span className="text-sm text-5 fw-600">Updated {policy.lastUpdated}</span>
                        </div>
                      </div>
                      <button className="btn-neutral" style={{ padding: 4, borderRadius: 6 }}><MoreHorizontal size={16}/></button>
                    </div>

                    <div className="row-between align-center pt-16 mt-8" style={{ borderTop: '1px dashed var(--border)' }}>
                      <Badge variant="neutral">{policy.category}</Badge>
                      {policy.requiresSig ? (
                        <div className="row gap-8 align-center text-sm">
                          <CheckSquare size={16} className={policy.signatures === '111/111' ? 'text-success' : 'text-warning'} />
                          <span className="fw-600 text-2">{policy.signatures} Signed</span>
                        </div>
                      ) : (
                        <span className="text-sm text-5">No signature required</span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Acknowledgments' && (
          <div className="col gap-24 align-center justify-center" style={{ minHeight: 400 }}>
             <div className="p-32 text-center col gap-16" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 450 }}>
                <div className="icon-chip" style={{ background: 'var(--warning-tint)', color: 'var(--warning)', width: 64, height: 64, margin: '0 auto' }}>
                  <Users size={32} />
                </div>
                <h3 className="m-0 text-xl fw-700 text-1">Missing Acknowledgments</h3>
                <p className="m-0 text-sm text-4">66 employees have not yet signed the new Remote Work Policy.</p>
                <button className="btn-primary mt-8 bg-warning border-none text-white fw-700" style={{ padding: '12px 24px', borderRadius: 8 }}>Send Reminders</button>
             </div>
          </div>
        )}

        {activeTab === 'Categories' && (
          <div className="col gap-24">
             <div className="p-32 text-center text-4">
                Policy Categories management coming soon...
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
