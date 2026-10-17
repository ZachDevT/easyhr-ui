"use client";

import React, { forwardRef, useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  error?: string | boolean;
  helperText?: string;
  className?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Custom DatePicker component featuring a calendar popover,
 * year/month fast-nav, quick presets (Today, Tomorrow, Next Week), and manual typing.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder = 'Select date (YYYY-MM-DD)',
      name,
      disabled,
      minDate,
      maxDate,
      error,
      helperText,
      className = '',
      style,
      containerStyle,
      required,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : ''
    );
    const [isOpen, setIsOpen] = useState(false);

    // Keep internal state in sync with controlled value prop
    useEffect(() => {
      if (value !== undefined) {
        setSelectedDate(value);
      }
    }, [value]);

    // View month & year inside the calendar dropdown
    const initialDateObj = selectedDate ? new Date(selectedDate) : new Date();
    const [viewYear, setViewYear] = useState<number>(
      !isNaN(initialDateObj.getTime()) ? initialDateObj.getFullYear() : new Date().getFullYear()
    );
    const [viewMonth, setViewMonth] = useState<number>(
      !isNaN(initialDateObj.getTime()) ? initialDateObj.getMonth() : new Date().getMonth()
    );

    // Sync view when opened
    useEffect(() => {
      if (isOpen && selectedDate) {
        const d = new Date(selectedDate);
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      }
    }, [isOpen, selectedDate]);

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Compute calendar grid days
    const calendarDays = useMemo(() => {
      const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

      const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

      // Leading days from previous month
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
        const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
        const mm = String(prevMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        days.push({ dateStr: `${prevYear}-${mm}-${dd}`, dayNum: d, isCurrentMonth: false });
      }

      // Current month days
      for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        days.push({ dateStr: `${viewYear}-${mm}-${dd}`, dayNum: d, isCurrentMonth: true });
      }

      // Trailing days from next month to fill grid (multiple of 7)
      const remaining = 42 - days.length;
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        const mm = String(nextMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        days.push({ dateStr: `${nextYear}-${mm}-${dd}`, dayNum: d, isCurrentMonth: false });
      }

      return days;
    }, [viewYear, viewMonth]);

    const handleSelectDay = (dateStr: string) => {
      if (disabled) return;
      setSelectedDate(dateStr);
      setIsOpen(false);

      if (onValueChange) {
        onValueChange(dateStr);
      }
      if (onChange) {
        onChange({ target: { value: dateStr, name } });
      }
    };

    const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek') => {
      const d = new Date();
      if (preset === 'tomorrow') d.setDate(d.getDate() + 1);
      if (preset === 'nextWeek') d.setDate(d.getDate() + 7);
      const iso = d.toISOString().split('T')[0];
      handleSelectDay(iso);
    };

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

    // Format human-friendly preview
    const formatDisplay = (iso: string) => {
      if (!iso) return '';
      const parts = iso.split('-');
      if (parts.length !== 3) return iso;
      const y = parts[0];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        return `${MONTH_NAMES[m].slice(0, 3)} ${d}, ${y}`;
      }
      return iso;
    };

    return (
      <div
        ref={containerRef}
        className="col"
        style={{ width: '100%', gap: '4px', position: 'relative', ...containerStyle }}
      >
        {/* Hidden input for ref/form compatibility */}
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={selectedDate}
          required={required}
        />

        {/* Clickable Trigger Field */}
        <div
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className={className}
          style={{
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
            color: disabled ? '#A1A1AA' : selectedDate ? '#18181B' : '#A1A1AA',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            userSelect: 'none',
            ...style,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <CalendarIcon
              size={17}
              style={{
                color: isOpen ? 'var(--primary, #7c3aed)' : '#71717A',
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedDate ? formatDisplay(selectedDate) : placeholder}
            </span>
          </div>

          {selectedDate && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectDay('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#A1A1AA',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                borderRadius: '4px',
              }}
              title="Clear date"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ─── Calendar Popover (Z-Index 9999) ─── */}
        {isOpen && !disabled && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E4E4E7',
              boxShadow: '0 14px 36px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
              zIndex: 9999,
              padding: '14px',
              width: '280px',
              animation: 'fadeIn 0.12s ease',
            }}
          >
            {/* Header: Month / Year with arrows */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#18181B' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear((y) => y - 1);
                    } else {
                      setViewMonth((m) => m - 1);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#71717A',
                    padding: '4px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else {
                      setViewMonth((m) => m + 1);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#71717A',
                    padding: '4px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: '12px' }}>
              {[
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'nextWeek', label: '+7 Days' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickPreset(p.id as any)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: '6px',
                    border: '1px solid #E4E4E7',
                    background: '#F4F4F5',
                    color: '#3F3F46',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Day of Week Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#A1A1AA',
                marginBottom: '6px',
              }}
            >
              {DAYS_SHORT.map((d) => (
                <div key={d} style={{ padding: '2px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
              }}
            >
              {calendarDays.map((item, idx) => {
                const isSelected = item.dateStr === selectedDate;
                const isToday = item.dateStr === new Date().toISOString().split('T')[0];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(item.dateStr)}
                    style={{
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      border: 'none',
                      background: isSelected
                        ? 'var(--primary, #7c3aed)'
                        : isToday
                        ? 'var(--primary-tint, #F5F3FF)'
                        : 'transparent',
                      color: isSelected
                        ? '#FFFFFF'
                        : !item.isCurrentMonth
                        ? '#D4D4D8'
                        : isToday
                        ? 'var(--primary, #7c3aed)'
                        : '#18181B',
                      fontSize: '12px',
                      fontWeight: isSelected || isToday ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F4F4F5';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isToday
                          ? 'var(--primary-tint, #F5F3FF)'
                          : 'transparent';
                      }
                    }}
                  >
                    {item.dayNum}
                  </button>
                );
              })}
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

DatePicker.displayName = 'DatePicker';

export default DatePicker;
