"use client";

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: SelectOption[];
  error?: string | boolean;
  helperText?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  searchable?: boolean;
  searchPlaceholder?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
}

function extractTextFromNode(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (React.isValidElement(node)) return extractTextFromNode((node.props as any)?.children);
  return '';
}

/**
 * Universal Select & Custom Dropdown with search support.
 * Works seamlessly with both:
 * 1. Conventional <option> children: <Select value={val} onChange={...}><option value="1">One</option></Select>
 * 2. Explicit options prop: <Select options={[{ value: 'a', label: 'Alpha' }]} searchable />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options: propOptions,
      error,
      helperText,
      containerClassName = '',
      containerStyle = {},
      className = '',
      style,
      value,
      defaultValue,
      onChange,
      onValueChange,
      searchable,
      searchPlaceholder = 'Search...',
      disabled,
      placeholder,
      name,
      children,
      ...props
    },
    ref
  ) => {
    // Hidden native select ref
    const nativeSelectRef = useRef<HTMLSelectElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // Track internal selected value
    const [selectedValue, setSelectedValue] = useState<string>(
      (value !== undefined ? value : defaultValue !== undefined ? defaultValue : '') as string
    );
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Keep internal value in sync with controlled value prop
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(String(value));
      }
    }, [value]);

    // Extract options from either propOptions or children <option> elements
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (propOptions && propOptions.length > 0) {
        return propOptions;
      }
      const list: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          const optProps = child.props as any;
          const textLabel = extractTextFromNode(optProps.children) || String(optProps.value || '');
          list.push({
            value: optProps.value !== undefined ? String(optProps.value) : textLabel,
            label: textLabel,
            disabled: !!optProps.disabled,
          });
        }
      });
      return list;
    }, [propOptions, children]);

    // Decide if search should be enabled (auto-enable when explicitly searchable or 3+ options)
    const isSearchable = searchable !== undefined ? searchable : parsedOptions.length >= 3;

    // Filtered options based on user search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return parsedOptions;
      const q = searchQuery.toLowerCase();
      return parsedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.description && opt.description.toLowerCase().includes(q))
      );
    }, [parsedOptions, searchQuery]);

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Auto-focus search input when opening dropdown
    useEffect(() => {
      if (isOpen && isSearchable) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    }, [isOpen, isSearchable]);

    // Find currently selected label
    const selectedOption = parsedOptions.find((opt) => opt.value === selectedValue);
    const displayLabel = selectedOption
      ? selectedOption.label
      : placeholder || (parsedOptions[0] ? parsedOptions[0].label : 'Select...');

    // Handle selecting an option
    const handleSelectOption = useCallback(
      (opt: SelectOption) => {
        if (opt.disabled || disabled) return;
        setSelectedValue(opt.value);
        setIsOpen(false);
        setSearchQuery('');

        if (onValueChange) {
          onValueChange(opt.value);
        }

        // Fire standard change event for react form state & compatibility
        if (onChange) {
          if (nativeSelectRef.current) {
            nativeSelectRef.current.value = opt.value;
            const event = new Event('change', { bubbles: true });
            nativeSelectRef.current.dispatchEvent(event);
          }
          onChange({
            target: {
              value: opt.value,
              name,
            },
          } as any);
        }
      },
      [disabled, name, onChange, onValueChange]
    );

    const hasError = !!error;
    const borderColor = hasError
      ? 'var(--danger, #D14343)'
      : isOpen
      ? 'var(--primary, #7c3aed)'
      : 'var(--card-border, #EAEAE4)';
    const boxShadow = isOpen
      ? hasError
        ? '0 0 0 3px rgba(209, 67, 67, 0.15)'
        : '0 0 0 3px var(--primary-tint, #F3E8FF)'
      : 'none';

    return (
      <div
        ref={containerRef}
        className={`col ${containerClassName}`}
        style={{ width: '100%', gap: '4px', position: 'relative', ...containerStyle }}
      >
        {/* Hidden native select for form accessibility / form submission */}
        <select
          ref={(node) => {
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
            nativeSelectRef.current = node;
          }}
          value={selectedValue}
          name={name}
          disabled={disabled}
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
          {...props}
        >
          {parsedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Dropdown Trigger Button */}
        <div
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          className={className}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: disabled ? '#F4F4F5' : 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            boxShadow,
            padding: '10px 14px',
            fontSize: '14px',
            color: disabled ? 'var(--text-4, #A1A1AA)' : 'var(--text-1, #1E1D19)',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            userSelect: 'none',
            ...style,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            {selectedOption?.icon && (
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {selectedOption.icon}
              </span>
            )}
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: selectedOption ? 500 : 400,
                color: selectedOption ? 'inherit' : 'var(--text-4, #71717A)',
              }}
            >
              {displayLabel}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-4, #71717A)',
              marginLeft: 8,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
          >
            <ChevronDown size={15} />
          </div>
        </div>

        {/* ─── Searchable Floating Dropdown Menu (Z-Index 9999) ─── */}
        {isOpen && !disabled && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid var(--card-border, #E4E4E7)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
              zIndex: 9999,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '300px',
              animation: 'fadeIn 0.12s ease',
            }}
          >
            {/* Optional Search Bar Input */}
            {isSearchable && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  background: '#F4F4F5',
                  borderRadius: '8px',
                  marginBottom: '6px',
                }}
              >
                <Search size={14} style={{ color: '#71717A', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '12.5px',
                    color: '#18181B',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#A1A1AA',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Options List */}
            <div
              style={{
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: '12.5px',
                    color: '#A1A1AA',
                  }}
                >
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === selectedValue;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelectOption(opt)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        color: opt.disabled
                          ? '#A1A1AA'
                          : isSelected
                          ? 'var(--primary, #7c3aed)'
                          : '#27272A',
                        background: isSelected ? 'var(--primary-tint, #F5F3FF)' : 'transparent',
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!opt.disabled && !isSelected) {
                          e.currentTarget.style.background = '#F4F4F5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!opt.disabled && !isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        {opt.icon && (
                          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {opt.icon}
                          </span>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span style={{ fontSize: '11px', color: '#71717A' }}>
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={14} style={{ color: 'var(--primary, #7c3aed)', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Error / Helper Text */}
        {(helperText || (typeof error === 'string' && error)) && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: hasError ? 'var(--danger, #D14343)' : 'var(--text-4, #66655A)',
              marginLeft: '4px',
            }}
          >
            {typeof error === 'string' && error ? error : helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
