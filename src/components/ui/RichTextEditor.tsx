"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  KeyboardEvent,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Minus,
  Sparkles,
  Eye,
  Check,
  CornerDownLeft,
  Link,
  Unlink,
  RemoveFormatting,
  Undo2,
  Redo2,
  GripHorizontal,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ─── Formatting helpers ────────────────────────────────────────────────────────

export function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    freelance: "Freelance",
    temporary: "Temporary",
    volunteer: "Volunteer",
  };
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPostedDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted yesterday";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffDays < 14) return "Posted 1 week ago";
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "Posted 1 month ago";
  return `Posted ${Math.floor(diffDays / 30)} months ago`;
}

// ─── RichTextRenderer — safe HTML display ─────────────────────────────────────

interface RichTextRendererProps {
  content?: string;
  html?: string;
  className?: string;
}

export function RichTextRenderer({ content, html, className = "" }: RichTextRendererProps) {
  const raw = content || html || "";
  if (!raw) return null;
  return (
    <div
      className={`rich-rendered-html ${className}`}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

// ─── Toolbar button ────────────────────────────────────────────────────────────

interface ToolbarBtnProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, title, active, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor blur so selection stays
        onClick();
      }}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: active ? "1.5px solid var(--primary, #A238FF)" : "1px solid transparent",
        background: active ? "var(--primary-tint, #F3E8FF)" : "transparent",
        color: active ? "var(--primary, #A238FF)" : "var(--text-3, #6B6B63)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#F3F3EF";
          e.currentTarget.style.color = "var(--text-1, #1E1D19)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-3, #6B6B63)";
        }
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: "var(--card-border, #EAEAE4)",
        margin: "0 4px",
      }}
    />
  );
}

// ─── RichTextEditor — main component ──────────────────────────────────────────

export interface SlashCommandMacro {
  id: string;
  title: string;
  shortcut: string;
  category?: string;
  subject?: string;
  bodyHtml: string;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  maxHeight?: number | string;
  resizable?: boolean;
  showFooter?: boolean;
  onSubmit?: () => void;
  macros?: SlashCommandMacro[];
  onSelectMacro?: (macro: SlashCommandMacro) => void;
  onViewMacro?: (macro: SlashCommandMacro) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing job responsibilities, requirements, and benefits…",
  minHeight = 240,
  maxHeight,
  resizable = true,
  showFooter = true,
  onSubmit,
  macros,
  onSelectMacro,
  onViewMacro,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const isInitialized = useRef(false);

  // Height and expansion state
  const [editorHeight, setEditorHeight] = useState<number | string>(minHeight);
  const [isExpanded, setIsExpanded] = useState(false);
  const [counts, setCounts] = useState({ words: 0, chars: 0 });

  useEffect(() => {
    if (minHeight) {
      setEditorHeight(minHeight);
    }
  }, [minHeight]);

  // Slash commands autocomplete state
  const [slashState, setSlashState] = useState<{ query: string; coords: { top: number; left: number } } | null>(null);
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);

  // Synchronize HTML content with external changes (e.g. applying a macro template)
  useEffect(() => {
    if (editorRef.current) {
      if (!isInitialized.current) {
        editorRef.current.innerHTML = value || "";
        isInitialized.current = true;
      } else if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  // Track active formats on selection change
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    try {
      if (document.queryCommandState("bold")) formats.add("bold");
      if (document.queryCommandState("italic")) formats.add("italic");
      if (document.queryCommandState("underline")) formats.add("underline");
      if (document.queryCommandState("strikeThrough")) formats.add("strikeThrough");
      if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
      if (document.queryCommandState("insertOrderedList")) formats.add("ol");
    } catch {}
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  // Filter macros based on slash query
  const filteredMacros = (macros || []).filter((m) => {
    if (!slashState?.query) return true;
    const q = slashState.query.toLowerCase();
    return m.shortcut.toLowerCase().includes(q) || m.title.toLowerCase().includes(q);
  });

  // Check if cursor is right after a slash command
  const checkSlashCommand = useCallback(() => {
    if (!macros || macros.length === 0) {
      setSlashState(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      setSlashState(null);
      return;
    }
    const anchorNode = sel.anchorNode;
    if (!anchorNode || !editorRef.current.contains(anchorNode)) {
      setSlashState(null);
      return;
    }

    const fullText = anchorNode.textContent || "";
    const offset = sel.anchorOffset;
    const beforeCaret = fullText.slice(0, offset);

    // Match /query at beginning of line or preceded by whitespace
    const match = beforeCaret.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (match) {
      const query = match[1] || "";
      let coords = { top: 52, left: 16 };
      try {
        const range = sel.getRangeAt(0).cloneRange();
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (rect && containerRect && rect.bottom > 0) {
          coords = {
            top: rect.bottom - containerRect.top + 6,
            left: Math.max(12, Math.min(rect.left - containerRect.left, (containerRect.width || 400) - 340)),
          };
        }
      } catch {}

      setSlashState({ query, coords });
      setSelectedSlashIdx(0);
    } else {
      setSlashState(null);
    }
  }, [macros]);

  // Close slash popover on click outside
  useEffect(() => {
    if (!slashState) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSlashState(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashState]);

  // Apply macro and clean up slash command from text
  const applyMacro = useCallback(
    (macro: SlashCommandMacro) => {
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editorRef.current) {
          const anchorNode = sel.anchorNode;
          if (anchorNode && editorRef.current.contains(anchorNode)) {
            const fullText = anchorNode.textContent || "";
            const offset = sel.anchorOffset;
            const beforeCaret = fullText.slice(0, offset);
            const match = beforeCaret.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
            if (match) {
              const slashLen = match[0].trimStart().length;
              const startOffset = Math.max(0, offset - slashLen);
              const range = document.createRange();
              range.setStart(anchorNode, startOffset);
              range.setEnd(anchorNode, offset);
              range.deleteContents();
            }
          }
        }
      } catch (err) {
        console.warn("Failed to clean slash query", err);
      }

      setSlashState(null);

      if (onSelectMacro) {
        onSelectMacro(macro);
      } else {
        editorRef.current?.focus();
        document.execCommand("insertHTML", false, macro.bodyHtml);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
      }
    },
    [onSelectMacro, onChange]
  );

  const exec = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      updateActiveFormats();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    },
    [onChange, updateActiveFormats]
  );

  const handleInsertLink = useCallback(() => {
    const url = window.prompt("Enter link URL (e.g. https://easyhr.pro):", "https://");
    if (url && url.trim() && url !== "https://") {
      exec("createLink", url.trim());
    }
  }, [exec]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      const text = editorRef.current.innerText || "";
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setCounts({ words, chars: text.length });
    }
    checkSlashCommand();
  }, [onChange, checkSlashCommand]);

  const handleKeyUp = useCallback(() => {
    checkSlashCommand();
  }, [checkSlashCommand]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // If slash autocomplete popover is open
      if (slashState && filteredMacros.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSlashIdx((prev) => (prev + 1) % filteredMacros.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSlashIdx((prev) => (prev - 1 + filteredMacros.length) % filteredMacros.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const chosen = filteredMacros[selectedSlashIdx];
          if (chosen) {
            applyMacro(chosen);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashState(null);
          return;
        }
      }

      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod) {
        if (e.key === "Enter" && onSubmit) {
          e.preventDefault();
          onSubmit();
          return;
        }
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            exec("bold");
            break;
          case "i":
            e.preventDefault();
            exec("italic");
            break;
          case "u":
            e.preventDefault();
            exec("underline");
            break;
          case "z":
            if (e.shiftKey) {
              e.preventDefault();
              exec("redo");
            } else {
              e.preventDefault();
              exec("undo");
            }
            break;
          case "y":
            e.preventDefault();
            exec("redo");
            break;
        }
      }
    },
    [slashState, filteredMacros, selectedSlashIdx, applyMacro, exec]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        border: "1.5px solid var(--card-border, #EAEAE4)",
        borderRadius: 12,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        transition: "border-color 0.15s ease",
      }}
      onFocusCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary, #A238FF)";
      }}
      onBlurCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--card-border, #EAEAE4)";
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          padding: "8px 12px",
          background: "#FAFAFA",
          borderBottom: "1px solid var(--card-border, #EAEAE4)",
        }}
      >
        <ToolbarBtn onClick={() => exec("bold")} title="Bold (⌘B)" active={activeFormats.has("bold")}>
          <Bold size={15} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Italic (⌘I)" active={activeFormats.has("italic")}>
          <Italic size={15} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("underline")} title="Underline (⌘U)" active={activeFormats.has("underline")}>
          <Underline size={15} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough" active={activeFormats.has("strikeThrough")}>
          <Strikethrough size={15} strokeWidth={2.5} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2">
          <Heading2 size={16} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("formatBlock", "h3")} title="Heading 3">
          <Heading3 size={16} strokeWidth={2.5} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet List" active={activeFormats.has("ul")}>
          <List size={16} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered List" active={activeFormats.has("ol")}>
          <ListOrdered size={16} strokeWidth={2.5} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align Left">
          <AlignLeft size={15} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyCenter")} title="Align Center">
          <AlignCenter size={15} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyRight")} title="Align Right">
          <AlignRight size={15} strokeWidth={2} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec("formatBlock", "blockquote")} title="Quote">
          <Quote size={15} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal Divider">
          <Minus size={15} strokeWidth={2} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={handleInsertLink} title="Insert Link">
          <Link size={15} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("unlink")} title="Remove Link">
          <Unlink size={15} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("removeFormat")} title="Clear Formatting">
          <RemoveFormatting size={15} strokeWidth={2} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec("undo")} title="Undo (⌘Z)">
          <Undo2 size={15} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("redo")} title="Redo (⌘Y)">
          <Redo2 size={15} strokeWidth={2} />
        </ToolbarBtn>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Collapse height" : "Expand height"}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid var(--card-border, #EAEAE4)",
              background: isExpanded ? "var(--primary-tint, #F3E8FF)" : "white",
              color: isExpanded ? "var(--primary, #A238FF)" : "var(--text-3, #6B6B63)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isExpanded ? "Standard" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* Editing surface */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rich-editor-surface"
        style={{
          minHeight: isExpanded ? 480 : editorHeight,
          maxHeight: maxHeight || (isExpanded ? "85vh" : "65vh"),
          resize: resizable ? "vertical" : "none",
          overflowY: "auto",
          padding: "16px 20px",
          borderBottomLeftRadius: showFooter ? 0 : 11,
          borderBottomRightRadius: showFooter ? 0 : 11,
          outline: "none",
          lineHeight: 1.6,
          fontSize: 14,
          fontFamily: "inherit",
          color: "var(--text-1)",
        }}
      />

      {/* Resizable Footer & Word Count Status Bar */}
      {showFooter && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 14px",
            background: "#FAFAFA",
            borderTop: "1px solid var(--card-border, #EAEAE4)",
            borderBottomLeftRadius: 11,
            borderBottomRightRadius: 11,
            fontSize: 11,
            color: "var(--text-4, #9E9E95)",
            userSelect: "none",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>
              {counts.words} {counts.words === 1 ? "word" : "words"} • {counts.chars} chars
            </span>
            <span style={{ color: "var(--text-4)", opacity: 0.6 }}>• Type / for templates</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>Height:</span>
            {[
              { label: "180px", h: 180 },
              { label: "320px", h: 320 },
              { label: "480px", h: 480 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setEditorHeight(p.h);
                  setIsExpanded(false);
                }}
                style={{
                  padding: "2px 7px",
                  fontSize: 10.5,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: editorHeight === p.h && !isExpanded ? "var(--primary, #A238FF)" : "var(--card-border, #EAEAE4)",
                  background: editorHeight === p.h && !isExpanded ? "var(--primary-tint, #F3E8FF)" : "white",
                  color: editorHeight === p.h && !isExpanded ? "var(--primary, #A238FF)" : "var(--text-3, #6B6B63)",
                  cursor: "pointer",
                  fontWeight: editorHeight === p.h && !isExpanded ? 700 : 500,
                }}
              >
                {p.label}
              </button>
            ))}

            {resizable && (
              <div
                title="Drag the bottom right corner to resize vertically"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  marginLeft: 6,
                  color: "var(--text-4, #9E9E95)",
                  fontSize: 10,
                }}
              >
                <GripHorizontal size={13} />
                <span>Resizable</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Slash Autocomplete Popover */}
      {slashState && filteredMacros.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: slashState.coords.top,
            left: slashState.coords.left,
            width: 340,
            maxWidth: "calc(100% - 24px)",
            background: "#FFFFFF",
            border: "1.5px solid var(--primary, #A238FF)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)",
            zIndex: 1000,
            overflow: "hidden",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              background: "#FBFBFA",
              borderBottom: "1px solid var(--card-border, #EAEAE4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-3, #6B6B63)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={13} style={{ color: "var(--primary, #A238FF)" }} />
              <span>TEMPLATES {slashState.query ? `MATCHING "/${slashState.query}"` : "LIST"}</span>
            </div>
            <span
              style={{
                fontSize: 10,
                background: "var(--primary-tint, #F3E8FF)",
                color: "var(--primary, #A238FF)",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 800,
              }}
            >
              {filteredMacros.length} available
            </span>
          </div>

          {/* Items List */}
          <div style={{ maxHeight: 260, overflowY: "auto", padding: "6px 8px" }}>
            {filteredMacros.map((macro, idx) => {
              const isSelected = idx === selectedSlashIdx;
              return (
                <div
                  key={macro.id}
                  onClick={() => applyMacro(macro)}
                  onMouseEnter={() => setSelectedSlashIdx(idx)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSelected ? "var(--primary-tint, #F3E8FF)" : "transparent",
                    transition: "background 0.1s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          fontFamily: "monospace",
                          color: "var(--primary, #A238FF)",
                          background: isSelected ? "white" : "rgba(162, 56, 255, 0.08)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        /{macro.shortcut}
                      </span>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--text-1, #1E1D19)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {macro.title}
                      </span>
                    </div>
                    {macro.subject && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-4, #9E9E95)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 2,
                        }}
                      >
                        {macro.subject}
                      </div>
                    )}
                  </div>

                  {/* Actions: View and Apply */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {onViewMacro && (
                      <button
                        type="button"
                        title="View Macro preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlashState(null);
                          onViewMacro(macro);
                        }}
                        style={{
                          padding: "4px 7px",
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 6,
                          border: "1px solid var(--card-border, #EAEAE4)",
                          background: "white",
                          color: "var(--text-2, #3C3B36)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--primary, #A238FF)";
                          e.currentTarget.style.color = "var(--primary, #A238FF)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--card-border, #EAEAE4)";
                          e.currentTarget.style.color = "var(--text-2, #3C3B36)";
                        }}
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    )}
                    <button
                      type="button"
                      title="Apply Macro"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyMacro(macro);
                      }}
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        border: "none",
                        background: "var(--primary, #A238FF)",
                        color: "white",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <span>Apply</span>
                      <CornerDownLeft size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyboard Hints Footer */}
          <div
            style={{
              padding: "6px 12px",
              background: "#FAFAFA",
              borderTop: "1px solid var(--card-border, #EAEAE4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--text-4, #9E9E95)",
            }}
          >
            <span>↑↓ Navigate • ↵ Apply</span>
            <span>Esc to dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
