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
      ? 'var(--primary, #2563EB)'
      : 'var(--card-border, #E4E4E7)';
    const boxShadow = isFocused
      ? hasError
        ? '0 0 0 3px rgba(209, 67, 67, 0.12)'
        : '0 0 0 3px var(--primary-tint, rgba(162, 56, 255, 0.1))'
      : 'none';

    return (
      <div
        className={`col ${containerClassName}`}
        style={{ width: '100%', gap: '4px', flex: 'none', ...containerStyle }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            background: '#FFFFFF',
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            boxShadow,
            transition: 'all 0.15s ease',
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
                width: '36px',
                color: 'var(--text-3, #A1A1AA)',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={(node) => {
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
              fontSize: '13.5px',
              color: 'var(--text-1, #18181B)',
              paddingTop: '9px',
              paddingBottom: '9px',
              paddingLeft: leftIcon ? '4px' : '12px',
              paddingRight: rightIcon || isDate ? '4px' : '12px',
              fontFamily: 'inherit',
              cursor: isDate ? 'pointer' : 'text',
              ...style,
            }}
            className={`${isDate ? 'easyhr-date-input ' : ''}${className}`.trim()}
            {...props}
          />

          {isDate && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                if (inputRef.current) {
                  try {
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
                color: isFocused ? 'var(--primary, #2563EB)' : 'var(--text-3, #A1A1AA)',
                transition: 'color 0.15s ease',
              }}
              title="Select date"
            >
              <Calendar size={15} />
            </button>
          )}

          {rightIcon && !isDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: '36px',
                color: 'var(--text-3, #A1A1AA)',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || (typeof error === 'string' && error)) && (
          <span
            style={{
              fontSize: '11.5px',
              color: hasError ? 'var(--danger, #D14343)' : 'var(--text-3, #A1A1AA)',
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
