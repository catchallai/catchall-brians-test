import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

/**
 * Strips HTML tags and returns plain text.
 */
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || div.innerText || '';
}

/**
 * Estimates reading time in minutes (avg 200 wpm).
 */
function estimateReadingTime(html) {
  const text = stripHtml(html);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * ReadingProgressBar
 *
 * Props:
 *   content   {string}  HTML content of the wiki page
 *   scrollRef {ref}     ref attached to the scrollable container div
 *   barOnly   {bool}    render only the thin progress bar (no badge)
 *   badgeOnly {bool}    render only the reading time + % badge (no bar)
 */
export default function ReadingProgressBar({ content, scrollRef, barOnly = false, badgeOnly = false }) {
  const [progress, setProgress] = useState(0);
  const readingTime = estimateReadingTime(content);

  useEffect(() => {
    const container = scrollRef?.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollable = scrollHeight - clientHeight;
      setProgress(scrollable <= 0 ? 100 : Math.round((scrollTop / scrollable) * 100));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  if (barOnly) {
    return (
      <div className="h-0.5 w-full bg-gray-100 dark:bg-gray-800 shrink-0">
        <div
          className="h-full bg-violet-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 select-none"
      aria-label={`Estimated reading time: ${readingTime} minute${readingTime !== 1 ? 's' : ''}`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{readingTime} min read</span>
      {progress > 0 && progress < 100 && (
        <span className="ml-1 text-gray-300 dark:text-gray-600">· {progress}% read</span>
      )}
      {progress >= 100 && (
        <span className="ml-1 text-green-500">· Finished ✓</span>
      )}
    </div>
  );
}