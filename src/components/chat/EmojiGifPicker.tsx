"use client";

import React, { useState, useEffect } from 'react';
import { Smile, Search, Sparkles, X, Zap, Loader2 } from 'lucide-react';

export type PickerTab = 'emoji' | 'animated' | 'gif';

interface EmojiGifPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string, title: string) => void;
  onClose: () => void;
  initialTab?: PickerTab;
}

interface EmojiEntry {
  char: string;
  name: string;
  category: 'Smileys' | 'Gestures' | 'Work' | 'Celebration' | 'Symbols' | 'Food & Nature';
}

const EMOJI_LIBRARY: EmojiEntry[] = [
  // Smileys
  { char: '😀', name: 'grinning smile happy', category: 'Smileys' },
  { char: '😃', name: 'smiley happy open mouth', category: 'Smileys' },
  { char: '😄', name: 'smile happy joy', category: 'Smileys' },
  { char: '😁', name: 'grin beaming', category: 'Smileys' },
  { char: '😆', name: 'laughing satisfied', category: 'Smileys' },
  { char: '😅', name: 'sweat smile relief', category: 'Smileys' },
  { char: '🤣', name: 'rofl rolling laughing', category: 'Smileys' },
  { char: '😂', name: 'joy tears laughing', category: 'Smileys' },
  { char: '🙂', name: 'slightly smiling', category: 'Smileys' },
  { char: '😉', name: 'wink', category: 'Smileys' },
  { char: '😊', name: 'blush warm smile', category: 'Smileys' },
  { char: '😇', name: 'innocent angel halo', category: 'Smileys' },
  { char: '🥰', name: 'smiling hearts love', category: 'Smileys' },
  { char: '😍', name: 'heart eyes love', category: 'Smileys' },
  { char: '🤩', name: 'star struck excited', category: 'Smileys' },
  { char: '😘', name: 'kissing heart', category: 'Smileys' },
  { char: '😋', name: 'yum delicious', category: 'Smileys' },
  { char: '😎', name: 'sunglasses cool', category: 'Smileys' },
  { char: '🤓', name: 'nerd glasses smart', category: 'Smileys' },
  { char: '🧐', name: 'monocle inspect curious', category: 'Smileys' },
  { char: '🤔', name: 'thinking hmm question', category: 'Smileys' },
  { char: '🫡', name: 'salute respect yes sir', category: 'Smileys' },
  { char: '🤗', name: 'hugging warm', category: 'Smileys' },
  { char: '🤭', name: 'giggle hand over mouth', category: 'Smileys' },
  { char: '🤫', name: 'shushing quiet secret', category: 'Smileys' },
  { char: '😌', name: 'relieved calm', category: 'Smileys' },
  { char: '🥳', name: 'partying celebrate birthday', category: 'Smileys' },
  { char: '🤯', name: 'mind blown exploding head', category: 'Smileys' },
  { char: '😳', name: 'flushed surprised', category: 'Smileys' },
  { char: '🥺', name: 'pleading puppy eyes', category: 'Smileys' },
  { char: '😢', name: 'cry sad tear', category: 'Smileys' },
  { char: '😭', name: 'sob crying loud', category: 'Smileys' },
  { char: '😤', name: 'triumph steam proud', category: 'Smileys' },
  { char: '😴', name: 'sleeping zzz tired', category: 'Smileys' },
  { char: '🤒', name: 'sick thermometer ill', category: 'Smileys' },
  { char: '🤠', name: 'cowboy hat', category: 'Smileys' },

  // Gestures
  { char: '👍', name: 'thumbs up like approve yes', category: 'Gestures' },
  { char: '👎', name: 'thumbs down dislike', category: 'Gestures' },
  { char: '👏', name: 'clap applause bravo', category: 'Gestures' },
  { char: '🙌', name: 'raised hands hooray celebrate', category: 'Gestures' },
  { char: '🤝', name: 'handshake deal agreement team', category: 'Gestures' },
  { char: '🙏', name: 'pray thank you please', category: 'Gestures' },
  { char: '💪', name: 'muscle strong biceps flex', category: 'Gestures' },
  { char: '✌️', name: 'victory peace', category: 'Gestures' },
  { char: '🤞', name: 'crossed fingers luck', category: 'Gestures' },
  { char: '👌', name: 'ok hand perfect', category: 'Gestures' },
  { char: '🫶', name: 'heart hands love', category: 'Gestures' },
  { char: '👋', name: 'wave hello hi goodbye', category: 'Gestures' },
  { char: '🤚', name: 'raised back of hand', category: 'Gestures' },
  { char: '✋', name: 'raised hand high five', category: 'Gestures' },
  { char: '👊', name: 'fist bump punch', category: 'Gestures' },
  { char: '☝️', name: 'point up one', category: 'Gestures' },
  { char: '👆', name: 'point up', category: 'Gestures' },
  { char: '👇', name: 'point down', category: 'Gestures' },
  { char: '👉', name: 'point right', category: 'Gestures' },
  { char: '👈', name: 'point left', category: 'Gestures' },
  { char: '👀', name: 'eyes looking watching review', category: 'Gestures' },
  { char: '🧠', name: 'brain smart genius', category: 'Gestures' },
  { char: '✍️', name: 'writing hand sign', category: 'Gestures' },
  { char: '🫡', name: 'saluting', category: 'Gestures' },

  // Work & Office
  { char: '🚀', name: 'rocket launch ship deploy', category: 'Work' },
  { char: '💼', name: 'briefcase business work', category: 'Work' },
  { char: '💻', name: 'laptop computer code', category: 'Work' },
  { char: '📈', name: 'chart increasing growth up', category: 'Work' },
  { char: '📊', name: 'bar chart analytics metrics', category: 'Work' },
  { char: '📌', name: 'pushpin pin important', category: 'Work' },
  { char: '📍', name: 'round pin location', category: 'Work' },
  { char: '📎', name: 'paperclip attachment', category: 'Work' },
  { char: '📅', name: 'calendar schedule date', category: 'Work' },
  { char: '📝', name: 'memo note document', category: 'Work' },
  { char: '📁', name: 'folder file directory', category: 'Work' },
  { char: '💡', name: 'light bulb idea insight', category: 'Work' },
  { char: '🎯', name: 'bullseye target goal okr', category: 'Work' },
  { char: '⚡', name: 'zap lightning fast energy', category: 'Work' },
  { char: '🔥', name: 'fire hot lit awesome', category: 'Work' },
  { char: '🛠️', name: 'tools hammer wrench fix', category: 'Work' },
  { char: '⚙️', name: 'gear settings config', category: 'Work' },
  { char: '🔒', name: 'locked security private', category: 'Work' },
  { char: '🔑', name: 'key access', category: 'Work' },
  { char: '📣', name: 'megaphone announcement', category: 'Work' },
  { char: '🔔', name: 'bell notification reminder', category: 'Work' },
  { char: '⏱️', name: 'stopwatch timer deadline', category: 'Work' },
  { char: '💬', name: 'speech bubble comment chat', category: 'Work' },
  { char: '🏛️', name: 'building headquarters office', category: 'Work' },

  // Celebration
  { char: '🎉', name: 'party popper tada congrats', category: 'Celebration' },
  { char: '🎊', name: 'confetti ball celebrate', category: 'Celebration' },
  { char: '🏆', name: 'trophy winner champion award', category: 'Celebration' },
  { char: '🥇', name: 'first place gold medal', category: 'Celebration' },
  { char: '🥈', name: 'second place silver medal', category: 'Celebration' },
  { char: '🥉', name: 'third place bronze medal', category: 'Celebration' },
  { char: '🎖️', name: 'medal honor', category: 'Celebration' },
  { char: '🎈', name: 'balloon party birthday', category: 'Celebration' },
  { char: '🎂', name: 'birthday cake', category: 'Celebration' },
  { char: '🥂', name: 'clinking glasses cheers toast', category: 'Celebration' },
  { char: '🎁', name: 'gift present box', category: 'Celebration' },
  { char: '✨', name: 'sparkles magic shine new', category: 'Celebration' },
  { char: '🌟', name: 'glowing star shine', category: 'Celebration' },
  { char: '⭐', name: 'star favorite', category: 'Celebration' },
  { char: '🌈', name: 'rainbow', category: 'Celebration' },
  { char: '👑', name: 'crown king queen', category: 'Celebration' },

  // Symbols & Hearts
  { char: '❤️', name: 'red heart love', category: 'Symbols' },
  { char: '🧡', name: 'orange heart', category: 'Symbols' },
  { char: '💛', name: 'yellow heart', category: 'Symbols' },
  { char: '💚', name: 'green heart', category: 'Symbols' },
  { char: '💙', name: 'blue heart', category: 'Symbols' },
  { char: '💜', name: 'purple heart', category: 'Symbols' },
  { char: '🖤', name: 'black heart', category: 'Symbols' },
  { char: '🤍', name: 'white heart', category: 'Symbols' },
  { char: '💯', name: '100 hundred percent perfect', category: 'Symbols' },
  { char: '✅', name: 'check mark done completed', category: 'Symbols' },
  { char: '☑️', name: 'ballot check box', category: 'Symbols' },
  { char: '❌', name: 'cross mark no cancel', category: 'Symbols' },
  { char: '⚠️', name: 'warning alert caution', category: 'Symbols' },
  { char: '❗', name: 'exclamation important', category: 'Symbols' },
  { char: '❓', name: 'question mark', category: 'Symbols' },
  { char: '♻️', name: 'recycle sync', category: 'Symbols' },
  { char: '🟢', name: 'green circle online active', category: 'Symbols' },
  { char: '🟡', name: 'yellow circle away', category: 'Symbols' },
  { char: '🔴', name: 'red circle busy live', category: 'Symbols' },
  { char: '🟣', name: 'purple circle brand', category: 'Symbols' },

  // Food & Nature
  { char: '☕', name: 'coffee tea morning break', category: 'Food & Nature' },
  { char: '🍵', name: 'green tea', category: 'Food & Nature' },
  { char: '🍕', name: 'pizza lunch', category: 'Food & Nature' },
  { char: '🍔', name: 'burger lunch', category: 'Food & Nature' },
  { char: '🥐', name: 'croissant breakfast', category: 'Food & Nature' },
  { char: '🍩', name: 'donut sweet', category: 'Food & Nature' },
  { char: '🍎', name: 'apple fruit', category: 'Food & Nature' },
  { char: '🥑', name: 'avocado', category: 'Food & Nature' },
  { char: '🌮', name: 'taco', category: 'Food & Nature' },
  { char: '🍣', name: 'sushi', category: 'Food & Nature' },
  { char: '🌞', name: 'sun morning bright', category: 'Food & Nature' },
  { char: '🌙', name: 'moon night', category: 'Food & Nature' },
  { char: '🌍', name: 'earth globe africa world', category: 'Food & Nature' },
  { char: '🌿', name: 'herb plant growth', category: 'Food & Nature' },
  { char: '🌸', name: 'cherry blossom flower', category: 'Food & Nature' },
  { char: '🦁', name: 'lion brave', category: 'Food & Nature' },
];

const ANIMATED_EMOJIS = [
  { label: 'Rocket Launch', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif' },
  { label: 'Fire', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif' },
  { label: 'Party Popper', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif' },
  { label: 'Clapping Hands', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif' },
  { label: 'Red Heart', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif' },
  { label: 'Hundred Points', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif' },
  { label: 'Sparkles', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif' },
  { label: 'Mind Blown', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.gif' },
  { label: 'Partying Face', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif' },
  { label: 'Star Struck', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif' },
  { label: 'Tears of Joy', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif' },
  { label: 'Thumbs Up', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif' },
  { label: 'Raising Hands', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64c/512.gif' },
  { label: 'Eyes Watching', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif' },
  { label: 'Trophy', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif' },
  { label: 'High Voltage', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.gif' },
  { label: 'Heart Eyes', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif' },
  { label: 'Cool Sunglasses', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif' },
  { label: 'Thinking Face', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif' },
  { label: 'Thank You', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif' },
  { label: 'Flexed Biceps', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif' },
  { label: 'Target Bullseye', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.gif' },
  { label: 'Light Bulb Idea', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/512.gif' },
  { label: 'Salute', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fae1/512.gif' },
];

const FALLBACK_GIFS = [
  {
    id: 'fb-1',
    title: 'High Five Team',
    url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif',
    preview: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/200w.gif',
  },
  {
    id: 'fb-2',
    title: 'Applause Great Job',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    preview: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif',
  },
  {
    id: 'fb-3',
    title: 'Typing Fast Engineer',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    preview: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200w.gif',
  },
  {
    id: 'fb-4',
    title: 'Mind Blown',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    preview: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif',
  },
  {
    id: 'fb-5',
    title: 'Party Celebration',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    preview: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif',
  },
  {
    id: 'fb-6',
    title: 'Ship It Rocket',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    preview: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200w.gif',
  },
];

const EMOJI_CATEGORIES = ['All', 'Smileys', 'Gestures', 'Work', 'Celebration', 'Symbols', 'Food & Nature'] as const;
const GIF_QUICK_TAGS = ['Trending', 'Celebrate', 'Applause', 'Thumbs Up', 'Launch', 'Mind Blown', 'Thank You', 'Coding'];

export function EmojiGifPicker({
  onSelectEmoji,
  onSelectGif,
  onClose,
  initialTab = 'emoji',
}: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>(initialTab);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiCategory, setEmojiCategory] = useState<(typeof EMOJI_CATEGORIES)[number]>('All');

  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState<{ id: string; title: string; url: string; preview: string }[]>(FALLBACK_GIFS);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

  // Live Tenor GIF API search
  useEffect(() => {
    if (activeTab !== 'gif') return;
    let isCancelled = false;
    const controller = new AbortController();

    const fetchGifs = async () => {
      setIsLoadingGifs(true);
      try {
        const trimmed = gifSearch.trim();
        const endpoint =
          trimmed.length > 0 && trimmed.toLowerCase() !== 'trending'
            ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(trimmed)}&key=LIVDSRZULELA&limit=24&media_filter=minimal`
            : `https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=24&media_filter=minimal`;

        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) throw new Error('Tenor API error');
        const data = await res.json();
        if (!isCancelled && Array.isArray(data?.results) && data.results.length > 0) {
          const mapped = data.results
            .map((item: any) => {
              const media = item.media?.[0];
              const fullGif = media?.gif?.url || media?.mediumgif?.url || media?.tinygif?.url;
              const previewGif = media?.tinygif?.url || media?.nanogif?.url || fullGif;
              if (!fullGif) return null;
              return {
                id: String(item.id),
                title: item.content_description || item.title || 'Animated GIF',
                url: fullGif,
                preview: previewGif,
              };
            })
            .filter(Boolean);
          if (mapped.length > 0) {
            setGifResults(mapped);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && !isCancelled) {
          // Keep current or fallback GIFs if network blocked
        }
      } finally {
        if (!isCancelled) setIsLoadingGifs(false);
      }
    };

    const timer = setTimeout(fetchGifs, 220);
    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [activeTab, gifSearch]);

  const filteredEmojis = EMOJI_LIBRARY.filter((item) => {
    const matchesCategory = emojiCategory === 'All' || item.category === emojiCategory;
    const matchesQuery =
      !emojiSearch.trim() ||
      item.name.toLowerCase().includes(emojiSearch.trim().toLowerCase()) ||
      item.char.includes(emojiSearch.trim());
    return matchesCategory && matchesQuery;
  });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        right: 16,
        zIndex: 90,
        width: 360,
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid var(--card-border, #E4E4E7)',
        boxShadow: '0 20px 48px -12px rgba(17, 17, 24, 0.18), 0 4px 14px -2px rgba(17, 17, 24, 0.08)',
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
              gap: 5,
              padding: '7px 11px',
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
            <Smile size={13.5} />
            <span>Emojis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('animated')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 11px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '10px 10px 0 0',
              border: activeTab === 'animated' ? '1px solid var(--card-border, #E4E4E7)' : '1px solid transparent',
              borderBottom: activeTab === 'animated' ? '1px solid #FFFFFF' : 'none',
              marginBottom: -1,
              background: activeTab === 'animated' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'animated' ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
              cursor: 'pointer',
            }}
          >
            <Zap size={13.5} />
            <span>Animated</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 11px',
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
            <Sparkles size={13.5} />
            <span>Live GIFs</span>
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

      {/* TAB 1: FULL CATEGORIZED EMOJIS */}
      {activeTab === 'emoji' && (
        <div style={{ padding: 12 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
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
              placeholder="Search all emojis (rocket, clap, heart, coffee...)"
              value={emojiSearch}
              onChange={(e) => setEmojiSearch(e.target.value)}
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

          {/* Category Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 8,
              marginBottom: 6,
              borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
              scrollbarWidth: 'none',
            }}
          >
            {EMOJI_CATEGORIES.map((cat) => {
              const active = emojiCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEmojiCategory(cat)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    border: active ? '1px solid var(--primary, #A238FF)' : '1px solid transparent',
                    background: active ? 'var(--primary-tint, #F5EBFF)' : '#F4F4F5',
                    color: active ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Emoji Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 4,
              maxHeight: 230,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {filteredEmojis.length > 0 ? (
              filteredEmojis.map((item, idx) => (
                <button
                  key={`${item.char}-${idx}`}
                  type="button"
                  title={item.name}
                  onClick={() => {
                    onSelectEmoji(item.char);
                    onClose();
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 19,
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease, transform 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F4F4F5';
                    e.currentTarget.style.transform = 'scale(1.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {item.char}
                </button>
              ))
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '28px 8px',
                  fontSize: 12,
                  color: 'var(--text-3, #A1A1AA)',
                }}
              >
                No matching emojis found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANIMATED EMOJIS */}
      {activeTab === 'animated' && (
        <div style={{ padding: 12 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-3, #A1A1AA)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Animated Stickers & Reactions</span>
            <span style={{ fontSize: 10, color: 'var(--primary)' }}>Click to send</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              maxHeight: 260,
              overflowY: 'auto',
            }}
          >
            {ANIMATED_EMOJIS.map((anim) => (
              <button
                key={anim.label}
                type="button"
                onClick={() => {
                  onSelectGif(anim.url, anim.label);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '8px 4px',
                  borderRadius: 10,
                  border: '1px solid var(--card-border, #E4E4E7)',
                  background: '#FAF9F7',
                  cursor: 'pointer',
                  transition: 'all 0.14s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary, #A238FF)';
                  e.currentTarget.style.background = 'var(--primary-tint, #F5EBFF)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--card-border, #E4E4E7)';
                  e.currentTarget.style.background = '#FAF9F7';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <img
                  src={anim.url}
                  alt={anim.label}
                  style={{ width: 42, height: 42, objectFit: 'contain', display: 'block' }}
                  loading="lazy"
                />
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-2, #52525B)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {anim.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE TENOR GIF SEARCH */}
      {activeTab === 'gif' && (
        <div style={{ padding: 12 }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
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
              placeholder="Search any GIF via Tenor..."
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '7px 28px 7px 30px',
                fontSize: 12,
                background: '#FAF9F7',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 8,
                outline: 'none',
                color: 'var(--text-1, #18181B)',
              }}
            />
            {isLoadingGifs && (
              <Loader2
                size={13}
                className="animate-spin"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary, #A238FF)',
                }}
              />
            )}
          </div>

          {/* Quick Tag Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 8,
              marginBottom: 6,
              scrollbarWidth: 'none',
            }}
          >
            {GIF_QUICK_TAGS.map((tag) => {
              const isSelected =
                (tag === 'Trending' && !gifSearch.trim()) ||
                gifSearch.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setGifSearch(tag === 'Trending' ? '' : tag)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '1px solid var(--primary, #A238FF)' : '1px solid transparent',
                    background: isSelected ? 'var(--primary-tint, #F5EBFF)' : '#F4F4F5',
                    color: isSelected ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* GIF Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              maxHeight: 230,
              overflowY: 'auto',
            }}
          >
            {gifResults.length > 0 ? (
              gifResults.map((gif) => (
                <button
                  key={gif.id + gif.url}
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
                    height: 92,
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
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)',
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
                No GIFs found for &ldquo;{gifSearch}&rdquo;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
