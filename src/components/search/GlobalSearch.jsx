import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  User, 
  Building2, 
  Target, 
  Hash, 
  MessageSquare,
  Loader2
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const entityConfig = {
  contacts: { icon: User, color: 'bg-blue-100 text-blue-700', label: 'Contact', page: 'Contacts' },
  companies: { icon: Building2, color: 'bg-purple-100 text-purple-700', label: 'Company', page: 'Companies' },
  deals: { icon: Target, color: 'bg-violet-100 text-violet-700', label: 'Deal', page: 'Deals' },
  keywords: { icon: Hash, color: 'bg-emerald-100 text-emerald-700', label: 'Keyword', page: 'Keywords' },
  mentions: { icon: MessageSquare, color: 'bg-pink-100 text-pink-700', label: 'Mention', page: 'SocialListening' },
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({});
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      const searchQuery = query.toLowerCase();

      const [contacts, companies, deals, keywords, mentions] = await Promise.all([
        base44.entities.Contact.list('-created_date', 100),
        base44.entities.Company.list('-created_date', 100),
        base44.entities.Deal.list('-created_date', 100),
        base44.entities.Keyword.list('-created_date', 100),
        base44.entities.ListeningMention.list('-created_date', 100),
      ]);

      const filteredResults = {
        contacts: contacts.filter(c => 
          c.first_name?.toLowerCase().includes(searchQuery) ||
          c.last_name?.toLowerCase().includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery)
        ).slice(0, 5),
        companies: companies.filter(c => 
          c.name?.toLowerCase().includes(searchQuery)
        ).slice(0, 5),
        deals: deals.filter(d => 
          d.title?.toLowerCase().includes(searchQuery)
        ).slice(0, 5),
        keywords: keywords.filter(k => 
          k.keyword?.toLowerCase().includes(searchQuery)
        ).slice(0, 5),
        mentions: mentions.filter(m => 
          m.content?.toLowerCase().includes(searchQuery) ||
          m.author?.toLowerCase().includes(searchQuery)
        ).slice(0, 5),
      };

      setResults(filteredResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const getDisplayName = (type, item) => {
    switch (type) {
      case 'contacts': return `${item.first_name} ${item.last_name || ''}`;
      case 'companies': return item.name;
      case 'deals': return item.title;
      case 'keywords': return item.keyword;
      case 'mentions': return item.content?.slice(0, 50) + '...';
      default: return '';
    }
  };

  const getSubtext = (type, item) => {
    switch (type) {
      case 'contacts': return item.email;
      case 'companies': return item.industry || item.website;
      case 'deals': return `$${item.value?.toLocaleString() || 0} - ${item.stage}`;
      case 'keywords': return `Position: ${item.current_position || '-'}`;
      case 'mentions': return `@${item.author} on ${item.platform}`;
      default: return '';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder="Search everything... (⌘K)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 bg-gray-50 border-gray-200 focus:bg-white h-9"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults({}); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(results).map(([type, items]) => {
                if (items.length === 0) return null;
                const config = entityConfig[type];
                const Icon = config.icon;
                
                return (
                  <div key={type}>
                    <div className="px-3 py-2 bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {type} ({items.length})
                      </span>
                    </div>
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        to={createPageUrl(config.page)}
                        onClick={() => { setIsOpen(false); setQuery(''); }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getDisplayName(type, item)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {getSubtext(type, item)}
                          </p>
                        </div>
                        <Badge className={`${config.color} text-xs`}>
                          {config.label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}