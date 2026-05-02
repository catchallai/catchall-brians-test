import React from 'react';

/**
 * Renders a message string that may contain markdown-style formatting:
 *   **bold**, _italic_, `code`, and lines starting with • as bullet items.
 */
export default function FormattedMessage({ content, deleted }) {
  if (deleted) {
    return <span className="text-sm text-slate-400 italic">{content}</span>;
  }

  return (
    <span className="text-sm leading-relaxed text-slate-800">
      {parseContent(content)}
    </span>
  );
}

function parseContent(text) {
  if (!text) return null;

  // Split by newlines to handle bullet points and multi-line content
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const isBullet = line.startsWith('• ') || line.startsWith('- ');
    const lineContent = isBullet ? line.slice(2) : line;

    const rendered = parseInline(lineContent);

    if (isBullet) {
      return (
        <span key={lineIdx} className="flex items-start gap-1.5">
          <span className="mt-0.5 text-slate-500 select-none">•</span>
          <span>{rendered}</span>
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    }

    return (
      <React.Fragment key={lineIdx}>
        {rendered}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * Parse inline formatting: **bold**, _italic_, `code`
 */
function parseInline(text) {
  // Tokenise by our three patterns
  const pattern = /(\*\*(.+?)\*\*|_(.+?)_|`(.+?)`)/gs;
  const parts = [];
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }

    const full = match[0];
    if (full.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-900">{match[2]}</strong>);
    } else if (full.startsWith('_')) {
      parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    } else if (full.startsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-100 text-violet-700 font-mono text-xs">
          {match[4]}
        </code>
      );
    }

    last = match.index + full.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}