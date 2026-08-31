import type { CSSProperties, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'neutral';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const cls = `btn-${variant}${size === 'sm' ? ' btn-sm' : ''} ${className}`;
  return (
    <button className={cls} style={style} {...rest}>
      {icon && icon}
      {children}
    </button>
  );
}
