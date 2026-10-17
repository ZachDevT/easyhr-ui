import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export type Tone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const tones: Record<Tone, { color: string; background: string; border: string }> = {
  primary: {
    color: 'var(--primary)',
    background: 'var(--primary-tint)',
    border: '1px solid var(--card-border, #E4E4E7)',
  },
  success: {
    color: '#059669',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  warning: {
    color: 'var(--text-2, #52525B)',
    background: '#FAF9F7',
    border: '1px solid var(--card-border, #E4E4E7)',
  },
  error: {
    color: '#DC2626',
    background: 'rgba(220, 38, 38, 0.07)',
    border: '1px solid rgba(220, 38, 38, 0.18)',
  },
  neutral: {
    color: 'var(--text-2, #52525B)',
    background: '#FAF9F7',
    border: '1px solid var(--card-border, #E4E4E7)',
  },
};

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      style={{
        ...tones[tone],
        borderRadius: 999,
        padding: '3px 9px',
        fontSize: 11,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  color = 'var(--primary)',
  height = 6,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      aria-label={`${width}% complete`}
      style={{
        height,
        borderRadius: 999,
        background: '#F4F4F5',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          borderRadius: 999,
          background: color,
          transition: 'width .2s ease',
        }}
      />
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 16.5,
            fontWeight: 700,
            color: 'var(--text-1, #18181B)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--text-3, #A1A1AA)',
              margin: '3px 0 0 0',
              lineHeight: 1.45,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export function DataRow({
  leading,
  title,
  subtitle,
  meta,
  onClick,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
          borderBottom: '1px solid var(--card-border, #E4E4E7)',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        {leading}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              color: 'var(--text-1, #18181B)',
              marginBottom: subtitle ? 3 : 0,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-3, #A1A1AA)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {meta}
        <ChevronRight size={15} color="var(--text-3, #A1A1AA)" />
      </div>
    );
  }
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--card-border, #E4E4E7)',
        background: 'transparent',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      {leading}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13.5,
            color: 'var(--text-1, #18181B)',
            marginBottom: subtitle ? 3 : 0,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-3, #A1A1AA)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {meta}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 3,
        padding: 3,
        borderRadius: 9,
        background: '#FAF9F7',
        border: '1px solid var(--card-border, #E4E4E7)',
      }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          style={{
            border: 0,
            borderRadius: 6,
            padding: '6px 12px',
            background: value === option ? '#FFFFFF' : 'transparent',
            boxShadow: value === option ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            color: value === option ? 'var(--text-1, #18181B)' : 'var(--text-3, #A1A1AA)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
