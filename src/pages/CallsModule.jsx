import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import CallLogModal from '@/components/modals/CallLogModal';

export default function CallsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('recorded');
  const [pageSize, setPageSize] = useState(25);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalType, setCallModalType] = useState('new');
  const [filters, setFilters] = useState({
    transcript: null,
    assignedTo: null,
    date: null,
    duration: null,
    notes: null,
  });

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== null) || searchTerm;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Calls" />

      <div className="flex-1 flex flex-col">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Calls
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  size="sm"
                  onClick={() => {
                    setCallModalType('log');
                    setCallModalOpen(true);
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Log Call
                </Button>
                <Button
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                  size="sm"
                  onClick={() => {
                    setCallModalType('new');
                    setCallModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Call
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 sm:px-6">
            <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-800">
              <TabsTrigger
                value="recorded"
                className="border-b-2 border-transparent data-[state=active]:border-violet-600"
              >
                Recorded calls
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="border-b-2 border-transparent data-[state=active]:border-violet-600"
              >
                All calls
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-2 items-center text-sm">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Transcript avails
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('transcript', 'with')}>
                With transcript
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('transcript', 'without')}>
                Without transcript
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Activity assigned to
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('assignedTo', 'me')}>
                Me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('assignedTo', 'team')}>
                Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Activity date
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('date', 'today')}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('date', 'week')}>
                This week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('date', 'month')}>
                This month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Call duration
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('duration', 'short')}>
                Short (&lt;5 min)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('duration', 'medium')}>
                Medium (5-30 min)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('duration', 'long')}>
                Long (&gt;30 min)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Notes
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('notes', 'with')}>
                With notes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('notes', 'without')}>
                Without notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Advanced filters
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>More options</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  transcript: null,
                  assignedTo: null,
                  date: null,
                  duration: null,
                  notes: null,
                });
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <EmptyState
            icon={Phone}
            title="No matches for the current filters."
            description="Expecting to see a new record? Try again in a few seconds as the system catches up."
          />
        </div>

        {/* Footer with Pagination */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-600 dark:text-gray-400">Prev</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-gray-600 dark:text-gray-400">Next</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {pageSize} per page
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPageSize(10)}>10</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPageSize(25)}>25</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPageSize(50)}>50</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <CallLogModal
        open={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        isLogCall={callModalType === 'log'}
        onSuccess={() => setCallModalOpen(false)}
      />
    </div>
  );
}
