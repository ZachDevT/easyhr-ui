import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  className?: string;
  style?: React.CSSProperties;
}

function initials(name?: string) {
  const safe = typeof name === 'string' && name.trim() ? name.trim() : 'U';
  return safe
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function Avatar({ src, name = 'User', size = 'md', className = '', style }: AvatarProps) {
  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{
        flexShrink: 0,
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        ...style,
      }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
