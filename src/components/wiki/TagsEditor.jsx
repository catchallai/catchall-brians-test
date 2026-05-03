import { useState, useRef } from 'react';
import { X, Tag, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function TagsEditor({ tags = [], onChange }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInputValue('');
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
      </div>
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] p-2 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-0"
          >
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)...' : ''}
          className="flex-1 min-w-[120px] text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
        />
      </div>
      <p className="text-xs text-gray-400">Press Enter or comma to add a tag</p>
    </div>
  );
}