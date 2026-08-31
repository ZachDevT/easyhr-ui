import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Avatar } from './Avatar';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  avatar?: boolean;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option...",
  searchPlaceholder = "Search..."
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative" ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Trigger Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', cursor: 'pointer', background: 'white', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedOption ? (
            <>
              {selectedOption.avatar && <Avatar name={selectedOption.label} size="sm" />}
              {selectedOption.icon && <div className="text-primary">{selectedOption.icon}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>{selectedOption.label}</span>
                {selectedOption.description && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{selectedOption.description}</span>}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-placeholder)', fontSize: 14 }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} color="var(--text-4)" />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div 
          style={{ 
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 9999, 
            background: 'white', borderRadius: 12, 
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Search Input */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Search size={16} color="var(--text-4)" />
            <input 
              autoFocus
              type="text" 
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 14 }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>No options found.</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, textAlign: 'left',
                    border: 'none',
                    background: value === o.value ? 'var(--primary-tint, #F3E8FD)' : 'transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== o.value) e.currentTarget.style.background = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== o.value) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {o.avatar && <Avatar name={o.label} size="sm" />}
                  {o.icon && <div className="text-primary">{o.icon}</div>}
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{o.label}</span>
                    {o.description && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{o.description}</span>}
                  </div>
                  {value === o.value && <Check size={16} color="var(--primary, #9334E6)" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
