import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function Card({ children, className = '', style, onClick, draggable, onDragStart }: CardProps) {
  return (
    <div className={`card ${className}`} style={style} onClick={onClick} draggable={draggable} onDragStart={onDragStart}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Extra elements placed on the left after the title */
  extra?: ReactNode;
}

export function CardHeader({ title, icon, action, extra }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div className="card-header-left">
        {icon && <div className="card-header-icon">{icon}</div>}
        <h2 className="card-header-title">{title}</h2>
        {extra}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`card-body ${className}`} style={style}>
      {children}
    </div>
  );
}
