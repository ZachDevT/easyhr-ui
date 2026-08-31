"use client";

import { useState } from 'react';
import { Search, Filter, Mail, Phone, MapPin, MoreHorizontal, UserPlus, Building, Briefcase, Calendar, ChevronRight, X } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { employees } from '@/data/employees';

export default function PeopleDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any>(employees[0]);

  const filtered = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
      
      {/* Fixed Header */}
      <div className="row-between" style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)', flexShrink: 0 }}>
        <div>
          <h1 className="page-title text-primary m-0" style={{ fontSize: 24, fontWeight: 700 }}>People Directory</h1>
          <p className="text-sm text-4 mt-4">Find and connect with your colleagues.</p>
        </div>
        <div className="row gap-16">
          <button className="btn-secondary" style={{ background: 'white' }}>
            <Filter size={14} /> Filters
          </button>
          <button className="btn-primary">
            <UserPlus size={14} /> Add Person
          </button>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Pane: List */}
        <div style={{ width: 400, borderRight: '1px solid var(--border)', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', width: '100%' }}>
              <Search size={18} className="text-4" style={{ marginRight: 12 }} />
              <input 
                type="text" 
                placeholder="Search by name, role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%', color: 'var(--text-1)' }} 
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((emp) => (
              <div 
                key={emp.id} 
                onClick={() => setSelectedEmp(emp)}
                className="row-between"
                style={{ 
                  padding: '16px 24px', 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer',
                  background: selectedEmp?.id === emp.id ? 'var(--primary-tint)' : 'white',
                  borderLeft: selectedEmp?.id === emp.id ? '4px solid var(--primary)' : '4px solid transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div className="row gap-16">
                  <Avatar src={emp.avatar} name={`${emp.firstName} ${emp.lastName}`} size="md" />
                  <div>
                    <div className="text-sm fw-700 text-1" style={{ color: selectedEmp?.id === emp.id ? 'var(--primary)' : 'var(--text-1)' }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-xs text-5 mt-2">{emp.title}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-4" style={{ opacity: selectedEmp?.id === emp.id ? 1 : 0 }} />
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Search size={24} className="text-5 mb-16 mx-auto" />
                <p className="text-sm fw-600 text-1">No results found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Details */}
        <div style={{ flex: 1, background: 'var(--bg-page)', overflowY: 'auto', position: 'relative' }}>
          {selectedEmp ? (
            <div>
              {/* Hero Background */}
              <div style={{ height: 180, background: 'var(--gradient)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 48px 24px 196px' }}>
                <button className="btn-circle" style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
                  <MoreHorizontal size={18} />
                </button>
                <h2 className="text-3xl fw-800 mb-4" style={{ color: 'white' }}>{selectedEmp.firstName} {selectedEmp.lastName}</h2>
                <p className="text-base fw-600" style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedEmp.title}</p>
              </div>
              
              <div style={{ padding: '0 48px 48px 48px', position: 'relative', zIndex: 10 }}>
                {/* Absolute Overlapping Avatar */}
                <div style={{ position: 'absolute', top: -100, left: 48, width: 130, height: 130, borderRadius: 16, background: 'var(--bg-page)', padding: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <img src={selectedEmp.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
                </div>

                {/* Actions & Badge Row */}
                <div className="row-between align-end mb-32" style={{ paddingTop: 16 }}>
                  <div style={{ paddingLeft: 148 }}>
                    <Badge variant="success" style={{ padding: '4px 12px' }}>Active</Badge>
                  </div>
                  
                  <div className="row gap-12">
                    <button className="btn-secondary" style={{ background: 'white' }}><Mail size={16} /> Email</button>
                    <button className="btn-secondary" style={{ background: 'white' }}><Phone size={16} /> Call</button>
                  </div>
                </div>

                <div className="grid-2 gap-32">
                  
                  <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                      <h3 className="text-sm fw-700 text-1">Work Information</h3>
                    </div>
                    <CardBody style={{ padding: '24px' }}>
                      <div className="col-stack gap-20">
                        <div className="row gap-16">
                          <div className="icon-chip" style={{ width: 40, height: 40, background: '#F9FAFB', color: 'var(--text-3)' }}><Building size={16} /></div>
                          <div>
                            <div className="text-xs text-5 mb-2">Department</div>
                            <div className="text-sm fw-600 text-1">{selectedEmp.department}</div>
                          </div>
                        </div>
                        <div className="row gap-16">
                          <div className="icon-chip" style={{ width: 40, height: 40, background: '#F9FAFB', color: 'var(--text-3)' }}><MapPin size={16} /></div>
                          <div>
                            <div className="text-xs text-5 mb-2">Location</div>
                            <div className="text-sm fw-600 text-1">{selectedEmp.location}</div>
                          </div>
                        </div>
                        <div className="row gap-16">
                          <div className="icon-chip" style={{ width: 40, height: 40, background: '#F9FAFB', color: 'var(--text-3)' }}><Briefcase size={16} /></div>
                          <div>
                            <div className="text-xs text-5 mb-2">Employment Type</div>
                            <div className="text-sm fw-600 text-1">Full-Time</div>
                          </div>
                        </div>
                        <div className="row gap-16">
                          <div className="icon-chip" style={{ width: 40, height: 40, background: '#F9FAFB', color: 'var(--text-3)' }}><Calendar size={16} /></div>
                          <div>
                            <div className="text-xs text-5 mb-2">Hire Date</div>
                            <div className="text-sm fw-600 text-1">{selectedEmp.hireDate || 'Jan 15, 2024'}</div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: 'none', height: 'fit-content' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                      <h3 className="text-sm fw-700 text-1">Reporting Structure</h3>
                    </div>
                    <CardBody style={{ padding: '24px' }}>
                      <div className="text-xs text-5 mb-8">Manager</div>
                      <div className="row gap-12 p-12 mb-24" style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <Avatar name={selectedEmp.manager || 'No Manager'} size="md" />
                        <div>
                          <div className="text-sm fw-700 text-1">{selectedEmp.manager || 'N/A'}</div>
                          <div className="text-xs text-5 mt-2">Manager</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-5 mb-8">Direct Reports</div>
                      <div style={{ padding: '20px', background: 'var(--primary-tint)', borderRadius: 8, textAlign: 'center' }}>
                        <p className="text-2xl fw-800 text-primary mb-4">
                          {employees.filter(e => e.manager === `${selectedEmp.firstName} ${selectedEmp.lastName}`).length}
                        </p>
                        <p className="text-xs text-primary fw-600">Team Members</p>
                      </div>
                    </CardBody>
                  </Card>

                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-5)' }}>
              Select an employee to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
