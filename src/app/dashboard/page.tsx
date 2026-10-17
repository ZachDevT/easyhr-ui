"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { useCompany } from '@/context/CompanyContext';
import { useWidgets, MAX_WIDGETS } from '@/context/WidgetContext';
import { CompulsoryMyTimeWidget, CompulsoryTimeOffWidget, WIDGET_MAP, OPTIONAL_WIDGETS } from '@/components/widgets';
import { Modal } from '@/components/ui/Modal';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function Dashboard() {
  const router = useRouter();
  const { currentUser } = useRole();
  const { company, userProfile, isLoading } = useCompany();

  useEffect(() => {
    let isMounted = true;
    async function verifyMembership() {
      if (isLoading || company || userProfile) return;
      // Double check setup status to prevent false bounce loops
      try {
        const { API_BASE_URL, getWorkspaceUrl } = await import('@/lib/api');
        // If localStorage has company, let context hydrate
        const cached = localStorage.getItem('easyhr_company_cache');
        if (cached) return;
        router.replace('/company/register');
      } catch {
        if (isMounted) router.replace('/company/register');
      }
    }
    verifyMembership();
    return () => { isMounted = false; };
  }, [isLoading, company, userProfile, router]);
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
  const initials = `${currentUser.firstName?.[0] || 'H'}${currentUser.lastName?.[0] || 'A'}`;

  const { activeWidgets, removeWidget, addWidget, reorderWidgets } = useWidgets();
  
  const [isEditing, setIsEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  
  // Drag and drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // Small timeout to allow UI update after drag starts without breaking the drag image
    setTimeout(() => e.target && (e.target as HTMLElement).classList.add('dragging'), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    reorderWidgets(draggedIdx, index);
    setDraggedIdx(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIdx(null);
    if (e.target) (e.target as HTMLElement).classList.remove('dragging');
  };

  function togglePicker(id: string) {
    if (activeWidgets.includes(id)) {
      removeWidget(id);
    } else {
      addWidget(id);
    }
  }

  if (isLoading || (!company && !userProfile)) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* Profile header */}
      <div className="row-between mb-24">
        <div className="row gap-16">
          <div
            className="avatar"
            style={{ width: 84, height: 84, fontSize: 28, backgroundImage: 'var(--gradient)' }}
          >
            {currentUser.avatar
              ? <img src={currentUser.avatar} alt={fullName} />
              : <span>{initials}</span>
            }
          </div>
          <div>
            <h1
              className="gradient-text fw-800"
              style={{ fontSize: 32, letterSpacing: '-1px' }}
            >
              Hi, {currentUser.firstName}
            </h1>
            <p className="text-sm text-4 mt-4" style={{ fontWeight: 500 }}>
              {currentUser.title} {company?.name ? `· ${company.name}` : ''}
            </p>
          </div>
        </div>

        <div className="row gap-10">
          <Link 
            href="/people/me?tab=Personal"
            className="btn-neutral" 
            style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center' }}
          >
            Edit Profile
          </Link>
          <button 
            className="btn-neutral"
            onClick={() => setPickerOpen(true)}
            style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Widget Library
          </button>
          <button 
            className={isEditing ? "btn-primary" : "widget-manage-btn"} 
            onClick={() => setIsEditing(!isEditing)} 
            style={{ padding: '8px 16px' }}
          >
            {isEditing ? 'Done Editing' : 'Manage Widgets'}
            {!isEditing && <span className="limit-chip" style={{ marginLeft: 6 }}>{activeWidgets.length}/{MAX_WIDGETS}</span>}
          </button>
        </div>
      </div>

      {/* Main Layout: Left Column (Compulsory) + Right Column (Optional Widgets) */}
      <div className="dash-grid" style={{ gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column - Compulsory (Stays at its natural content height, completely unaffected by optional widgets) */}
        <div className="col gap-16" style={{ alignSelf: 'start', flexShrink: 0 }}>
          <CompulsoryMyTimeWidget />
          <CompulsoryTimeOffWidget />
        </div>

        {/* Right Column - Optional Widgets in a Grid */}
        <div className="dash-optional-widgets" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
          
          {activeWidgets.length === 0 && (
            <div
              className="card"
              style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center' }}
            >
              <p className="text-4 mb-12 text-sm">No optional widgets on your dashboard.</p>
              {!isEditing && <button className="btn-primary" onClick={() => setIsEditing(true)}>Add Widgets</button>}
            </div>
          )}

          {/* Render Active Widgets */}
          {activeWidgets.map((id, index) => {
            const Comp = WIDGET_MAP[id];
            if (!Comp) return null;
            return (
              <div 
                key={id}
                draggable={isEditing}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{ 
                  cursor: isEditing ? 'grab' : 'default',
                  opacity: draggedIdx === index ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', ...(isEditing ? { pointerEvents: 'none' } : {}) }}>
                  <Comp onRemove={isEditing ? () => removeWidget(id) : undefined} />
                </div>
                {isEditing && (
                  <button 
                    className="edit-remove-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWidget(id);
                    }}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Render Empty Placeholders in Edit Mode */}
          {isEditing && Array.from({ length: MAX_WIDGETS - activeWidgets.length }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="card widget-placeholder"
              onClick={() => setPickerOpen(true)}
            >
              <div className="widget-placeholder-content">
                <span className="plus-icon">+</span>
                <p>Click to add widget</p>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* CSS for Placeholders & Dragging */}
      <style>{`
        .widget-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--card-border) !important;
          background: transparent !important;
          min-height: 160px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .widget-placeholder:hover {
          border-color: var(--primary) !important;
          background: var(--primary-tint) !important;
        }
        .widget-placeholder-content {
          text-align: center;
          color: var(--text-5);
        }
        .widget-placeholder:hover .widget-placeholder-content {
          color: var(--primary);
        }
        .plus-icon {
          font-size: 24px;
          font-weight: 300;
          display: block;
          margin-bottom: 4px;
        }
        .dragging {
          transform: scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .edit-remove-badge {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: 3px solid var(--body-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 10;
          transition: transform 0.15s;
        }
        .edit-remove-badge:hover {
          transform: scale(1.1);
          background: #dc2626;
        }
        /* Hide the internal remove btn in edit mode to avoid confusion with the badge */
        .widget-remove-btn { display: none !important; }
      `}</style>

      {/* Add Widget Picker Modal */}
      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Widget Library"
        footer={<button className="btn-primary w-full" onClick={() => setPickerOpen(false)}>Done</button>}
      >
        <p className="text-sm text-5 mb-16 text-center">
          Customize your dashboard with up to <strong>{MAX_WIDGETS}</strong> optional widgets.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {OPTIONAL_WIDGETS.map((w, i) => {
            const sel = activeWidgets.includes(w.id);
            const dis = !sel && activeWidgets.length >= MAX_WIDGETS;
            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: i === OPTIONAL_WIDGETS.length - 1 ? 'none' : '1px solid var(--card-border)'
                }}
              >
                <div style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 12, 
                  background: 'var(--primary-tint)', 
                  color: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {w.icon}
                </div>
                <div style={{ flex: 1, marginLeft: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{w.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-5)', marginTop: 2 }}>{w.desc}</div>
                </div>
                {sel ? (
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: 'var(--primary)', 
                    background: 'var(--primary-tint)', 
                    padding: '6px 12px', 
                    borderRadius: 20 
                  }}>
                    Added
                  </span>
                ) : (
                  <button 
                    className="btn-secondary btn-sm" 
                    disabled={dis} 
                    onClick={() => togglePicker(w.id)}
                    style={{ padding: '6px 16px', borderRadius: 20 }}
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
