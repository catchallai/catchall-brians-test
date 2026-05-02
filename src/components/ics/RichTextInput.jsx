import React, { useRef, useState, useCallback } from 'react';
import { Bold, Italic, Code, List } from 'lucide-react';

/**
 * A contentEditable-based rich text input that stores its value as markdown.
 * Formatting is applied as markdown syntax inserted around the selection.
 */
export default function RichTextInput({ value, onChange, onKeyDown, placeholder }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  // Keep textarea value in sync (plain markdown text)
  const handleInput = () => {
    onChange(ref.current?.innerText ?? '');
  };

  /** Wrap the current selection with prefix/suffix markdown tokens */
  const wrapSelection = useCallback((prefix, suffix = prefix) => {
    const el = ref.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const selected = range.toString();
    const wrapped = `${prefix}${selected || 'text'}${suffix}`;

    range.deleteContents();
    const textNode = document.createTextNode(wrapped);
    range.insertNode(textNode);

    // Move caret to end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);

    onChange(el.innerText);
  }, [onChange]);

  /** Insert a bullet list item on a new line */
  const insertBullet = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode('\n• ');
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);

    onChange(el.innerText);
  }, [onChange]);

  const isEmpty = !value || value.trim() === '';

  return (
    <div className={`flex-1 rounded-xl border transition-colors ${focused ? 'border-violet-400 ring-1 ring-violet-200' : 'border-slate-200'} bg-white`}>
      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 border-b border-slate-100">
        <ToolbarBtn icon={Bold} title="Bold (wrap with **)" onClick={() => wrapSelection('**')} />
        <ToolbarBtn icon={Italic} title="Italic (wrap with _)" onClick={() => wrapSelection('_')} />
        <ToolbarBtn icon={Code} title="Code (wrap with `)" onClick={() => wrapSelection('`')} />
        <ToolbarBtn icon={List} title="Bullet point" onClick={insertBullet} />
      </div>

      {/* Editable area */}
      <div className="relative px-3 py-2 min-h-[40px] max-h-40 overflow-y-auto">
        {isEmpty && !focused && (
          <span className="absolute top-2 left-3 text-slate-400 text-sm pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="outline-none text-sm text-slate-900 whitespace-pre-wrap break-words"
          spellCheck
        />
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
    >
      <Icon size={14} />
    </button>
  );
}