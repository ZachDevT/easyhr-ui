"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, MessageSquare, Users, Check, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useRole } from '@/context/RoleContext';
import { Employee } from '@/data/employees';

interface StartDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDMStarted?: () => void;
}

export function StartDMModal({ isOpen, onClose, onDMStarted }: StartDMModalProps) {
  const { allEmployees, openOrCreateDM } = useChat();
  const { currentUser } = useRole();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIds([]);
      setError('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentUserId = String(currentUser?.id || '');
  const currentUserEmpId = (currentUser as any)?.employeeId ? String((currentUser as any).employeeId) : '';

  // Filter out self and match search
  const availableEmployees = useMemo(() => {
    const term = search.toLowerCase().trim();
    return allEmployees.filter((emp) => {
      const empIdStr = String(emp.id);
      if (empIdStr === currentUserId || (currentUserEmpId && empIdStr === currentUserEmpId)) {
        return false;
      }
      if (!term) return true;
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const title = (emp.title || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      return fullName.includes(term) || title.includes(term) || dept.includes(term);
    });
  }, [allEmployees, currentUserId, currentUserEmpId, search]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartDM = async (targetId?: string) => {
    const idsToMessage = targetId ? [targetId] : selectedIds;
    if (idsToMessage.length === 0) {
      setError('Please select at least one coworker.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      if (idsToMessage.length === 1) {
        const emp = allEmployees.find((e) => String(e.id) === idsToMessage[0]);
        const name = emp ? `${emp.firstName} ${emp.lastName}`.trim() : '';
        await openOrCreateDM(idsToMessage[0], name);
      } else {
        // Group DM
        const names = idsToMessage
          .map((id) => {
            const e = allEmployees.find((emp) => String(emp.id) === id);
            return e ? e.firstName : '';
          })
          .filter(Boolean)
          .join(', ');
        await openOrCreateDM(idsToMessage[0], names);
      }
      onDMStarted?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to start direct message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--card-border, #E4E4E7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF9F7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--card-border, #E4E4E7)',
                color: 'var(--primary, #A238FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={16} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: 'var(--font-title)',
                  color: 'var(--text-1, #18181B)',
                }}
              >
                New DM
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-3, #A1A1AA)', margin: '1px 0 0 0' }}>
                Chat 1:1 or select multiple people for a group DM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-3, #A1A1AA)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--card-border, #E4E4E7)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#FAF9F7',
              border: '1px solid var(--card-border, #E4E4E7)',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-3, #A1A1AA)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type a name, role or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                color: 'var(--text-1, #18181B)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-3, #A1A1AA)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Selected Badges (if multi-selecting) */}
        {selectedIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: '8px 18px',
              background: '#FDFCFB',
              borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', alignSelf: 'center' }}>
              To:
            </span>
            {selectedIds.map((id) => {
              const emp = allEmployees.find((e) => String(e.id) === id);
              if (!emp) return null;
              return (
                <span
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#F5EEFF',
                    color: '#7C3AED',
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  {emp.firstName} {emp.lastName}
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#7C3AED',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '8px 18px',
              background: '#FEF2F2',
              color: '#DC2626',
              fontSize: 12,
              borderBottom: '1px solid #FEE2E2',
            }}
          >
            {error}
          </div>
        )}

        {/* Coworkers List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0', minHeight: 220, maxHeight: 340 }}>
          {availableEmployees.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-3, #A1A1AA)' }}>
              <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>No coworkers found</div>
              <div style={{ fontSize: 11.5, marginTop: 2 }}>Try searching for a different name</div>
            </div>
          ) : (
            availableEmployees.map((emp) => {
              const empIdStr = String(emp.id);
              const isSelected = selectedIds.includes(empIdStr);
              const fullName = `${emp.firstName} ${emp.lastName}`.trim();
              return (
                <div
                  key={emp.id}
                  onClick={() => handleToggleSelect(empIdStr)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 18px',
                    cursor: 'pointer',
                    background: isSelected ? '#FAF5FF' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary, #A238FF)' : '3px solid transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#FAF9F7';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {/* Avatar with Presence Indicator */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: '1px solid var(--card-border, #E4E4E7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--text-1, #18181B)',
                          overflow: 'hidden',
                        }}
                      >
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={fullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 0,
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: '#10B981',
                          border: '2px solid #FFFFFF',
                        }}
                      />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-1, #18181B)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {fullName}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-3, #A1A1AA)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 1,
                        }}
                      >
                        {emp.title || 'Team Member'} {emp.department ? `· ${emp.department}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Quick Message Button or Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {selectedIds.length === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartDM(empIdStr);
                        }}
                        disabled={isSubmitting}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 7,
                          border: '1px solid var(--card-border, #E4E4E7)',
                          background: '#FFFFFF',
                          color: 'var(--text-2, #52525B)',
                          fontSize: 11.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Chat
                      </button>
                    ) : (
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          border: isSelected
                            ? '1px solid var(--primary, #A238FF)'
                            : '1px solid var(--card-border, #E4E4E7)',
                          background: isSelected ? 'var(--primary, #A238FF)' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--card-border, #E4E4E7)',
            background: '#FAF9F7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--text-3, #A1A1AA)' }}>
            {selectedIds.length > 0
              ? `${selectedIds.length} person${selectedIds.length > 1 ? 's' : ''} selected`
              : 'Click any person to chat directly'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--card-border, #E4E4E7)',
                background: '#FFFFFF',
                color: 'var(--text-2, #52525B)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleStartDM()}
              disabled={isSubmitting || selectedIds.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: selectedIds.length > 0 ? 'var(--primary, #A238FF)' : '#E4E4E7',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: selectedIds.length > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                boxShadow: selectedIds.length > 0 ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <span>
                  {selectedIds.length > 1 ? 'Start Group DM' : 'Start DM'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
