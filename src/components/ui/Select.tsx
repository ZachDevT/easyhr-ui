import React, { forwardRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | boolean;
  helperText?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      error,
      helperText,
      containerClassName = '',
      containerStyle = {},
      className = '',
      style,
      onFocus,
      onBlur,
      children,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const hasError = !!error;
    const borderColor = hasError
      ? 'var(--danger, #D14343)'
      : isFocused
      ? 'var(--primary, #A238FF)'
      : 'var(--card-border, #EAEAE4)';
    const boxShadow = isFocused
      ? hasError
        ? '0 0 0 3px rgba(209, 67, 67, 0.15)'
        : '0 0 0 3px var(--primary-tint, #F3E8FF)'
      : 'none';

    return (
      <div className={`col ${containerClassName}`} style={{ width: '100%', gap: '4px', ...containerStyle }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            background: 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            boxShadow,
            transition: 'all 0.2s ease',
          }}
        >
          <select
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-1, #1E1D19)',
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '14px',
              paddingRight: '36px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              appearance: 'none', // Hide default chevron
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              ...style,
            }}
            className={className}
            {...props}
          >
            {children}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--text-4, #66655A)',
            }}
          >
            <ChevronDown size={16} />
          </div>
        </div>
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
