import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Avatar } from './Avatar';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  avatar?: boolean;
  icon?: React.ReactNode;
  rightBadge?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  rightExtra?: (option: SelectOption) => React.ReactNode;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  style,
  className = '',
  disabled = false,
  size = 'md',
  rightExtra,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.description && o.description.toLowerCase().includes(search.toLowerCase())) ||
    (o.rightBadge && o.rightBadge.toLowerCase().includes(search.toLowerCase()))
  );

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ width: '100%', position: 'relative', ...style }}>
      {/* Trigger Button */}
      <button 
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          background: disabled ? '#F9FAFB' : 'white', 
          opacity: disabled ? 0.6 : 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: isSmall ? '6px 10px' : '9px 12px', 
          border: isOpen ? '1px solid var(--primary, #2563EB)' : '1px solid var(--border, #E5E7EB)', 
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          borderRadius: 8,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          minHeight: isSmall ? 36 : 42,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, paddingRight: 6 }}>
          {selectedOption ? (
            <>
              {selectedOption.avatar && <Avatar name={selectedOption.label} size={isSmall ? "sm" : "md"} />}
              {selectedOption.icon && <div style={{ color: 'var(--primary, #2563EB)', display: 'inline-flex' }}>{selectedOption.icon}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, textAlign: 'left', flex: 1 }}>
                <span style={{ fontWeight: 650, color: 'var(--text-1, #111827)', fontSize: isSmall ? 13 : 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {selectedOption.label}
                </span>
                {selectedOption.description && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-4, #9CA3AF)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {selectedOption.description}
                  </span>
                )}
              </div>
              {selectedOption.rightBadge && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: '#EFF6FF', color: 'var(--primary, #2563EB)', whiteSpace: 'nowrap', marginLeft: 'auto', marginRight: 6 }}>
                  {selectedOption.rightBadge}
                </span>
              )}
              {rightExtra && rightExtra(selectedOption)}
            </>
          ) : (
            <span style={{ color: 'var(--text-placeholder, #9CA3AF)', fontSize: isSmall ? 13 : 13.5 }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={isSmall ? 14 : 16} color="var(--text-4, #9CA3AF)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div 
          style={{ 
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999, 
            background: 'white', borderRadius: 10, 
            boxShadow: '0 12px 36px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
            border: '1px solid var(--border, #E5E7EB)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border, #E5E7EB)', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="var(--text-4, #9CA3AF)" />
            <input 
              autoFocus
              type="text" 
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13, color: 'var(--text-1, #111827)' }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, textAlign: 'center', color: 'var(--text-4, #9CA3AF)', fontSize: 13 }}>No options found.</div>
            ) : (
              filtered.map(o => {
                const isSelected = value === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', textAlign: 'left',
                      border: 'none',
                      background: isSelected ? 'var(--primary-light, #EFF6FF)' : 'transparent',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {o.avatar && <Avatar name={o.label} size="sm" />}
                    {o.icon && <div style={{ color: isSelected ? 'var(--primary, #2563EB)' : 'var(--text-3, #6B7280)', display: 'inline-flex' }}>{o.icon}</div>}
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: 650, color: isSelected ? 'var(--primary, #2563EB)' : 'var(--text-1, #111827)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {o.label}
                      </span>
                      {o.description && (
                        <span style={{ fontSize: 11.5, color: 'var(--text-4, #9CA3AF)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.description}
                        </span>
                      )}
                    </div>
                    {o.rightBadge && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: isSelected ? '#DBEAFE' : '#F3F4F6', color: isSelected ? '#1E40AF' : '#4B5563', whiteSpace: 'nowrap' }}>
                        {o.rightBadge}
                      </span>
                    )}
                    {rightExtra && rightExtra(o)}
                    {isSelected && <Check size={15} color="var(--primary, #2563EB)" style={{ flexShrink: 0, marginLeft: 4 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
