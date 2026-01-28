import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';

export default function CallsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All calls');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      {/* Sidebar */}
      <ContactsSidebar activeFilter={selectedFilter} onFilterChange={setSelectedFilter} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Calls</h1>
              <p className="text-sm text-gray-500 mt-1">Recorded calls</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" size="sm">
                <Phone className="w-4 h-4" />
                <span className="hidden xs:inline">Log Call</span>
              </Button>
              <Button className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
                <Plus className="w-4 h-4" />
                New Call
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Recorded calls
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All calls</DropdownMenuItem>
              <DropdownMenuItem>Recorded calls</DropdownMenuItem>
              <DropdownMenuItem>Today</DropdownMenuItem>
              <DropdownMenuItem>This week</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                All calls
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All calls</DropdownMenuItem>
              <DropdownMenuItem>My calls</DropdownMenuItem>
              <DropdownMenuItem>Team calls</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Advanced Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Filter by duration</DropdownMenuItem>
              <DropdownMenuItem>Filter by date</DropdownMenuItem>
              <DropdownMenuItem>Filter by contact</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <EmptyState
            icon={Phone}
            title="No matches for the current filters."
            description="Expecting to see a new record? Try again in a few seconds as the system catches up."
          />
        </div>
      </div>
    </div>
  );
}