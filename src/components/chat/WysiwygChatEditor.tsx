"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileCode,
  List,
  ListOrdered,
  Quote,
  Link2,
} from 'lucide-react';
import { getAnimatedEmojiUrl } from './EmojiGifPicker';

export interface WysiwygEditorRef {
  insertEmoji: (emoji: string) => void;
  insertAnimatedEmoji: (code: string) => void;
  insertMention: (fullName: string) => void;
  triggerAtMention: () => void;
  clear: () => void;
  focus: () => void;
}

interface WysiwygChatEditorProps {
  placeholder?: string;
  compact?: boolean;
  onChange: (serialized: string, hasContent: boolean) => void;
  onSubmit: () => void;
  onMentionQueryChange?: (query: string | null) => void;
}

/**
 * Serialize a contentEditable DOM node tree into clean markdown + [:anim:CODE:] tokens
 */
function serializeDomToRichText(root: HTMLElement): string {
  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\u200B/g, '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') {
      return '\n';
    }

    if (tag === 'img') {
      const animCode = el.getAttribute('data-anim-code');
      if (animCode) {
        return `[:anim:${animCode}:]`;
      }
      return '';
    }

    const childrenText = Array.from(el.childNodes).map(walk).join('');

    if (tag === 'b' || tag === 'strong') {
      if (!childrenText.trim()) return childrenText;
      return `**${childrenText}**`;
    }
    if (tag === 'i' || tag === 'em') {
      if (!childrenText.trim()) return childrenText;
      return `_${childrenText}_`;
    }
    if (tag === 's' || tag === 'strike' || tag === 'del') {
      if (!childrenText.trim()) return childrenText;
      return `~~${childrenText}~~`;
    }
    if (tag === 'code') {
      if (el.parentElement?.tagName.toLowerCase() === 'pre') {
        return childrenText;
      }
      if (!childrenText.trim()) return childrenText;
      return `\`${childrenText}\``;
    }
    if (tag === 'pre') {
      return `\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n`;
    }
    if (tag === 'blockquote') {
      const lines = childrenText
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n');
      return `\n${lines}\n`;
    }
    if (tag === 'ul') {
      const items = Array.from(el.querySelectorAll(':scope > li')).map(
        (li) => `• ${Array.from(li.childNodes).map(walk).join('').trim()}`
      );
      return `\n${items.join('\n')}\n`;
    }
    if (tag === 'ol') {
      const items = Array.from(el.querySelectorAll(':scope > li')).map(
        (li, i) => `${i + 1}. ${Array.from(li.childNodes).map(walk).join('').trim()}`
      );
      return `\n${items.join('\n')}\n`;
    }
    if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      if (href && childrenText) {
        return `[${childrenText}](${href})`;
      }
      return childrenText;
    }
    if (tag === 'div' || tag === 'p') {
      // Block line in contentEditable
      const prev = el.previousSibling;
      const prefix = prev ? '\n' : '';
      return `${prefix}${childrenText}`;
    }

    return childrenText;
  }

  const raw = Array.from(root.childNodes).map(walk).join('');
  return raw.replace(/\n{3,}/g, '\n\n').trim();
}

export const WysiwygChatEditor = forwardRef<WysiwygEditorRef, WysiwygChatEditorProps>(
  function WysiwygChatEditor(
    { placeholder = 'Write a message...', compact = false, onChange, onSubmit, onMentionQueryChange },
    ref
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);

    const [isEmpty, setIsEmpty] = useState(true);
    const [activeFormats, setActiveFormats] = useState({
      bold: false,
      italic: false,
      strikeThrough: false,
      insertUnorderedList: false,
      insertOrderedList: false,
      blockquote: false,
      inlineCode: false,
      codeBlock: false,
    });

    // Save current selection range whenever user interacts with editor
    const saveSelection = useCallback(() => {
      const sel = window.getSelection();
      if (
        sel &&
        sel.rangeCount > 0 &&
        editorRef.current &&
        editorRef.current.contains(sel.anchorNode)
      ) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }, []);

    // Restore selection range before executing toolbar or picker commands
    const restoreSelection = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel) return;
      if (savedRangeRef.current && el.contains(savedRangeRef.current.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } else {
        // Place caret at end of editor
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
    }, []);

    // Check active formatting states at current caret
    const updateFormatState = useCallback(() => {
      try {
        const sel = window.getSelection();
        let inBlockquote = false;
        let inInlineCode = false;
        let inCodeBlock = false;

        if (sel && sel.anchorNode && editorRef.current?.contains(sel.anchorNode)) {
          let curr: Node | null = sel.anchorNode;
          while (curr && curr !== editorRef.current) {
            if (curr.nodeType === Node.ELEMENT_NODE) {
              const t = (curr as HTMLElement).tagName.toLowerCase();
              if (t === 'blockquote') inBlockquote = true;
              if (t === 'pre') inCodeBlock = true;
              if (t === 'code' && !inCodeBlock) inInlineCode = true;
            }
            curr = curr.parentNode;
          }
        }

        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
          blockquote: inBlockquote,
          inlineCode: inInlineCode,
          codeBlock: inCodeBlock,
        });
      } catch {}
    }, []);

    // Detect @mention query before caret
    const checkMentionAtCaret = useCallback(() => {
      if (!onMentionQueryChange) return;
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode || sel.anchorNode.nodeType !== Node.TEXT_NODE) {
        onMentionQueryChange(null);
        return;
      }
      const text = sel.anchorNode.textContent || '';
      const offset = sel.anchorOffset;
      const beforeCaret = text.slice(0, offset);
      const lastAt = beforeCaret.lastIndexOf('@');
      if (lastAt !== -1 && (lastAt === 0 || /\s/.test(beforeCaret[lastAt - 1]))) {
        const query = beforeCaret.slice(lastAt + 1);
        if (!/\s/.test(query)) {
          onMentionQueryChange(query.toLowerCase());
          return;
        }
      }
      onMentionQueryChange(null);
    }, [onMentionQueryChange]);

    // Trigger onChange with serialized content
    const syncContent = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const hasImgs = el.querySelectorAll('img[data-anim-code]').length > 0;
      const plain = (el.textContent || '').replace(/\u200B/g, '').trim();
      const empty = !plain && !hasImgs;
      setIsEmpty(empty);

      const serialized = empty ? '' : serializeDomToRichText(el);
      onChange(serialized, !empty);
      saveSelection();
      updateFormatState();
      checkMentionAtCaret();
    }, [onChange, saveSelection, updateFormatState, checkMentionAtCaret]);

    // Execute standard rich-text command (Bold, Italic, Strike, Lists)
    const execFormat = (cmd: string, value?: string) => {
      restoreSelection();
      document.execCommand(cmd, false, value);
      syncContent();
      updateFormatState();
    };

    // Toggle blockquote directly in live editor
    const toggleBlockquote = () => {
      restoreSelection();
      if (activeFormats.blockquote) {
        document.execCommand('formatBlock', false, 'div');
      } else {
        document.execCommand('formatBlock', false, 'blockquote');
      }
      syncContent();
    };

    // Toggle inline code directly in live editor
    const toggleInlineCode = () => {
      restoreSelection();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      if (activeFormats.inlineCode) {
        // Move caret outside the <code> element or unwrap if selected
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'code') {
            const space = document.createTextNode('\u200B');
            node.parentNode?.insertBefore(space, node.nextSibling);
            const range = document.createRange();
            range.setStartAfter(space);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            savedRangeRef.current = range.cloneRange();
            syncContent();
            return;
          }
          node = node.parentNode;
        }
      } else {
        const range = sel.getRangeAt(0);
        const codeEl = document.createElement('code');
        codeEl.style.padding = '1px 5px';
        codeEl.style.borderRadius = '5px';
        codeEl.style.background = '#F4F4F5';
        codeEl.style.border = '1px solid #E4E4E7';
        codeEl.style.color = '#DB2777';
        codeEl.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        codeEl.style.fontSize = '12.5px';

        if (!range.collapsed) {
          codeEl.appendChild(range.extractContents());
          range.insertNode(codeEl);
          range.selectNodeContents(codeEl);
          range.collapse(false);
        } else {
          const zws = document.createTextNode('\u200B');
          codeEl.appendChild(zws);
          range.insertNode(codeEl);
          range.setStart(zws, 1);
          range.collapse(true);
        }
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
      syncContent();
    };

    // Toggle code block directly in live editor
    const toggleCodeBlock = () => {
      restoreSelection();
      if (activeFormats.codeBlock) {
        document.execCommand('formatBlock', false, 'div');
      } else {
        document.execCommand('formatBlock', false, 'pre');
      }
      syncContent();
    };

    // Insert link directly in live editor
    const handleInsertLink = () => {
      restoreSelection();
      const sel = window.getSelection();
      const selectedText = sel ? sel.toString().trim() : '';
      const url = window.prompt('Enter link URL:', 'https://');
      if (!url || url === 'https://') return;
      restoreSelection();
      if (selectedText) {
        document.execCommand('createLink', false, url);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = url;
        a.style.color = 'var(--primary, #A238FF)';
        a.style.textDecoration = 'underline';
        const s = window.getSelection();
        if (s && s.rangeCount > 0) {
          const r = s.getRangeAt(0);
          r.insertNode(a);
          r.setStartAfter(a);
          r.collapse(true);
          s.removeAllRanges();
          s.addRange(r);
          savedRangeRef.current = r.cloneRange();
        }
      }
      syncContent();
    };

    // Expose imperative methods for Emoji, Animated Emoji, and @Mention insertion
    useImperativeHandle(
      ref,
      () => ({
        insertEmoji: (emoji: string) => {
          restoreSelection();
          document.execCommand('insertText', false, emoji);
          syncContent();
        },
        insertAnimatedEmoji: (code: string) => {
          restoreSelection();
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const range = sel.getRangeAt(0);
          range.deleteContents();

          const img = document.createElement('img');
          img.src = getAnimatedEmojiUrl(code);
          img.alt = '';
          img.setAttribute('data-anim-code', code);
          img.style.width = '22px';
          img.style.height = '22px';
          img.style.verticalAlign = 'middle';
          img.style.display = 'inline-block';
          img.style.margin = '0 2px';
          img.style.userSelect = 'all';

          const trailingSpace = document.createTextNode(' ');
          range.insertNode(trailingSpace);
          range.insertNode(img);

          range.setStartAfter(trailingSpace);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          savedRangeRef.current = range.cloneRange();
          syncContent();
        },
        insertMention: (fullName: string) => {
          restoreSelection();
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;

          // If caret is after @query in a text node, replace @query
          if (sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE) {
            const textNode = sel.anchorNode;
            const text = textNode.textContent || '';
            const offset = sel.anchorOffset;
            const before = text.slice(0, offset);
            const lastAt = before.lastIndexOf('@');
            if (lastAt !== -1) {
              const range = document.createRange();
              range.setStart(textNode, lastAt);
              range.setEnd(textNode, offset);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }

          document.execCommand('insertText', false, `@${fullName} `);
          if (onMentionQueryChange) onMentionQueryChange(null);
          syncContent();
        },
        triggerAtMention: () => {
          restoreSelection();
          document.execCommand('insertText', false, '@');
          syncContent();
        },
        clear: () => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
          savedRangeRef.current = null;
          setIsEmpty(true);
          onChange('', false);
          updateFormatState();
        },
        focus: () => {
          editorRef.current?.focus();
        },
      }),
      [restoreSelection, syncContent, onChange, onMentionQueryChange, updateFormatState]
    );

    useEffect(() => {
      const handleSelectionChange = () => {
        if (
          editorRef.current &&
          document.activeElement === editorRef.current
        ) {
          saveSelection();
          updateFormatState();
        }
      };
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [saveSelection, updateFormatState]);

    const toolbarButtons = [
      {
        icon: <Bold size={compact ? 12.5 : 13.5} />,
        title: 'Bold (Cmd+B)',
        active: activeFormats.bold,
        onClick: () => execFormat('bold'),
      },
      {
        icon: <Italic size={compact ? 12.5 : 13.5} />,
        title: 'Italic (Cmd+I)',
        active: activeFormats.italic,
        onClick: () => execFormat('italic'),
      },
      {
        icon: <Strikethrough size={compact ? 12.5 : 13.5} />,
        title: 'Strikethrough (Cmd+Shift+X)',
        active: activeFormats.strikeThrough,
        onClick: () => execFormat('strikeThrough'),
      },
      { divider: true },
      {
        icon: <Link2 size={compact ? 12.5 : 13.5} />,
        title: 'Insert Link',
        active: false,
        onClick: handleInsertLink,
      },
      {
        icon: <ListOrdered size={compact ? 12.5 : 13.5} />,
        title: 'Numbered List',
        active: activeFormats.insertOrderedList,
        onClick: () => execFormat('insertOrderedList'),
      },
      {
        icon: <List size={compact ? 12.5 : 13.5} />,
        title: 'Bulleted List',
        active: activeFormats.insertUnorderedList,
        onClick: () => execFormat('insertUnorderedList'),
      },
      {
        icon: <Quote size={compact ? 12.5 : 13.5} />,
        title: 'Blockquote',
        active: activeFormats.blockquote,
        onClick: toggleBlockquote,
      },
      { divider: true },
      {
        icon: <Code size={compact ? 12.5 : 13.5} />,
        title: 'Inline Code',
        active: activeFormats.inlineCode,
        onClick: toggleInlineCode,
      },
      {
        icon: <FileCode size={compact ? 12.5 : 13.5} />,
        title: 'Code Block',
        active: activeFormats.codeBlock,
        onClick: toggleCodeBlock,
      },
    ];

    return (
      <div>
        {/* Top Live WYSIWYG Formatting Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: compact ? '4px 8px' : '5px 10px',
            borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {toolbarButtons.map((item, idx) =>
              item.divider ? (
                <div
                  key={idx}
                  style={{
                    width: 1,
                    height: 15,
                    background: 'var(--border-subtle, #F0F0F3)',
                    margin: '0 4px',
                  }}
                />
              ) : (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => {
                    // Prevent button click from stealing focus from contentEditable
                    e.preventDefault();
                    item.onClick?.();
                  }}
                  title={item.title}
                  style={{
                    width: compact ? 24 : 26,
                    height: compact ? 24 : 26,
                    borderRadius: 6,
                    border: item.active
                      ? '1px solid rgba(162, 56, 255, 0.3)'
                      : '1px solid transparent',
                    background: item.active
                      ? 'var(--primary-light, #F5EBFF)'
                      : 'transparent',
                    color: item.active
                      ? 'var(--primary, #A238FF)'
                      : 'var(--text-2, #52525B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {item.icon}
                </button>
              )
            )}
          </div>

          {!compact && (
            <span style={{ fontSize: 10.5, color: 'var(--text-3, #A1A1AA)' }}>
              Enter to send · Shift+Enter for new line
            </span>
          )}
        </div>

        {/* Live ContentEditable Input Box */}
        <div
          style={{
            position: 'relative',
            padding: compact ? '8px 12px' : '10px 14px',
            minHeight: compact ? 46 : 52,
            maxHeight: 180,
            overflowY: 'auto',
          }}
          onClick={() => editorRef.current?.focus()}
        >
          {isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: compact ? 8 : 10,
                left: compact ? 12 : 14,
                right: compact ? 12 : 14,
                fontSize: compact ? 12.5 : 13.5,
                color: 'var(--text-3, #A1A1AA)',
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: 1.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {placeholder}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncContent}
            onKeyUp={() => {
              saveSelection();
              updateFormatState();
              checkMentionAtCaret();
            }}
            onMouseUp={() => {
              saveSelection();
              updateFormatState();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                // If inside a list (<ul>/<ol>) or <pre>, allow Shift+Enter or check if user wants to send
                e.preventDefault();
                onSubmit();
                return;
              }
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                execFormat('bold');
              } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                execFormat('italic');
              } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                execFormat('strikeThrough');
              }
            }}
            className="wysiwyg-chat-input"
            style={{
              outline: 'none',
              fontSize: compact ? 12.5 : 13.5,
              color: 'var(--text-1, #18181B)',
              lineHeight: 1.5,
              minHeight: compact ? 28 : 32,
              wordBreak: 'break-word',
            }}
          />
        </div>

        <style>{`
          .wysiwyg-chat-input b, .wysiwyg-chat-input strong {
            font-weight: 700;
          }
          .wysiwyg-chat-input i, .wysiwyg-chat-input em {
            font-style: italic;
          }
          .wysiwyg-chat-input s, .wysiwyg-chat-input strike, .wysiwyg-chat-input del {
            text-decoration: line-through;
          }
          .wysiwyg-chat-input blockquote {
            margin: 4px 0;
            padding: 2px 10px;
            border-left: 3px solid var(--primary, #A238FF);
            color: var(--text-2, #52525B);
            background: rgba(162, 56, 255, 0.04);
            border-radius: 0 6px 6px 0;
          }
          .wysiwyg-chat-input pre {
            margin: 4px 0;
            padding: 8px 10px;
            border-radius: 8px;
            background: #18181B;
            color: #F4F4F5;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            white-space: pre-wrap;
          }
          .wysiwyg-chat-input ul {
            margin: 4px 0;
            padding-left: 20px;
            list-style-type: disc;
          }
          .wysiwyg-chat-input ol {
            margin: 4px 0;
            padding-left: 20px;
            list-style-type: decimal;
          }
        `}</style>
      </div>
    );
  }
);
