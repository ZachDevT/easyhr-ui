"use client";

import React, { useState } from 'react';
import { X, Send, Smile, Paperclip, Trash2, Heart, Sparkles } from 'lucide-react';
import { ChatMessage, useChat } from '@/context/ChatContext';
import { EmojiGifPicker } from './EmojiGifPicker';

interface ThreadDrawerProps {
  parentMessage: ChatMessage;
  onClose: () => void;
}

export function ThreadDrawer({ parentMessage, onClose }: ThreadDrawerProps) {
  const { sendMessage, deleteMessage, toggleReaction, activeChannel } = useChat();
  const [replyText, setReplyText] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendMessage(replyText.trim(), undefined, parentMessage.id);
    setReplyText('');
  };

  const handleSelectEmoji = (emoji: string) => {
    setReplyText(prev => prev + emoji);
    setShowPicker(false);
  };

  const handleSelectGif = (gifUrl: string, title: string) => {
    sendMessage(title || 'GIF', [{
      id: `gif-${Date.now()}`,
      name: title || 'animated.gif',
      url: gifUrl,
      type: 'image',
    }], parentMessage.id);
    setShowPicker(false);
  };

  return (
    <div className="w-80 md:w-96 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thread</span>
          <span className="text-xs text-gray-400">#{activeChannel?.name || 'channel'}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message Card */}
        <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100/60">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
              {parentMessage.senderAvatar ? (
                <img src={parentMessage.senderAvatar} alt={parentMessage.senderName} className="w-full h-full object-cover" />
              ) : (
                parentMessage.senderName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-gray-900 truncate">{parentMessage.senderName}</span>
                <span className="text-[10px] text-gray-400">{parentMessage.createdAt}</span>
              </div>
              <p className="text-xs text-gray-800 mt-1 leading-relaxed whitespace-pre-wrap">{parentMessage.content}</p>

              {/* Attachments preview */}
              {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {parentMessage.attachments.map(att => (
                    <div key={att.id} className="rounded-lg overflow-hidden border border-gray-200">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="w-full max-h-48 object-cover" />
                      ) : (
                        <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 text-xs text-purple-700 hover:underline">
                          <Paperclip size={12} />
                          {att.name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Count Divider */}
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] font-semibold text-gray-400">
            {parentMessage.replies?.length || 0} {parentMessage.replies?.length === 1 ? 'reply' : 'replies'}
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Thread Replies List */}
        {parentMessage.replies && parentMessage.replies.length > 0 ? (
          parentMessage.replies.map((reply) => (
            <div key={reply.id} className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-gray-50/80 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                {reply.senderAvatar ? (
                  <img src={reply.senderAvatar} alt={reply.senderName} className="w-full h-full object-cover" />
                ) : (
                  reply.senderName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="text-xs font-bold text-gray-900 truncate">{reply.senderName}</span>
                    <span className="text-[10px] text-gray-400">{reply.createdAt}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleReaction(reply.id, '❤️', parentMessage.id)}
                      className="p-1 text-gray-400 hover:text-rose-500 rounded"
                    >
                      <Heart size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMessage(reply.id, parentMessage.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-800 mt-0.5 leading-relaxed whitespace-pre-wrap">{reply.content}</p>

                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {reply.attachments.map(att => (
                      <div key={att.id} className="rounded-lg overflow-hidden border border-gray-200">
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} className="w-full max-h-36 object-cover" />
                        ) : (
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 p-1.5 bg-gray-50 text-[11px] text-purple-700 hover:underline">
                            <Paperclip size={11} />
                            {att.name}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reaction pills */}
                {reply.reactions && Object.values(reply.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.values(reply.reactions).map(r => (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => toggleReaction(reply.id, r.emoji, parentMessage.id)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 hover:bg-purple-100 border border-gray-200 text-gray-700"
                      >
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-gray-400">
            No replies in this thread yet. Be the first to chime in!
          </div>
        )}
      </div>

      {/* Reply Input Box */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50 relative">
        {showPicker && (
          <EmojiGifPicker
            onSelectEmoji={handleSelectEmoji}
            onSelectGif={handleSelectGif}
            onClose={() => setShowPicker(false)}
          />
        )}
        <form onSubmit={handleSendReply} className="space-y-2">
          <div className="relative">
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
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none shadow-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-white rounded-lg transition-colors"
                title="Emojis & GIFs"
              >
                <Smile size={16} />
              </button>
            </div>
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all"
            >
              <span>Reply</span>
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
