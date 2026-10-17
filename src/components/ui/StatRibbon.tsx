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

export function StatRibbon({ stats, style }: StatRibbonProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#FFFFFF',
        border: '1px solid var(--card-border, #E4E4E7)',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {stats.map((stat, idx) => {
        const trendColor =
          stat.trendType === 'positive'
            ? '#059669'
            : stat.trendType === 'negative'
            ? '#DC2626'
            : 'var(--text-3, #A1A1AA)';

        const trendBg =
          stat.trendType === 'positive'
            ? 'rgba(16, 185, 129, 0.08)'
            : stat.trendType === 'negative'
            ? 'rgba(220, 38, 38, 0.08)'
            : '#F4F4F5';

        const TrendIcon =
          stat.trendType === 'positive'
            ? TrendingUp
            : stat.trendType === 'negative'
            ? TrendingDown
            : Minus;

        return (
          <div
            key={idx}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              minWidth: 0,
              borderLeft: idx > 0 ? '1px solid var(--card-border, #E4E4E7)' : 'none',
            }}
          >
            {stat.icon && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: '#FAF9F7',
                  border: '1px solid var(--card-border, #E4E4E7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-1, #18181B)',
                }}
              >
                {stat.icon}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontSize: 10.5,
                  color: 'var(--text-3, #A1A1AA)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {stat.label}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap' }}>
                <span
                  style={{
                    fontSize: 20,
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    color: 'var(--text-1, #18181B)',
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </span>

                {stat.trend && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      color: trendColor,
                      background: trendBg,
                      borderRadius: 6,
                      padding: '2px 6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <TrendIcon size={10} strokeWidth={2.5} />
                    {stat.trend}
                  </span>
                )}
              </div>

              {stat.description && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-3, #A1A1AA)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
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
