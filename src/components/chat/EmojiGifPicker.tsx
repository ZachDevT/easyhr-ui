"use client";

import React, { useState } from 'react';
import { Smile, Search, Sparkles, X } from 'lucide-react';

interface EmojiGifPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string, title: string) => void;
  onClose: () => void;
  initialTab?: 'emoji' | 'gif';
}

const COMMON_EMOJIS = [
  '😀', '😂', '🔥', '🚀', '❤️', '🎉', '👏', '👀',
  '💯', '👍', '🙌', '✨', '💡', '✅', '🙏', '😍',
  '😎', '💪', '🤝', '🎯', '⚡', '☕', '🌟', '🥳',
  '🤩', '🎈', '🏆', '🥇', '📈', '💬', '💼', '📌'
];

const CURATED_GIFS = [
  {
    title: 'High Five Team',
    url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif',
    preview: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/200w.gif',
    tag: 'celebration'
  },
  {
    title: 'Applause Great Job',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif',
    tag: 'applause'
  },
  {
    title: 'Typing Fast Engineer',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    preview: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200w.gif',
    tag: 'work'
  },
  {
    title: 'Mind Blown',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    preview: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif',
    tag: 'reaction'
  },
  {
    title: 'Party Cat Celebration',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    preview: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif',
    tag: 'fun'
  },
  {
    title: 'Ship It Rocket',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    preview: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200w.gif',
    tag: 'launch'
  },
  {
    title: 'Coffee Cheers',
    url: 'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif',
    preview: 'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/200w.gif',
    tag: 'coffee'
  },
  {
    title: 'Dance Celebration',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    preview: 'https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif',
    tag: 'fun'
  }
];

export function EmojiGifPicker({
  onSelectEmoji,
  onSelectGif,
  onClose,
  initialTab = 'emoji',
}: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>(initialTab);
  const [gifSearch, setGifSearch] = useState('');

  const filteredGifs = CURATED_GIFS.filter(
    (g) =>
      g.title.toLowerCase().includes(gifSearch.toLowerCase()) ||
      g.tag.toLowerCase().includes(gifSearch.toLowerCase())
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: 16,
        zIndex: 80,
        width: 320,
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid var(--card-border, #E4E4E7)',
        boxShadow: '0 16px 40px -8px rgba(17, 17, 24, 0.14), 0 4px 12px -2px rgba(17, 17, 24, 0.06)',
        overflow: 'hidden',
        color: 'var(--text-1, #18181B)',
      }}
    >
      {/* Top Tabs Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 0 10px',
          background: '#FAF9F7',
          borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '10px 10px 0 0',
              border: activeTab === 'emoji' ? '1px solid var(--card-border, #E4E4E7)' : '1px solid transparent',
              borderBottom: activeTab === 'emoji' ? '1px solid #FFFFFF' : 'none',
              marginBottom: -1,
              background: activeTab === 'emoji' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'emoji' ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
              cursor: 'pointer',
            }}
          >
            <Smile size={14} />
            <span>Emojis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '10px 10px 0 0',
              border: activeTab === 'gif' ? '1px solid var(--card-border, #E4E4E7)' : '1px solid transparent',
              borderBottom: activeTab === 'gif' ? '1px solid #FFFFFF' : 'none',
              marginBottom: -1,
              background: activeTab === 'gif' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'gif' ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} />
            <span>GIFs</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-3, #A1A1AA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 4,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      {activeTab === 'emoji' ? (
        <div style={{ padding: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-3, #A1A1AA)',
              marginBottom: 8,
            }}
          >
            Frequently Used
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 4,
              maxHeight: 210,
              overflowY: 'auto',
            }}
          >
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                style={{
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, transform 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F4F4F5';
                  e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: 12 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3, #A1A1AA)',
              }}
            />
            <input
              type="text"
              placeholder="Search GIFs (celebration, work, launch...)"
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                fontSize: 12,
                background: '#FAF9F7',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 8,
                outline: 'none',
                color: 'var(--text-1, #18181B)',
              }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {filteredGifs.length > 0 ? (
              filteredGifs.map((gif) => (
                <button
                  key={gif.url}
                  type="button"
                  onClick={() => {
                    onSelectGif(gif.url, gif.title);
                    onClose();
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid var(--card-border, #E4E4E7)',
                    background: '#F4F4F5',
                    padding: 0,
                    height: 86,
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 'auto 0 0 0',
                      padding: '4px 6px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      color: '#FFFFFF',
                      fontSize: 10,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {gif.title}
                  </div>
                </button>
              ))
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '24px 8px',
                  fontSize: 12,
                  color: 'var(--text-3, #A1A1AA)',
                }}
              >
                No matching GIFs found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
