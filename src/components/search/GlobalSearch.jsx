import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  User,
  Building2,
  Target,
  Hash,
  MessageSquare,
  Loader2,
  Calendar,
  FileSignature,
  Rocket,
  Users,
  FileText,
  Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const entityConfig = {
  contacts: {
    icon: User,
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    label: 'Contact',
    page: 'Contacts',
  },
  companies: {
    icon: Building2,
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    label: 'Company',
    page: 'Companies',
  },
  deals: {
    icon: Target,
    color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    label: 'Deal',
    page: 'Deals',
  },
  opportunities: {
    icon: Target,
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    label: 'Opportunity',
    page: 'Opportunities',
  },
  activities: {
    icon: Calendar,
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    label: 'Activity',
    page: 'Activities',
  },
  legalDocuments: {
    icon: FileSignature,
    color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    label: 'Legal Doc',
    page: 'LegalDocuments',
  },
  aerospaceCompanies: {
    icon: Rocket,
    color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    label: 'Aerospace',
    page: 'AerospaceScanner',
  },
  competitors: {
    icon: Users,
    color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    label: 'Competitor',
    page: 'CompetitorAnalysis',
  },
  proposals: {
    icon: FileText,
    color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    label: 'Proposal',
    page: 'Proposals',
  },
  keywords: {
    icon: Hash,
    color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    label: 'Keyword',
    page: 'Keywords',
  },
  mentions: {
    icon: MessageSquare,
    color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    label: 'Mention',
    page: 'SocialListening',
  },
  journalists: {
    icon: Mail,
    color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    label: 'Journalist',
    page: 'MediaOutreach',
  },
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

      const [
        contacts,
        companies,
        deals,
        opportunities,
        activities,
        legalDocuments,
        aerospaceCompanies,
        competitors,
        proposals,
        keywords,
        mentions,
        journalists,
      ] = await Promise.all([
        base44.entities.Contact.list('-created_date', 100).catch(() => []),
        base44.entities.Company.list('-created_date', 100).catch(() => []),
        base44.entities.Deal.list('-created_date', 100).catch(() => []),
        base44.entities.Opportunity.list('-created_date', 100).catch(() => []),
        base44.entities.Activity.list('-created_date', 100).catch(() => []),
        base44.entities.LegalDocument.list('-created_date', 100).catch(() => []),
        base44.entities.AerospaceCompany.list('-created_date', 100).catch(() => []),
        base44.entities.Competitor.list('-created_date', 100).catch(() => []),
        base44.entities.Proposal.list('-created_date', 100).catch(() => []),
        base44.entities.Keyword.list('-created_date', 100).catch(() => []),
        base44.entities.ListeningMention.list('-created_date', 100).catch(() => []),
        base44.entities.Journalist.list('-created_date', 100).catch(() => []),
      ]);

      const filteredResults = {
        contacts: contacts
          .filter(
            (c) =>
              c.first_name?.toLowerCase().includes(searchQuery) ||
              c.last_name?.toLowerCase().includes(searchQuery) ||
              c.email?.toLowerCase().includes(searchQuery) ||
              c.company_name?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        companies: companies
          .filter(
            (c) =>
              c.name?.toLowerCase().includes(searchQuery) ||
              c.industry?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        deals: deals.filter((d) => d.title?.toLowerCase().includes(searchQuery)).slice(0, 5),
        opportunities: opportunities
          .filter(
            (o) =>
              o.title?.toLowerCase().includes(searchQuery) ||
              o.description?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        activities: activities
          .filter(
            (a) =>
              a.title?.toLowerCase().includes(searchQuery) ||
              a.description?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        legalDocuments: legalDocuments
          .filter(
            (l) =>
              l.title?.toLowerCase().includes(searchQuery) ||
              l.recipient_name?.toLowerCase().includes(searchQuery) ||
              l.document_type?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        aerospaceCompanies: aerospaceCompanies
          .filter(
            (a) =>
              a.company_name?.toLowerCase().includes(searchQuery) ||
              a.ceo?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        competitors: competitors
          .filter(
            (c) =>
              c.name?.toLowerCase().includes(searchQuery) ||
              c.website?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        proposals: proposals
          .filter(
            (p) =>
              p.title?.toLowerCase().includes(searchQuery) ||
              p.client_name?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        keywords: keywords
          .filter((k) => k.keyword?.toLowerCase().includes(searchQuery))
          .slice(0, 5),
        mentions: mentions
          .filter(
            (m) =>
              m.content?.toLowerCase().includes(searchQuery) ||
              m.author?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
        journalists: journalists
          .filter(
            (j) =>
              j.name?.toLowerCase().includes(searchQuery) ||
              j.publication?.toLowerCase().includes(searchQuery) ||
              j.email?.toLowerCase().includes(searchQuery)
          )
          .slice(0, 5),
      };

      setResults(filteredResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const getDisplayName = (type, item) => {
    switch (type) {
      case 'contacts':
        return `${item.first_name} ${item.last_name || ''}`;
      case 'companies':
        return item.name;
      case 'deals':
        return item.title;
      case 'opportunities':
        return item.title;
      case 'activities':
        return item.title;
      case 'legalDocuments':
        return item.title;
      case 'aerospaceCompanies':
        return item.company_name;
      case 'competitors':
        return item.name;
      case 'proposals':
        return item.title;
      case 'keywords':
        return item.keyword;
      case 'mentions':
        return item.content?.slice(0, 50) + '...';
      case 'journalists':
        return item.name;
      default:
        return '';
    }
  };

  const getSubtext = (type, item) => {
    switch (type) {
      case 'contacts':
        return item.email || item.company_name;
      case 'companies':
        return item.industry || item.website;
      case 'deals':
        return `$${item.value?.toLocaleString() || 0} - ${item.stage}`;
      case 'opportunities':
        return `${item.status} - ${item.priority || 'normal'} priority`;
      case 'activities':
        return `${item.type} - ${item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No date'}`;
      case 'legalDocuments':
        return `${item.document_type} - ${item.status}`;
      case 'aerospaceCompanies':
        return `${item.company_type || ''} - ${item.headquarters || ''}`;
      case 'competitors':
        return item.website || item.tier;
      case 'proposals':
        return `${item.status} - $${item.amount?.toLocaleString() || 0}`;
      case 'keywords':
        return `Position: ${item.current_position || '-'}`;
      case 'mentions':
        return `@${item.author} on ${item.platform}`;
      case 'journalists':
        return `${item.publication || ''} - ${item.email || ''}`;
      default:
        return '';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <Input
          ref={inputRef}
          placeholder="Search everything... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 h-9 dark:text-white dark:placeholder:text-gray-400 placeholder:text-xs"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults({});
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {Object.entries(results).map(([type, items]) => {
                if (items.length === 0) {
                  return null;
                }
                const config = entityConfig[type];
                const Icon = config.icon;

                return (
                  <div key={type}>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {type} ({items.length})
                      </span>
                    </div>
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        to={createPageUrl(config.page)}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getDisplayName(type, item)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {getSubtext(type, item)}
                          </p>
                        </div>
                        <Badge className={`${config.color} text-xs`}>{config.label}</Badge>
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
