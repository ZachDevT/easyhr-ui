interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  className?: string;
  style?: React.CSSProperties;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md', className = '', style }: AvatarProps) {
  return (
    <div className={`avatar avatar-${size} ${className}`} style={style} title={name}>
      {src ? <img src={src} alt={name} /> : <span>{initials(name)}</span>}
    </div>
  );
}
