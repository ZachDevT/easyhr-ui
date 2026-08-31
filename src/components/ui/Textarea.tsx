import React, { forwardRef, useState } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
  helperText?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
            width: '100%',
            background: 'white',
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            boxShadow,
            transition: 'all 0.2s ease',
          }}
        >
          <textarea
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
              padding: '10px 14px',
              fontFamily: 'inherit',
              minHeight: '80px',
              resize: 'vertical',
              ...style,
            }}
            className={className}
            {...props}
          />
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
Textarea.displayName = 'Textarea';
