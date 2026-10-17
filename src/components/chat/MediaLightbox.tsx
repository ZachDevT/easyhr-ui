"use client";

import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Film, Image as ImageIcon } from 'lucide-react';

export interface LightboxMediaItem {
  url: string;
  name: string;
  type: 'image' | 'video';
  size?: string;
}

interface MediaLightboxProps {
  item: LightboxMediaItem | null;
  onClose: () => void;
}

export function MediaLightbox({ item, onClose }: MediaLightboxProps) {
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(9, 9, 11, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 28px',
        animation: 'fadeIn 0.16s ease-out',
      }}
    >
      {/* Top Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '10px 16px',
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {item.type === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>
              {item.type === 'video' ? 'Video Attachment' : 'Image Preview'}
              {item.size ? ` · ${item.size}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            download={item.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Download size={13.5} />
            <span>Download</span>
          </a>

          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={13.5} />
            <span>Open Original</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.18)',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Close full view (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Center Media Stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          margin: '16px auto',
          maxWidth: '92vw',
        }}
      >
        {item.type === 'video' ? (
          <video
            src={item.url}
            controls
            autoPlay
            playsInline
            style={{
              maxWidth: '88vw',
              maxHeight: '78vh',
              borderRadius: 14,
              background: '#000000',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          />
        ) : (
          <img
            src={item.url}
            alt={item.name}
            style={{
              maxWidth: '88vw',
              maxHeight: '78vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            }}
          />
        )}
      </div>

      {/* Bottom Helper Caption */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 11.5,
          color: 'rgba(255, 255, 255, 0.55)',
        }}
      >
        Click anywhere outside or press Esc to close full view
      </div>
    </div>
  );
}
