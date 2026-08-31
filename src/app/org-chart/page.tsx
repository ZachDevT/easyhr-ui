"use client";

import { useMemo, useState } from 'react';
import { Network, Plus, Minus, Search, ZoomIn, ZoomOut, Maximize, Building, MapPin, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { employees } from '@/data/employees';

// CSS for the tree layout
const treeStyles = `
.org-tree ul {
  padding-top: 30px; 
  position: relative;
  transition: all 0.5s;
  display: flex;
  justify-content: center;
}
.org-tree li {
  float: left; text-align: center;
  list-style-type: none;
  position: relative;
  padding: 30px 15px 0 15px;
  transition: all 0.5s;
}
/* We use ::before and ::after to draw the connectors */
.org-tree li::before, .org-tree li::after {
  content: '';
  position: absolute; top: 0; right: 50%;
  border-top: 2px solid var(--border);
  width: 50%; height: 30px;
}
.org-tree li::after {
  right: auto; left: 50%;
  border-left: 2px solid var(--border);
}
/* We need to remove left-right connectors from elements without any siblings */
.org-tree li:only-child::after, .org-tree li:only-child::before {
  display: none;
}
/* Remove space from the top of single children */
.org-tree li:only-child { padding-top: 0;}
/* Remove left connector from first child and right connector from last child */
.org-tree li:first-child::before, .org-tree li:last-child::after {
  border: 0 none;
}
/* Adding back the vertical connector to the last nodes */
.org-tree li:last-child::before {
  border-right: 2px solid var(--border);
  border-radius: 0 6px 0 0;
}
.org-tree li:first-child::after {
  border-radius: 6px 0 0 0;
}
/* Time to add downward connectors from parents */
.org-tree ul ul::before {
  content: '';
  position: absolute; top: 0; left: 50%;
  border-left: 2px solid var(--border);
  width: 0; height: 30px;
}
.org-node-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: white;
  padding: 0;
  display: inline-flex;
  flex-direction: column;
  min-width: 240px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
  position: relative;
  text-align: left;
  overflow: hidden;
}
.org-node-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(162, 56, 255, 0.15);
  z-index: 10;
}
`;

function OrgNode({ employee, allEmployees }: { employee: any, allEmployees: any[] }) {
  const directReports = allEmployees.filter(e => e.manager === `${employee.firstName} ${employee.lastName}`);
  const [expanded, setExpanded] = useState(true);
  
  return (
    <li>
      <div className="org-node-card">
        {/* Top Color Banner */}
        <div style={{ height: 4, background: 'var(--gradient)', width: '100%' }} />
        
        <div style={{ padding: '20px 24px' }}>
          <div className="row gap-16 mb-16">
            <Avatar src={employee.avatar} name={`${employee.firstName} ${employee.lastName}`} size="lg" />
            <div>
              <div className="text-base fw-800 text-1">{employee.firstName} {employee.lastName}</div>
              <div className="text-xs fw-600 text-primary mt-2">{employee.title}</div>
            </div>
          </div>
          
          <div className="divider my-12" style={{ margin: '16px -24px', background: 'var(--bg-page)' }} />
          
          <div className="row-between text-xs text-5 mb-8">
            <div className="row gap-8"><Building size={14} /> {employee.department}</div>
          </div>
          <div className="row-between text-xs text-5">
            <div className="row gap-8"><MapPin size={14} /> {employee.location}</div>
          </div>
        </div>

        {directReports.length > 0 && (
          <div 
            onClick={() => setExpanded(!expanded)}
            style={{ 
              background: '#F9FAFB', 
              padding: '12px 24px', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-tint)'}
            onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
          >
            <div className="row gap-8 text-xs fw-700 text-1"><Users size={14} className="text-primary"/> {directReports.length} Reports</div>
            {expanded ? <Minus size={14} className="text-5" /> : <Plus size={14} className="text-5" />}
          </div>
        )}
      </div>
      
      {directReports.length > 0 && expanded && (
        <ul>
          {directReports.map((report) => (
            <OrgNode key={report.id} employee={report} allEmployees={allEmployees} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgChartPage() {
  const [zoom, setZoom] = useState(100);

  const rootEmployee = useMemo(() => {
    // Sarah Johnson is the top-level (HR Admin without a manager) in our mock data
    return employees.find(e => e.id === '1');
  }, []);

  return (
    <div className="page-container" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <style>{treeStyles}</style>
      
      <div className="row-between" style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)', flexShrink: 0 }}>
        <div>
          <h1 className="page-title text-primary m-0 flex items-center gap-12" style={{ fontSize: 24, fontWeight: 700 }}><Network size={24} /> Organization Chart</h1>
          <p className="text-sm text-4 mt-4">Navigate your company's reporting structure.</p>
        </div>
        
        {/* Pro Toolbar */}
        <div className="row gap-16">
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', width: 240 }}>
            <Search size={16} className="text-4" style={{ marginRight: 8 }} />
            <input 
              type="text" 
              placeholder="Search people..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%' }} 
            />
          </div>
          
          <div className="row" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <button className="btn-circle" style={{ border: 'none', borderRadius: 0, width: 42, height: 42, borderRight: '1px solid var(--border)' }} onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <ZoomOut size={16} />
            </button>
            <div style={{ width: 60, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{zoom}%</div>
            <button className="btn-circle" style={{ border: 'none', borderRadius: 0, width: 42, height: 42, borderLeft: '1px solid var(--border)' }} onClick={() => setZoom(Math.min(150, zoom + 10))}>
              <ZoomIn size={16} />
            </button>
          </div>
          
          <button className="btn-secondary" style={{ background: 'white' }}><Maximize size={16} /> Fullscreen</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: '#F4F4F4', position: 'relative' }}>
        
        {/* Subtle grid background pattern */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)', 
          backgroundSize: '24px 24px',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        <div style={{ minWidth: 'max-content', padding: '60px 80px', transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
          <div className="org-tree">
            <ul>
              {rootEmployee && <OrgNode employee={rootEmployee} allEmployees={employees} />}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
