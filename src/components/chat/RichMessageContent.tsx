"use client";

import React from 'react';
import { getAnimatedEmojiUrl } from './EmojiGifPicker';
import { ChatPoll } from '@/context/ChatContext';
import { BarChart2, Check, Lock, Users } from 'lucide-react';
import { Employee } from '@/data/employees';

/**
 * Renders inline tokens inside a single line of text:
 * - [:anim:CODE:] -> inline animated emoji <img>
 * - **bold**
 * - _italic_
 * - ~~strikethrough~~
 * - `inline code`
 * - @Mentions
 * - URLs (https://...)
 */
function renderInlineTokens(text: string, keyPrefix = 'in'): React.ReactNode[] {
  // Split by animated emoji token, bold, italic, strike, inline code, @mention, or URL
  const tokenRegex =
    /(\[:anim:[a-z0-9_]+:\]|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|_[A-Za-z0-9][^_]*_|@[A-Za-z]+(?:\s[A-Za-z]+)?|https?:\/\/[^\s]+)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    // 1. Inline Animated Emoji [:anim:CODE:]
    if (part.startsWith('[:anim:') && part.endsWith(':]')) {
      const code = part.slice(7, -2);
      return (
        <img
          key={key}
          src={getAnimatedEmojiUrl(code)}
          alt=""
          style={{
            width: 24,
            height: 24,
            objectFit: 'contain',
            display: 'inline-block',
            verticalAlign: 'middle',
            margin: '0 2px',
          }}
        />
      );
    }

    // 2. Bold **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} style={{ fontWeight: 700, color: 'var(--text-1, #18181B)' }}>
          {renderInlineTokens(part.slice(2, -2), `${key}-b`)}
        </strong>
      );
    }

    // 3. Strikethrough ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <span key={key} style={{ textDecoration: 'line-through', opacity: 0.75 }}>
          {renderInlineTokens(part.slice(2, -2), `${key}-s`)}
        </span>
      );
    }

    // 4. Inline code `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            padding: '1.5px 6px',
            borderRadius: 5,
            background: '#F4F4F5',
            border: '1px solid var(--card-border, #E4E4E7)',
            color: '#BE185D',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 5. Italic _text_
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <em key={key} style={{ fontStyle: 'italic' }}>
          {renderInlineTokens(part.slice(1, -1), `${key}-i`)}
        </em>
      );
    }

    // 6. @Mention
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span
          key={key}
          style={{
            display: 'inline-block',
            padding: '1px 6px',
            borderRadius: 6,
            background: 'var(--primary-light, #F5EBFF)',
            color: 'var(--primary, #A238FF)',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          {part}
        </span>
      );
    }

    // 7. URL
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noreferrer"
          style={{
            color: 'var(--primary, #A238FF)',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          {part}
        </a>
      );
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function RichMessageContent({ content }: { content: string }) {
  if (!content || !content.trim()) return null;

  // Handle multi-line code blocks ```...```
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div
      style={{
        fontSize: 13.5,
        color: 'var(--text-1, #18181B)',
        marginTop: 4,
        lineHeight: 1.55,
      }}
    >
      {blocks.map((block, bIdx) => {
        if (!block) return null;

        if (block.startsWith('```') && block.endsWith('```')) {
          const codeInner = block.slice(3, -3).replace(/^\n+|\n+$/g, '');
          return (
            <pre
              key={`cb-${bIdx}`}
              style={{
                margin: '6px 0',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#18181B',
                color: '#F4F4F5',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.5,
                overflowX: 'auto',
                border: '1px solid #27272A',
              }}
            >
              <code>{codeInner}</code>
            </pre>
          );
        }

        const lines = block.split('\n');
        return (
          <React.Fragment key={`blk-${bIdx}`}>
            {lines.map((line, lIdx) => {
              const lineKey = `ln-${bIdx}-${lIdx}`;

              // Blockquote (> ...)
              if (line.startsWith('> ')) {
                return (
                  <div
                    key={lineKey}
                    style={{
                      borderLeft: '3px solid var(--primary, #A238FF)',
                      paddingLeft: 10,
                      margin: '4px 0',
                      color: 'var(--text-2, #52525B)',
                      fontStyle: 'italic',
                    }}
                  >
                    {renderInlineTokens(line.slice(2), lineKey)}
                  </div>
                );
              }

              // Bullet list item (• or - )
              if (line.startsWith('• ') || line.startsWith('- ')) {
                return (
                  <div
                    key={lineKey}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      paddingLeft: 6,
                      margin: '2px 0',
                    }}
                  >
                    <span style={{ color: 'var(--primary, #A238FF)', fontWeight: 700 }}>•</span>
                    <span>{renderInlineTokens(line.slice(2), lineKey)}</span>
                  </div>
                );
              }

              // Numbered list item (1. , 2. , etc.)
              const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div
                    key={lineKey}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      paddingLeft: 6,
                      margin: '2px 0',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--text-2, #52525B)',
                        fontWeight: 700,
                        fontSize: 12,
                        minWidth: 16,
                      }}
                    >
                      {numMatch[1]}.
                    </span>
                    <span>{renderInlineTokens(numMatch[2], lineKey)}</span>
                  </div>
                );
              }

              return (
                <React.Fragment key={lineKey}>
                  {renderInlineTokens(line, lineKey)}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface PollCardProps {
  messageId: string;
  poll: ChatPoll;
  currentUserId: string;
  allEmployees: Employee[];
  isCreatorOrAdmin: boolean;
  onVote: (messageId: string, optionId: string) => void;
  onToggleClose?: (messageId: string) => void;
}

export function PollCard({
  messageId,
  poll,
  currentUserId,
  allEmployees,
  isCreatorOrAdmin,
  onVote,
  onToggleClose,
}: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voterIds.length, 0);
  const uniqueVoters = new Set(poll.options.flatMap((o) => o.voterIds)).size;

  return (
    <div
      style={{
        marginTop: 10,
        maxWidth: 460,
        borderRadius: 14,
        border: '1px solid var(--card-border, #E4E4E7)',
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(17, 17, 24, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Poll Header */}
      <div
        style={{
          padding: '14px 16px 12px 16px',
          background: '#FAF9F7',
          borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--primary-tint, #F5EBFF)',
              color: 'var(--primary, #A238FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <BarChart2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1, #18181B)', lineHeight: 1.35 }}>
              {poll.question}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
                fontSize: 11,
                color: 'var(--text-3, #A1A1AA)',
              }}
            >
              <span>{poll.allowMultiple ? 'Multiple choice' : 'Single choice'}</span>
              <span>·</span>
              <span>
                {uniqueVoters} {uniqueVoters === 1 ? 'voter' : 'voters'} ({totalVotes}{' '}
                {totalVotes === 1 ? 'vote' : 'votes'})
              </span>
              {poll.anonymous && (
                <>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Lock size={10} /> Anonymous
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: poll.closed ? '#F4F4F5' : '#ECFDF5',
            color: poll.closed ? '#71717A' : '#059669',
            border: poll.closed ? '1px solid #E4E4E7' : '1px solid #A7F3D0',
            flexShrink: 0,
          }}
        >
          {poll.closed ? 'Closed' : 'Live Poll'}
        </span>
      </div>

      {/* Poll Options */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {poll.options.map((opt) => {
          const count = opt.voterIds.length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const hasVoted =
            opt.voterIds.includes(currentUserId) ||
            (currentUserId !== 'user' && opt.voterIds.includes('user'));

          return (
            <button
              key={opt.id}
              type="button"
              disabled={poll.closed}
              onClick={() => onVote(messageId, opt.id)}
              style={{
                position: 'relative',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 10,
                border: hasVoted
                  ? '1.5px solid var(--primary, #A238FF)'
                  : '1px solid var(--card-border, #E4E4E7)',
                background: '#FFFFFF',
                cursor: poll.closed ? 'default' : 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Progress Fill Bar */}
              <div
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: `${pct}%`,
                  background: hasVoted
                    ? 'var(--primary-tint, #F5EBFF)'
                    : 'rgba(24, 24, 27, 0.04)',
                  transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: poll.allowMultiple ? 5 : '50%',
                      border: hasVoted
                        ? 'none'
                        : '1.5px solid var(--text-3, #A1A1AA)',
                      background: hasVoted ? 'var(--primary, #A238FF)' : '#FFFFFF',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {hasVoted && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: hasVoted ? 700 : 500,
                      color: 'var(--text-1, #18181B)',
                    }}
                  >
                    {opt.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Voter Avatar Stack */}
                  {!poll.anonymous && count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {opt.voterIds.slice(0, 3).map((vid, idx) => {
                        const emp = allEmployees.find((e) => String(e.id) === vid);
                        const initials = emp
                          ? `${emp.firstName[0] || ''}${emp.lastName[0] || ''}`
                          : 'U';
                        return (
                          <span
                            key={vid + idx}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#E4E4E7',
                              border: '1.5px solid #FFFFFF',
                              marginLeft: idx === 0 ? 0 : -5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 8,
                              fontWeight: 700,
                              color: '#18181B',
                              overflow: 'hidden',
                            }}
                          >
                            {emp?.avatar ? (
                              <img
                                src={emp.avatar}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              initials
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: hasVoted ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
                      minWidth: 32,
                      textAlign: 'right',
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Poll Footer */}
      {isCreatorOrAdmin && onToggleClose && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-subtle, #F0F0F3)',
            background: '#FAF9F7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-3, #A1A1AA)',
          }}
        >
          <span>Click any option to vote or change your selection</span>
          <button
            type="button"
            onClick={() => onToggleClose(messageId)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-2, #52525B)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {poll.closed ? 'Reopen Poll' : 'End Poll'}
          </button>
        </div>
      )}
    </div>
  );
}
