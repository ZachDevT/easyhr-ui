"use client";

import React, { useState } from 'react';
import { X, Lock, Hash, Users, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

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

const PRESET_EMOJIS = ['💬', '🚀', '⚡', '💡', '🎨', '🎯', '📢', '🔥', '🛠️', '🔒'];

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const { createChannel, allEmployees } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [departmentRestricted, setDepartmentRestricted] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('Engineering');
  const [selectedEmoji, setSelectedEmoji] = useState('💬');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleToggleMember = (empId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanName) {
      setError('Please provide a channel name');
      return;
    }

    try {
      createChannel({
        name: cleanName,
        description: description.trim(),
        isPrivate,
        departmentRestricted,
        department: departmentRestricted ? selectedDepartment : undefined,
        memberIds: selectedMemberIds,
        iconEmoji: selectedEmoji,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create group');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              {selectedEmoji}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create a Group Channel</h2>
              <p className="text-xs text-gray-500">Channels are where team members communicate and collaborate.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          {/* Emoji avatar selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Choose Channel Icon</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 text-lg rounded-lg border transition-all flex items-center justify-center ${
                    selectedEmoji === emoji 
                      ? 'border-purple-600 bg-purple-50 scale-110 shadow-sm' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Channel Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">#</div>
              <input
                type="text"
                placeholder="e.g. project-apollo or design-critique"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                required
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Lowercase, letters, numbers, and hyphens only.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Topic or Purpose (Optional)</label>
            <textarea
              rows={2}
              placeholder="What is this channel about? (e.g. Product design questions and feedback)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-none"
            />
          </div>

          {/* Privacy & Control Toggles */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {/* Private Channel Toggle */}
            <div className="flex items-start justify-between gap-3 p-3 bg-gray-50/70 rounded-xl border border-gray-200">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 mt-0.5">
                  <Lock size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">Make Private</div>
                  <div className="text-[11px] text-gray-500 leading-tight">
                    When private, a channel cannot be joined freely. Non-members must request access and be approved by the channel admin.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 mt-1 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* Department Restriction Toggle */}
            <div className="flex items-start justify-between gap-3 p-3 bg-gray-50/70 rounded-xl border border-gray-200">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 mt-0.5">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">Department Restricted</div>
                  <div className="text-[11px] text-gray-500 leading-tight">
                    Restricts visibility to employees belonging to a specific department.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={departmentRestricted}
                onChange={(e) => setDepartmentRestricted(e.target.checked)}
                className="w-4 h-4 mt-1 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* Department dropdown selector if restricted */}
            {departmentRestricted && (
              <div className="pl-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Initial Members Multi-select */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Invite Initial Team Members</label>
              <span className="text-[11px] text-gray-400 font-medium">{selectedMemberIds.length} selected</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-2 bg-white">
              {allEmployees.map(emp => {
                const isSelected = selectedMemberIds.includes(String(emp.id));
                const empFullName = `${emp.firstName} ${emp.lastName}`.trim();
                return (
                  <div 
                    key={emp.id}
                    onClick={() => handleToggleMember(String(emp.id))}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center overflow-hidden">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt={empFullName} className="w-full h-full object-cover" />
                        ) : (
                          empFullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-800">{empFullName}</span>
                      <span className="text-[10px] text-gray-400">({emp.department})</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      className="accent-purple-600 rounded pointer-events-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl shadow-sm transition-all"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
