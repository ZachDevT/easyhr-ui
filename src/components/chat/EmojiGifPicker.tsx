"use client";

import React, { useState } from 'react';
import { Smile, Search, Sparkles } from 'lucide-react';

interface EmojiGifPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string, title: string) => void;
  onClose: () => void;
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

export function EmojiGifPicker({ onSelectEmoji, onSelectGif, onClose }: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>('emoji');
  const [gifSearch, setGifSearch] = useState('');

  const filteredGifs = CURATED_GIFS.filter(g => 
    g.title.toLowerCase().includes(gifSearch.toLowerCase()) || 
    g.tag.toLowerCase().includes(gifSearch.toLowerCase())
  );

  return (
    <div 
      className="absolute bottom-full mb-2 left-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 bg-gray-50/80 px-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('emoji')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'emoji' 
              ? 'bg-white text-purple-700 border-t border-x border-gray-200 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Smile size={14} />
          Emojis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gif')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === 'gif' 
              ? 'bg-white text-purple-700 border-t border-x border-gray-200 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles size={14} />
          Animated GIFs
        </button>
      </div>

      {/* Tab Body */}
      {activeTab === 'emoji' ? (
        <div className="p-3">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Frequently Used Emojis
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto pr-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-purple-50 hover:scale-125 transition-transform rounded cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search GIFs (celebration, work, rocket...)"
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredGifs.length > 0 ? (
              filteredGifs.map((gif) => (
                <button
                  key={gif.url}
                  type="button"
                  onClick={() => {
                    onSelectGif(gif.url, gif.title);
                    onClose();
                  }}
                  className="group relative rounded-lg overflow-hidden border border-gray-100 hover:border-purple-400 aspect-video bg-gray-100 transition-all text-left"
                >
                  <img 
                    src={gif.preview} 
                    alt={gif.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate">{gif.title}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-xs text-gray-400">
                No matching GIFs found. Try searching &quot;work&quot; or &quot;celebration&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
