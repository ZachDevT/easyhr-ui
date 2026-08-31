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
  // Controls if it's edge-to-edge or rounded
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
  children
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

  const containerStyle: React.CSSProperties = { 
    background: 'var(--gradient)', 
    padding: '32px 32px 0 32px', 
    color: 'white', 
    borderRadius: 12, 
    position: 'relative',
    margin: variant === 'page' ? '24px 24px 24px 24px' : '0' 
  };

  return (
    <div style={containerStyle}>
      <div className="row-between align-start" style={{ paddingBottom: tabs.length > 0 ? 0 : 32 }}>
        <div className="row gap-16 align-center">
          {icon && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
          )}
          <div>
            <h1 className="page-title text-white m-0 mb-4 row gap-12 align-center" style={{ fontSize: 28, fontWeight: 800 }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-base m-0" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="row gap-12 align-center mt-4">
            {actions}
          </div>
        )}
      </div>
      
      {tabs.length > 0 && (
        <div 
          ref={scrollContainerRef}
          style={{ display: 'flex', gap: 4, overflowX: 'auto', marginTop: 24, padding: '0 32px 0 32px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="hide-scrollbar"
        >
          {tabs.map(tab => (
            <button
              key={tab}
              data-active={activeTab === tab}
              onClick={() => onTabChange?.(tab)}
              style={{
                background: activeTab === tab ? 'var(--card-bg)' : 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: 14,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
                whiteSpace: 'nowrap',
              }}
              className={activeTab === tab ? '' : 'hover-bg-subtle-white'}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      
      {children}
    </div>
  );
}
