import { useState, useEffect } from 'react';
import { ChevronDown, List } from 'lucide-react';

/**
 * TableOfContents
 * Extracts H1, H2, H3 headers from HTML content and renders a clickable navigation sidebar.
 *
 * Props:
 *   content        {string}  HTML content string
 *   scrollRef      {ref}     ref to the scrollable container
 *   className      {string}  optional CSS classes
 */
export default function TableOfContents({ content, scrollRef, className = '' }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Parse HTML content and extract headers with IDs
  useEffect(() => {
    if (!content) {
      setHeadings([]);
      return;
    }

    // Create a temporary DOM element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = content;

    const headerElements = Array.from(temp.querySelectorAll('h1, h2, h3'));
    const extractedHeadings = headerElements.map((el, idx) => {
      const level = parseInt(el.tagName[1]);
      const text = el.textContent || 'Untitled';

      // Generate ID if not present
      if (!el.id) {
        el.id = `heading-${level}-${idx}`;
      }

      return {
        id: el.id,
        level,
        text,
        element: el,
      };
    });

    setHeadings(extractedHeadings);
  }, [content]);

  // Track scroll position to highlight active section
  useEffect(() => {
    const container = scrollRef?.current;
    if (!container || headings.length === 0) return;

    const handleScroll = () => {
      let currentActive = null;
      const scrollTop = container.scrollTop;

      for (const heading of headings) {
        // Get the scroll position relative to the scrollable container
        const elementTop = heading.element.offsetTop - heading.element.offsetParent.offsetTop + container.offsetTop;
        if (scrollTop >= elementTop - 100) {
          currentActive = heading.id;
        }
      }

      setActiveId(currentActive);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef, headings]);

  const handleNavClick = (headingId) => {
    const element = document.getElementById(headingId);
    const container = scrollRef?.current;

    if (element && container) {
      const elementTop = element.offsetTop - element.offsetParent.offsetTop;
      container.scrollTop = elementTop - 80; // Offset for toolbar
    }
  };

  if (headings.length === 0) {
    return (
      <div className={`text-xs text-gray-400 dark:text-gray-600 flex items-center gap-2 p-3 ${className}`}>
        <List className="w-4 h-4" />
        <span>No headings</span>
      </div>
    );
  }

  return (
    <nav className={`bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-800 p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        <List className="w-3.5 h-3.5" />
        Contents
      </div>

      <ul className="space-y-1 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} style={{ marginLeft: `${(heading.level - 1) * 12}px` }}>
            <button
              onClick={() => handleNavClick(heading.id)}
              className={`block w-full text-left px-2 py-1.5 rounded-md transition-all duration-150 truncate ${
                activeId === heading.id
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
              title={heading.text}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}