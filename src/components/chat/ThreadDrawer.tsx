"use client";

import React, { useState, useRef } from 'react';
import { X, Send, Smile, Paperclip, Trash2, Heart, Hash, MessageSquare, Maximize2, Play } from 'lucide-react';
import { ChatMessage, useChat } from '@/context/ChatContext';
import { EmojiGifPicker } from './EmojiGifPicker';
import { MediaLightbox, LightboxMediaItem } from './MediaLightbox';

interface ThreadDrawerProps {
  parentMessage: ChatMessage;
  onClose: () => void;
}

export function ThreadDrawer({ parentMessage, onClose }: ThreadDrawerProps) {
  const { sendMessage, deleteMessage, toggleReaction, activeChannel } = useChat();
  const [replyText, setReplyText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendMessage(replyText.trim(), undefined, parentMessage.id);
    setReplyText('');
  };

  const handleSelectEmoji = (emoji: string) => {
    setReplyText((prev) => prev + emoji);
    setShowPicker(false);
  };

  const handleSelectGif = (gifUrl: string, title: string) => {
    sendMessage(
      title || 'Shared a GIF',
      [
        {
          id: `gif-${Date.now()}`,
          name: title || 'animated.gif',
          url: gifUrl,
          type: 'image',
        },
      ],
      parentMessage.id
    );
    setShowPicker(false);
  };

  const handleThreadFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const fileUrl = URL.createObjectURL(file);
      sendMessage(
        replyText.trim() || `Shared ${file.name}`,
        [
          {
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            url: fileUrl,
            type: isImg ? 'image' : isVideo ? 'video' : 'file',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          },
        ],
        parentMessage.id
      );
      setReplyText('');
    });
  };

  return (
    <aside
      style={{
        width: 330,
        flexShrink: 0,
        borderLeft: '1px solid var(--card-border, #E4E4E7)',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Thread Header */}
      <div
        style={{
          height: 58,
          padding: '0 18px',
          borderBottom: '1px solid var(--card-border, #E4E4E7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={15} style={{ color: 'var(--text-1, #18181B)' }} />
          <span style={{ fontSize: 14, color: 'var(--text-1, #18181B)', fontWeight: 600 }}>
            Thread
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 12,
              color: 'var(--text-3, #A1A1AA)',
            }}
          >
            <Hash size={12} />
            {activeChannel?.name || 'general'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--text-3, #A1A1AA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Thread Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Original Parent Message */}
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: '#FAF9F7',
            border: '1px solid var(--card-border, #E4E4E7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#F4F4F5',
                border: '1px solid var(--card-border, #E4E4E7)',
                color: 'var(--text-1, #18181B)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {parentMessage.senderAvatar ? (
                <img
                  src={parentMessage.senderAvatar}
                  alt={parentMessage.senderName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                parentMessage.senderName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-1, #18181B)' }}>
                  {parentMessage.senderName}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', flexShrink: 0 }}>
                  {parentMessage.createdAt}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-2, #52525B)',
                  marginTop: 5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {parentMessage.content}
              </div>

              {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {parentMessage.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '1px solid var(--card-border, #E4E4E7)',
                        background: '#FFFFFF',
                        position: 'relative',
                      }}
                    >
                      {att.type === 'image' ? (
                        <div
                          onClick={() =>
                            setLightboxMedia({
                              url: att.url,
                              name: att.name,
                              type: 'image',
                              size: att.size,
                            })
                          }
                          style={{ position: 'relative', cursor: 'zoom-in' }}
                        >
                          <img
                            src={att.url}
                            alt={att.name}
                            style={{ width: '100%', maxHeight: 170, objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ) : att.type === 'video' ? (
                        <div
                          onClick={() =>
                            setLightboxMedia({
                              url: att.url,
                              name: att.name,
                              type: 'video',
                              size: att.size,
                            })
                          }
                          style={{ position: 'relative', cursor: 'pointer', background: '#09090B' }}
                        >
                          <video
                            src={att.url}
                            muted
                            playsInline
                            style={{ width: '100%', maxHeight: 170, objectFit: 'cover', display: 'block' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0,0,0,0.28)',
                              color: '#FFFFFF',
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Play size={15} fill="#FFFFFF" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            fontSize: 12,
                            color: 'var(--primary, #A238FF)',
                          }}
                        >
                          <Paperclip size={13} />
                          <span>{att.name}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Replies Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle, #F0F0F3)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3, #A1A1AA)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {parentMessage.replies?.length || 0}{' '}
            {parentMessage.replies?.length === 1 ? 'Reply' : 'Replies'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle, #F0F0F3)' }} />
        </div>

        {/* Replies List */}
        {parentMessage.replies && parentMessage.replies.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parentMessage.replies.map((reply) => {
              const isHovered = hoveredReplyId === reply.id;
              return (
                <div
                  key={reply.id}
                  onMouseEnter={() => setHoveredReplyId(reply.id)}
                  onMouseLeave={() => setHoveredReplyId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 10px',
                    borderRadius: 12,
                    background: isHovered ? '#FAF9F7' : 'transparent',
                    position: 'relative',
                    transition: 'background 0.12s ease',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: '#F4F4F5',
                      border: '1px solid var(--card-border, #E4E4E7)',
                      color: 'var(--text-1, #18181B)',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {reply.senderAvatar ? (
                      <img
                        src={reply.senderAvatar}
                        alt={reply.senderName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      reply.senderName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-1, #18181B)' }}>
                        {reply.senderName}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-3, #A1A1AA)' }}>
                        {reply.createdAt}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-2, #52525B)',
                        marginTop: 4,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {reply.content}
                    </div>

                    {reply.attachments && reply.attachments.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {reply.attachments.map((att) => (
                          <div
                            key={att.id}
                            style={{
                              borderRadius: 8,
                              overflow: 'hidden',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              position: 'relative',
                            }}
                          >
                            {att.type === 'image' ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                onClick={() =>
                                  setLightboxMedia({
                                    url: att.url,
                                    name: att.name,
                                    type: 'image',
                                    size: att.size,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  maxHeight: 150,
                                  objectFit: 'cover',
                                  display: 'block',
                                  cursor: 'zoom-in',
                                }}
                              />
                            ) : att.type === 'video' ? (
                              <div
                                onClick={() =>
                                  setLightboxMedia({
                                    url: att.url,
                                    name: att.name,
                                    type: 'video',
                                    size: att.size,
                                  })
                                }
                                style={{ position: 'relative', cursor: 'pointer', background: '#09090B' }}
                              >
                                <video
                                  src={att.url}
                                  muted
                                  playsInline
                                  style={{ width: '100%', maxHeight: 150, objectFit: 'cover', display: 'block' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  <Play size={16} fill="#FFFFFF" />
                                </div>
                              </div>
                            ) : (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 8px',
                                  fontSize: 11,
                                  color: 'var(--primary, #A238FF)',
                                }}
                              >
                                <Paperclip size={12} />
                                <span>{att.name}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Reactions */}
                    {reply.reactions && Object.values(reply.reactions).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {Object.values(reply.reactions).map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={() => toggleReaction(reply.id, r.emoji, parentMessage.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 7px',
                              borderRadius: 999,
                              fontSize: 11,
                              background: '#F4F4F5',
                              border: '1px solid var(--card-border, #E4E4E7)',
                              color: 'var(--text-1, #18181B)',
                              cursor: 'pointer',
                            }}
                          >
                            <span>{r.emoji}</span>
                            <span>{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover actions */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        background: '#FFFFFF',
                        border: '1px solid var(--card-border, #E4E4E7)',
                        borderRadius: 8,
                        padding: 2,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleReaction(reply.id, '❤️', parentMessage.id)}
                        style={{
                          width: 22,
                          height: 22,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-2, #52525B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                        title="React"
                      >
                        <Heart size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMessage(reply.id, parentMessage.id)}
                        style={{
                          width: 22,
                          height: 22,
                          border: 'none',
                          background: 'transparent',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                        title="Delete reply"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 12px',
              fontSize: 12,
              color: 'var(--text-3, #A1A1AA)',
            }}
          >
            No replies yet. Start the thread conversation below.
          </div>
        )}
      </div>

      {/* Thread Reply Composer */}
      <div
        style={{
          padding: 14,
          borderTop: '1px solid var(--card-border, #E4E4E7)',
          background: '#FFFFFF',
          position: 'relative',
        }}
      >
        {showPicker && (
          <EmojiGifPicker
            onSelectEmoji={handleSelectEmoji}
            onSelectGif={handleSelectGif}
            onClose={() => setShowPicker(false)}
          />
        )}

        <form
          onSubmit={handleSendReply}
          style={{
            border: '1px solid var(--card-border, #E4E4E7)',
            borderRadius: 12,
            background: '#FAF9F7',
            overflow: 'hidden',
          }}
        >
          <textarea
            rows={2}
            placeholder="Reply in thread..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply(e);
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px 6px 12px',
              fontSize: 12.5,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              resize: 'none',
              color: 'var(--text-1, #18181B)',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderTop: '1px solid var(--border-subtle, #F0F0F3)',
              background: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-2, #52525B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Emojis & GIFs"
              >
                <Smile size={15} />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-2, #52525B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Attach file"
              >
                <Paperclip size={15} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleThreadFileUpload}
              />
            </div>

            <button
              type="submit"
              disabled={!replyText.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                background: replyText.trim() ? 'var(--primary, #A238FF)' : '#E4E4E7',
                color: replyText.trim() ? '#FFFFFF' : '#A1A1AA',
                fontSize: 12,
                cursor: replyText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <span>Reply</span>
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>

      <MediaLightbox item={lightboxMedia} onClose={() => setLightboxMedia(null)} />
    </aside>
  );
}
