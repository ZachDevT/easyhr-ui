import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export type Tone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const tones: Record<Tone, { color: string; background: string }> = {
  primary: { color: 'var(--primary)', background: 'var(--primary-tint)' },
  success: { color: 'var(--success)', background: 'rgba(22,163,74,.09)' },
  warning: { color: 'var(--warning)', background: 'rgba(245,158,11,.10)' },
  error: { color: 'var(--error)', background: 'rgba(220,38,38,.09)' },
  neutral: { color: 'var(--text-4)', background: 'var(--bg-page)' },
};

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span style={{ ...tones[tone], borderRadius: 999, padding: '5px 9px', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</span>;
}

export function ProgressBar({ value, color = 'var(--primary)', height = 8 }: { value: number; color?: string; height?: number }) {
  const width = Math.max(0, Math.min(100, value));
  return <div aria-label={`${width}% complete`} style={{ height, borderRadius: 999, background: 'var(--bg-page)', overflow: 'hidden' }}><div style={{ width: `${width}%`, height: '100%', borderRadius: 999, background: color, transition: 'width .2s ease' }} /></div>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="row-between align-center" style={{ marginBottom: 18 }}><div><h2 className="text-xl fw-800 text-1 m-0 mb-4">{title}</h2>{description && <p className="text-sm text-4 m-0">{description}</p>}</div>{action}</div>;
}

export function DataRow({ leading, title, subtitle, meta, onClick }: { leading?: ReactNode; title: string; subtitle?: string; meta?: ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: onClick ? 'pointer' : 'default', textAlign: 'left', fontFamily: 'inherit' }}>
    {leading}<div style={{ minWidth: 0, flex: 1 }}><div className="text-sm fw-700 text-1" style={{ marginBottom: subtitle ? 4 : 0 }}>{title}</div>{subtitle && <div className="text-xs text-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}</div>{meta}{onClick && <ChevronRight size={16} color="var(--text-5)" />}
  </button>;
}

export function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div style={{ display: 'inline-flex', gap: 3, padding: 3, borderRadius: 9, background: 'var(--bg-page)', border: '1px solid var(--border)' }}>{options.map(option => <button key={option} onClick={() => onChange(option)} style={{ border: 0, borderRadius: 6, padding: '7px 12px', background: value === option ? 'white' : 'transparent', boxShadow: value === option ? '0 1px 3px rgba(0,0,0,.08)' : 'none', color: value === option ? 'var(--text-1)' : 'var(--text-4)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{option}</button>)}</div>;
}
