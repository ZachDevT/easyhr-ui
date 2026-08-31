import React, { forwardRef, useState } from 'react';

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
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

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
            ref={ref}
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
              paddingLeft: leftIcon ? '4px' : '14px',
              paddingRight: rightIcon ? '4px' : '14px',
              fontFamily: 'inherit',
              ...style,
            }}
            className={className}
            {...props}
          />

          {rightIcon && (
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
