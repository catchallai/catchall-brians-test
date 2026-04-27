import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import { Target } from 'lucide-react';

export default function DealsModule() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({
    owner: null,
    createDate: null,
    lastActivityDate: null,
    closeDate: null,
  });

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const totalPages = Math.ceil(deals.length / pageSize);
  const paginatedDeals = deals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDate = (dateString) => {
    if (!dateString) {
      return '-';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Deals" />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Deals
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage your sales pipeline</p>
            </div>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
              <Plus className="w-4 h-4" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-6 py-3">
          <div className="flex flex-wrap gap-3 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  Deal owner
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, owner: null })}>
                  All owners
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  Create date
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, createDate: null })}>
                  Any time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  Last activity date
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setFilters({ ...filters, lastActivityDate: null })}
                >
                  Any time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  Close date
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, closeDate: null })}>
                  Any time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  More
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>More filters...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="link" size="sm" className="text-violet-600 h-8">
              Advanced filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-96 rounded-xl" />
            </div>
          ) : paginatedDeals.length === 0 ? (
            <div className="p-6 sm:p-8">
              <EmptyState
                icon={Target}
                title="No deals yet"
                description="Create your first deal to get started."
                actionLabel="New Deal"
                onAction={() => {}}
              />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hover:text-gray-900 dark:hover:text-white">
                      DEAL NAME
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hover:text-gray-900 dark:hover:text-white">
                      DEAL STAGE
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hover:text-gray-900 dark:hover:text-white">
                      CLOSE DATE (MST)
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hover:text-gray-900 dark:hover:text-white">
                      DEAL OWNER
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hover:text-gray-900 dark:hover:text-white">
                      AMOUNT
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-slate-900">
                {paginatedDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <a
                        href="#"
                        className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                      >
                        {deal.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {deal.stage || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(deal.expected_close_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {deal.owner_name || 'No owner'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(deal.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!isLoading && paginatedDeals.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">{currentPage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    {pageSize} per page
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setPageSize(10);
                      setCurrentPage(1);
                    }}
                  >
                    10 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPageSize(25);
                      setCurrentPage(1);
                    }}
                  >
                    25 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPageSize(50);
                      setCurrentPage(1);
                    }}
                  >
                    50 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPageSize(100);
                      setCurrentPage(1);
                    }}
                  >
                    100 per page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
