import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, ChevronDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';

export default function CompaniesModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({
    industry: null,
    size: null,
    owner: null,
    tier: null,
    country: null,
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null) || searchTerm;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Companies" />

      <div className="flex-1 flex flex-col">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Companies</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" size="sm">
                  <Download className="w-4 h-4" />
                  Import
                </Button>
                <Button className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
                  <Plus className="w-4 h-4" />
                  New Company
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 sm:px-6">
            <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-800">
              <TabsTrigger value="all" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                All companies
              </TabsTrigger>
              <TabsTrigger value="tier1" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                Tier 1
              </TabsTrigger>
              <TabsTrigger value="tier2" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                Tier 2
              </TabsTrigger>
              <TabsTrigger value="tier3" className="border-b-2 border-transparent data-[state=active]:border-violet-600">
                Tier 3
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
                Industry
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'technology')}>Technology</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'aviation')}>Aviation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'finance')}>Finance</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('industry', 'healthcare')}>Healthcare</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Company size
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '1-10')}>1-10 employees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '11-50')}>11-50 employees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '51-200')}>51-200 employees</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('size', '201+')}>201+ employees</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Company owner
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('owner', 'me')}>Me</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('owner', 'team')}>Team</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Tier
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'tier1')}>Tier 1</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'tier2')}>Tier 2</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('tier', 'tier3')}>Tier 3</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Country
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'us')}>United States</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'uk')}>United Kingdom</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'ca')}>Canada</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('country', 'other')}>Other</DropdownMenuItem>
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
                setFilters({ industry: null, size: null, owner: null, tier: null, country: null });
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <EmptyState
            icon={Building2}
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
    </div>
  );
}