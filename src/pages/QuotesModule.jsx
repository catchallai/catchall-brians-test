import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronDown, Calendar, DollarSign, Edit, FileSignature } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import QuoteModal from '@/components/modals/QuoteModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isAfter, addDays } from 'date-fns';
import Pagination from '@/components/ui-custom/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function QuotesModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [signingFilter, setSigningFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Quote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowModal(false);
      setEditingQuote(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowModal(false);
      setEditingQuote(null);
    },
  });

  const handleSave = (data) => {
    if (editingQuote) {
      updateMutation.mutate({ id: editingQuote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isExpiringSoon = (validUntil) => {
    if (!validUntil) {
      return false;
    }
    const expiryDate = new Date(validUntil);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isAfter(sevenDaysFromNow, expiryDate) && isAfter(expiryDate, new Date());
  };

  const getFilteredQuotes = () => {
    return quotes.filter((quote) => {
      const matchesSearch =
        quote.quote_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      const matchesSigning = signingFilter === 'all' || quote.signing_status === signingFilter;

      let matchesTab = true;
      if (activeTab === 'expiring_soon') {
        matchesTab = isExpiringSoon(quote.valid_until);
      } else if (activeTab === 'pending_acceptance') {
        matchesTab = quote.status === 'pending_acceptance';
      } else if (activeTab === 'pending_approval') {
        matchesTab = quote.status === 'pending_approval';
      }

      return matchesSearch && matchesStatus && matchesSigning && matchesTab;
    });
  };

  const filteredQuotes = getFilteredQuotes();
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_acceptance: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.draft;
  };

  const getSigningStatusColor = (status) => {
    const colors = {
      not_sent: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      signed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.not_sent;
  };

  const getTabCount = (tab) => {
    if (tab === 'all') {
      return quotes.length;
    }
    if (tab === 'expiring_soon') {
      return quotes.filter((q) => isExpiringSoon(q.valid_until)).length;
    }
    if (tab === 'pending_acceptance') {
      return quotes.filter((q) => q.status === 'pending_acceptance').length;
    }
    if (tab === 'pending_approval') {
      return quotes.filter((q) => q.status === 'pending_approval').length;
    }
    return 0;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Quotes" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Quotes
              </h1>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
              onClick={() => {
                setEditingQuote(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create quote
            </Button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="bg-transparent border-0 h-auto p-0 gap-6">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3"
              >
                All quotes {getTabCount('all')}
              </TabsTrigger>
              <TabsTrigger
                value="expiring_soon"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3"
              >
                Expiring soon {getTabCount('expiring_soon')}
              </TabsTrigger>
              <TabsTrigger
                value="pending_acceptance"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3"
              >
                Pending acceptance {getTabCount('pending_acceptance')}
              </TabsTrigger>
              <TabsTrigger
                value="pending_approval"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0 pb-3"
              >
                Pending approval {getTabCount('pending_approval')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Quote Status <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('draft')}>Draft</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending_acceptance')}>
                Pending Acceptance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending_approval')}>
                Pending Approval
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('approved')}>
                Approved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Signing Status <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSigningFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSigningFilter('not_sent')}>
                Not Sent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSigningFilter('sent')}>Sent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSigningFilter('signed')}>Signed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading quotes...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-8">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="mx-auto">
                  <circle cx="100" cy="100" r="60" fill="#E0E7FF" />
                  <circle cx="100" cy="100" r="40" fill="#C7D2FE" />
                  <circle cx="100" cy="100" r="20" fill="#6366F1" />
                  <circle cx="100" cy="100" r="8" fill="white" />

                  <path
                    d="M140 60 L120 80 L130 80 L130 120 L150 120 L150 80 L160 80 Z"
                    fill="#10B981"
                    transform="rotate(-15 145 90)"
                  />

                  <line
                    x1="140"
                    y1="60"
                    x2="120"
                    y2="80"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Build, manage, and send winning quotes.
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Quotes are the best way to turn your prospects into customers.
              </p>
              <Button
                onClick={() => {
                  setEditingQuote(null);
                  setShowModal(true);
                }}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Create Your First Quote
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {quote.quote_name}
                          </h3>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status?.replace('_', ' ')}
                          </Badge>
                          <Badge className={getSigningStatusColor(quote.signing_status)}>
                            <FileSignature className="w-3 h-3 mr-1" />
                            {quote.signing_status?.replace('_', ' ')}
                          </Badge>
                          {isExpiringSoon(quote.valid_until) && (
                            <Badge className="bg-orange-100 text-orange-800">
                              ⚠️ Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500 mb-2">
                          <span>Quote #{quote.quote_number}</span>
                          {quote.valid_until && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Valid until {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                        {quote.line_items?.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {quote.line_items.length} item{quote.line_items.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center gap-1 text-gray-500 text-xs justify-end">
                            <DollarSign className="w-3 h-3" />
                            Total
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${quote.total_amount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingQuote(quote);
                            setShowModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredQuotes.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuoteModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingQuote(null);
        }}
        onSave={handleSave}
        quote={editingQuote}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
