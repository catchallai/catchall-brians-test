import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function MentionInput({
  value,
  onChange,
  onMentionsChange,
  placeholder = 'Type @ to mention someone...',
  businessId,
}) {
  const [mentions, setMentions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const textareaRef = useRef(null);

  const { data: users = [] } = useQuery({
    queryKey: ['team-users', businessId],
    queryFn: async () => {
      if (!businessId) {
        return [];
      }
      return await base44.entities.User.list();
    },
    enabled: !!businessId,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email.includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    // Check for @ mentions
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1);

      // If there's a space after @, close suggestions
      if (afterAt.includes(' ')) {
        setShowSuggestions(false);
      } else {
        setSearchTerm(afterAt);
        setShowSuggestions(true);
        setSuggestionIndex(0);
      }
    } else {
      setShowSuggestions(false);
      setSearchTerm('');
    }
  };

  const handleSelectUser = (user) => {
    const lastAtIndex = value.lastIndexOf('@');
    const beforeAt = value.substring(0, lastAtIndex);
    const restOfText = value.substring(lastAtIndex + 1 + searchTerm.length);

    const newText = `${beforeAt}@${user.full_name || user.email} ${restOfText}`;
    onChange(newText);

    if (!mentions.includes(user.email)) {
      const newMentions = [...mentions, user.email];
      setMentions(newMentions);
      onMentionsChange?.(newMentions);
    }

    setShowSuggestions(false);
    setSearchTerm('');
  };

  const removeMention = (email) => {
    const newMentions = mentions.filter((m) => m !== email);
    setMentions(newMentions);
    onMentionsChange?.(newMentions);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-12"
        />

        {/* Mention suggestions dropdown */}
        {showSuggestions && filteredUsers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {filteredUsers.map((user, idx) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  idx === suggestionIndex
                    ? 'bg-violet-100 dark:bg-violet-900'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Display mentioned users */}
      {mentions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Mentioning:</span>
          {mentions.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1">
              @{email.split('@')[0]}
              <button onClick={() => removeMention(email)} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
