import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
  className?: string;
  style?: import('react').CSSProperties;
}

export function Badge({ children, variant = 'neutral', className = '', style }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>{children}</span>
  );
}
