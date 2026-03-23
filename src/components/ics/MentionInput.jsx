import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';

export default function MentionInput({
  value,
  onChange,
  onMentionSelect,
  members = [],
  placeholder = 'Type a message...',
}) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);

    // Check for @ mention trigger
    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = val.substring(lastAtIndex + 1);
      if (!afterAt.includes(' ')) {
        setMentionIndex(lastAtIndex);
        setMentionSearch(afterAt);
        setMentionOpen(true);
        return;
      }
    }

    setMentionOpen(false);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.full_name?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleSelectMention = (member) => {
    const beforeMention = value.substring(0, mentionIndex);
    const afterMention = value.substring(mentionIndex + mentionSearch.length + 1);
    const newValue = `${beforeMention}@${member.full_name || member.email.split('@')[0]} ${afterMention}`;

    onChange(newValue);
    onMentionSelect?.(member);
    setMentionOpen(false);
    setMentionSearch('');

    // Focus and position cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full dark:bg-gray-700 dark:border-gray-600"
      />

      {mentionOpen && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
          {filteredMembers.map((member) => (
            <button
              key={member.email}
              onClick={() => handleSelectMention(member)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <div className="font-medium text-gray-900 dark:text-white">{member.full_name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
