"use client";

import React, { useState } from 'react';
import { X, Lock, Hash, ShieldAlert, Building2, Search, Check } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { Select } from '@/components/ui/Select';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Human Resources',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
];

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const { createChannel, allEmployees } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [departmentRestricted, setDepartmentRestricted] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('Engineering');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleMember = (empId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const filteredEmployees = allEmployees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const q = memberSearch.toLowerCase();
    return fullName.includes(q) || dept.includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanName) {
      setError('Please enter a channel name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createChannel({
        name: cleanName,
        description: description.trim(),
        isPrivate,
        departmentRestricted,
        department: departmentRestricted ? selectedDepartment : undefined,
        memberIds: selectedMemberIds,
      });
      setName('');
      setDescription('');
      setIsPrivate(false);
      setDepartmentRestricted(false);
      setSelectedMemberIds([]);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(17, 17, 24, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid var(--card-border, #E4E4E7)',
          boxShadow: '0 24px 60px -12px rgba(17, 17, 24, 0.22)',
          overflow: 'hidden',
          color: 'var(--text-1, #18181B)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
            background: '#FAF9F7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--primary-light, #F5EBFF)',
                color: 'var(--primary, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPrivate ? <Lock size={18} /> : <Hash size={18} />}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 16, color: 'var(--text-1, #18181B)', margin: 0 }}>
                Create a Channel
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-3, #A1A1AA)', marginTop: 2 }}>
                Organize conversations around projects, teams, or departments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-3, #A1A1AA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                fontSize: 12,
              }}
            >
              <ShieldAlert size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--text-1, #18181B)',
                marginBottom: 6,
              }}
            >
              Channel Name <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3, #A1A1AA)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isPrivate ? <Lock size={14} /> : <Hash size={15} />}
              </span>
              <input
                type="text"
                placeholder="e.g. product-launch or design-critique"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="input"
                style={{
                  width: '100%',
                  paddingLeft: 34,
                  fontSize: 13,
                }}
                required
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', marginTop: 4 }}>
              Names are automatically formatted in lowercase with hyphens.
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--text-1, #18181B)',
                marginBottom: 6,
              }}
            >
              Topic / Description <span style={{ color: 'var(--text-3, #A1A1AA)' }}>(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="What is this channel used for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              style={{
                width: '100%',
                resize: 'none',
                fontSize: 13,
                padding: '9px 12px',
              }}
            />
          </div>

          {/* Access Control Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle, #F0F0F3)',
            }}
          >
            {/* Private Toggle */}
            <div
              onClick={() => setIsPrivate(!isPrivate)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                border: isPrivate ? '1px solid var(--primary, #2563EB)' : '1px solid var(--card-border, #E4E4E7)',
                background: isPrivate ? 'var(--primary-light, #F5EBFF)' : '#FAF9F7',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid var(--card-border, #E4E4E7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-1, #18181B)',
                    flexShrink: 0,
                  }}
                >
                  <Lock size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-1, #18181B)' }}>Private Channel</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2, #52525B)', marginTop: 2, lineHeight: 1.4 }}>
                    Only invited members or employees approved by the channel admin can view or join.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16, accentColor: 'var(--primary, #2563EB)', marginTop: 4, cursor: 'pointer' }}
              />
            </div>

            {/* Department Restricted Toggle */}
            <div
              onClick={() => setDepartmentRestricted(!departmentRestricted)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                border: departmentRestricted
                  ? '1px solid var(--primary, #2563EB)'
                  : '1px solid var(--card-border, #E4E4E7)',
                background: departmentRestricted ? 'var(--primary-light, #F5EBFF)' : '#FAF9F7',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid var(--card-border, #E4E4E7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-1, #18181B)',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-1, #18181B)' }}>Department Channel</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2, #52525B)', marginTop: 2, lineHeight: 1.4 }}>
                    Group under a specific company department and require admin approval for outside members.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={departmentRestricted}
                onChange={(e) => setDepartmentRestricted(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16, accentColor: 'var(--primary, #2563EB)', marginTop: 4, cursor: 'pointer' }}
              />
            </div>

            {departmentRestricted && (
              <div style={{ paddingTop: 4 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--text-1, #18181B)',
                    marginBottom: 6,
                  }}
                >
                  Department
                </label>
                <Select
                  searchable
                  searchPlaceholder="Search department..."
                  value={selectedDepartment}
                  onValueChange={(val) => setSelectedDepartment(val)}
                  options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                />
              </div>
            )}
          </div>

          {/* Initial Members Selection */}
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle, #F0F0F3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--text-1, #18181B)' }}>Add Team Members</label>
              <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)' }}>
                {selectedMemberIds.length} selected
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3, #A1A1AA)',
                }}
              />
              <input
                type="text"
                placeholder="Search colleagues by name or department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  fontSize: 12,
                }}
              />
            </div>

            <div
              style={{
                maxHeight: 150,
                overflowY: 'auto',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 12,
                padding: 6,
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {filteredEmployees.map((emp) => {
                const empId = String(emp.id);
                const isSelected = selectedMemberIds.includes(empId);
                const empFullName = `${emp.firstName} ${emp.lastName}`.trim();
                return (
                  <div
                    key={empId}
                    onClick={() => handleToggleMember(empId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-light, #F5EBFF)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: '#F4F4F5',
                          color: 'var(--text-1, #18181B)',
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid var(--card-border, #E4E4E7)',
                        }}
                      >
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={empFullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          empFullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-1, #18181B)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {empFullName}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)' }}>
                        · {emp.department}
                      </span>
                    </div>

                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: isSelected
                          ? '1px solid var(--primary, #2563EB)'
                          : '1px solid var(--card-border, #E4E4E7)',
                        background: isSelected ? 'var(--primary, #2563EB)' : '#FFFFFF',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle, #F0F0F3)',
            }}
          >
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-neutral">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
