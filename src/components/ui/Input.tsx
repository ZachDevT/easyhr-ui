import React, { forwardRef, useState, useRef } from 'react';
import { Calendar } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string | boolean;
  helperText?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      leftIcon,
      rightIcon,
      error,
      helperText,
      containerClassName = '',
      containerStyle = {},
      className = '',
      style,
      type,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isDate = type === 'date' || type === 'datetime-local' || type === 'month';

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            background: 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            boxShadow,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
          }}
        >
          {leftIcon && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: '38px',
                color: 'var(--text-4, #66655A)',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={(node) => {
              // Support both forwarded ref and internal ref for showPicker()
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              inputRef.current = node;
            }}
            type={type}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-1, #1E1D19)',
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: leftIcon ? '4px' : isDate ? '6px' : '14px',
              paddingRight: rightIcon ? '4px' : isDate ? '12px' : '14px',
              fontFamily: 'inherit',
              cursor: isDate ? 'pointer' : 'text',
              ...style,
            }}
            className={className}
            {...props}
          />

          {isDate && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                if (inputRef.current) {
                  try {
                    // Modern browser showPicker()
                    if ('showPicker' in HTMLInputElement.prototype) {
                      (inputRef.current as any).showPicker();
                    } else {
                      inputRef.current.focus();
                    }
                  } catch {
                    inputRef.current.focus();
                  }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0 12px',
                color: isFocused ? 'var(--primary, #A238FF)' : 'var(--text-4, #66655A)',
                transition: 'color 0.15s ease',
              }}
              title="Open calendar"
            >
              <Calendar size={17} />
            </button>
          )}

          {rightIcon && !isDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: '38px',
                color: 'var(--text-4, #66655A)',
              }}
            >
              {rightIcon}
            </div>
          )}
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
Input.displayName = 'Input';
