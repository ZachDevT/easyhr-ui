"use client";

import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export default function NewDepartmentPage() {
  const [deptColor, setDeptColor] = useState('#1A73E8');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', overflow: 'hidden' }}>
      
      {/* HEADER - Fixed at top */}
      <div className="px-40 py-24 border-b border-border row-between align-center bg-white" style={{ flexShrink: 0, zIndex: 10 }}>
        <div className="row gap-16 align-center">
          <Link href="/departments" className="btn-neutral" style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'white' }}>
            <ArrowLeft size={18} className="text-2" />
          </Link>
          <div className="col gap-4">
            <h1 className="m-0 text-xl fw-800 text-1">Create Department</h1>
            <p className="m-0 text-sm text-4 fw-500">Define a new branch in your organizational structure.</p>
          </div>
        </div>
        
        <div className="row gap-12 align-center">
          <Link href="/departments" className="btn-neutral fw-600 text-3 hover-text-1" style={{ padding: '8px 16px', borderRadius: 8, background: 'white' }}>Cancel</Link>
          <button className="btn-primary row gap-8 align-center" style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--gradient)', border: 'none', color: 'white', fontWeight: 700, boxShadow: '0 4px 12px rgba(162, 56, 255, 0.2)', cursor: 'pointer' }}>
            <Save size={16} /> Save Department
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        
        <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
          
          {/* General Info */}
          <div className="p-32 col gap-24 border-b border-border">
            <h2 className="m-0 text-lg fw-700 text-1">General Information</h2>
            
            <div className="grid-2 gap-20">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Department Name <span className="text-error">*</span></label>
                <Input type="text" placeholder="e.g. Engineering" />
              </div>
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Department Code <span className="text-error">*</span></label>
                <Input type="text" placeholder="e.g. ENG" />
              </div>
            </div>

            <div className="col gap-8">
              <label className="text-sm fw-600 text-2">Description</label>
              <Textarea placeholder="Briefly describe the purpose of this department..." style={{ minHeight: 100, resize: 'vertical' }} />
            </div>

            <div className="col gap-12 mt-8">
              <label className="text-sm fw-600 text-2">Theme Color</label>
              <div className="row gap-12 align-center">
                {['#1A73E8', '#EA4335', '#F9AB00', '#34A853', '#9334E6', '#000000', '#64748B'].map(color => (
                  <button 
                    key={color}
                    onClick={() => setDeptColor(color)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: deptColor === color ? '3px solid white' : 'none', outline: deptColor === color ? `2px solid ${color}` : '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hierarchy & Leadership */}
          <div className="p-32 col gap-24 border-b border-border">
            <h2 className="m-0 text-lg fw-700 text-1">Hierarchy & Leadership</h2>
            
            <div className="grid-2 gap-20">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Parent Department</label>
                <Select>
                  <option>None (Top Level)</option>
                  <option>Product & Engineering</option>
                  <option>Sales & Marketing</option>
                </Select>
              </div>
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Department Head</label>
                <Select>
                  <option>Select an employee...</option>
                  <option>Sarah Johnson</option>
                  <option>Michael Chang</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Operational Settings */}
          <div className="p-32 col gap-24">
            <h2 className="m-0 text-lg fw-700 text-1">Operational Settings</h2>
            
            <div className="grid-2 gap-20">
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Cost Center</label>
                <Select>
                  <option>Select cost center...</option>
                  <option>CC-100 (R&D)</option>
                  <option>CC-200 (Sales)</option>
                </Select>
              </div>
              <div className="col gap-8">
                <label className="text-sm fw-600 text-2">Default Slack Channel</label>
                <Input type="text" placeholder="e.g. #dept-engineering" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
