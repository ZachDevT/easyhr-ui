import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type StatItem = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  description?: string;
};

interface StatRibbonProps {
  stats: StatItem[];
  style?: React.CSSProperties;
}

const TINTS: Record<string, string> = {
  'var(--primary)': 'rgba(162,56,255,0.10)',
  'var(--success)': 'rgba(22,163,74,0.10)',
  'var(--warning)': 'rgba(245,158,11,0.10)',
  'var(--error)':   'rgba(220,38,38,0.10)',
  'var(--text-1)':  'rgba(30,29,25,0.07)',
  'var(--text-4)':  'rgba(102,101,90,0.08)',
};

export function StatRibbon({ stats, style }: StatRibbonProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {stats.map((stat, idx) => {
        const iconTint = stat.color ? (TINTS[stat.color] ?? 'rgba(0,0,0,0.06)') : 'rgba(0,0,0,0.05)';

        const trendColor =
          stat.trendType === 'positive' ? '#16a34a'
          : stat.trendType === 'negative' ? '#dc2626'
          : '#9ca3af';

        const trendBg =
          stat.trendType === 'positive' ? 'rgba(22,163,74,0.09)'
          : stat.trendType === 'negative' ? 'rgba(220,38,38,0.09)'
          : 'rgba(0,0,0,0.05)';

        const TrendIcon =
          stat.trendType === 'positive' ? TrendingUp
          : stat.trendType === 'negative' ? TrendingDown
          : Minus;

        return (
          <div
            key={idx}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 20px',
              minWidth: 0,
              /* Vertical divider via border-left — works reliably in plain flex */
              borderLeft: idx > 0 ? '1px solid #E5E7EB' : 'none',
            }}
          >
            {/* Tinted icon chip */}
            {stat.icon && (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  flexShrink: 0,
                  background: iconTint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color ?? 'var(--text-3)',
                }}
              >
                {stat.icon}
              </div>
            )}

            {/* Text block */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Label */}
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-5)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {stat.label}
              </span>

              {/* Value + trend badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap' }}>
                <span style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: stat.color ?? 'var(--text-1)',
                  lineHeight: 1,
                  letterSpacing: '-0.4px',
                }}>
                  {stat.value}
                </span>

                {stat.trend && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    color: trendColor,
                    background: trendBg,
                    borderRadius: 5,
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    <TrendIcon size={10} strokeWidth={2.5} />
                    {stat.trend}
                  </span>
                )}
              </div>

              {/* Description */}
              {stat.description && (
                <span style={{
                  fontSize: 11.5,
                  color: 'var(--text-5)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {stat.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
