import { useState, useMemo } from 'react';
import { Search, X, Hash, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function MessageSearchPanel({ messages = [], channels = [], onSelectMessage, onClose }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return messages
      .filter((m) => !m.is_deleted && m.content?.toLowerCase().includes(q))
      .slice(0, 50);
  }, [messages, query]);

  const getChannel = (channelId) => channels.find((c) => c.id === channelId);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
        <Search size={16} className="text-slate-400 flex-shrink-0" />
        <h3 className="font-semibold text-slate-800 text-sm flex-1">Search Messages</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all messages…"
            className="pl-8 text-sm bg-slate-50 border-slate-200"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded"
            >
              <X size={12} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <MessageSquare size={32} className="text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Type at least 2 characters to search</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <Search size={32} className="text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No results found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <p className="text-xs text-slate-400 px-4 py-2 font-medium">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {results.map((msg) => {
              const ch = getChannel(msg.channel_id);
              const q = query.toLowerCase();
              const idx = msg.content.toLowerCase().indexOf(q);
              const start = Math.max(0, idx - 30);
              const end = Math.min(msg.content.length, idx + query.length + 50);
              const snippet = (start > 0 ? '…' : '') + msg.content.slice(start, end) + (end < msg.content.length ? '…' : '');
              const highlightedParts = snippet.split(new RegExp(`(${query})`, 'gi'));

              return (
                <button
                  key={msg.id}
                  onClick={() => onSelectMessage?.(msg)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-slate-400 text-white text-xs">
                        {msg.sender_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-slate-800 truncate">{msg.sender_name}</span>
                        {ch && (
                          <span className="flex items-center gap-0.5 text-xs text-slate-400">
                            <Hash size={10} />{ch.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {highlightedParts.map((part, i) =>
                          part.toLowerCase() === query.toLowerCase()
                            ? <mark key={i} className="bg-violet-100 text-violet-800 rounded px-0.5">{part}</mark>
                            : <span key={i}>{part}</span>
                        )}
                      </p>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        {new Date(msg.created_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        {' '}
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}