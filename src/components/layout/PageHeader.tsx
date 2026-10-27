"use client";

import React, { useEffect, useRef } from 'react';

interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  variant?: 'page' | 'card';
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  tabs = [],
  activeTab,
  onTabChange,
  variant = 'page',
  children,
}: PageHeaderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = container.querySelector('[data-active="true"]') as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  return (
    <div
      className="page-header-banner"
      style={{
        background: 'var(--gradient)',
        padding: tabs.length > 0 ? '18px 24px 0 24px' : '18px 24px',
        color: '#FFFFFF',
        borderRadius: 14,
        position: 'relative',
        margin: variant === 'page' ? '0 0 16px 0' : '0',
        boxShadow: '0 4px 16px -4px rgba(17, 17, 24, 0.08)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          {icon && (
            <div
              className="page-header-icon-box"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
              }}
            >
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1
              className="page-title"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: 12.5,
                  color: 'rgba(255, 255, 255, 0.82)',
                  margin: '3px 0 0 0',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div
            className="page-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {actions}
          </div>
        )}
      </div>

      {tabs.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
            marginTop: 14,
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.14)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                data-active={isActive}
                onClick={() => onTabChange?.(tab)}
                style={{
                  background: isActive ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.86)',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: 12.5,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}
                className={isActive ? '' : 'hover-bg-subtle-white'}
              >
                {tab}
              </button>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
