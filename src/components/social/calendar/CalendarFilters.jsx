import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";

const PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'TikTok'];
const STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'pending_review', label: 'Pending Review' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
];

export default function CalendarFilters({ filters, onFiltersChange }) {
  const { data: briefs = [] } = useQuery({
    queryKey: ['campaign-briefs-for-filter'],
    queryFn: () => base44.entities.CampaignBrief.list('-created_date', 50),
    staleTime: 5 * 60 * 1000,
  });

  const togglePlatform = (p) => {
    onFiltersChange({
      ...filters,
      platforms: filters.platforms.includes(p)
        ? filters.platforms.filter(x => x !== p)
        : [...filters.platforms, p],
    });
  };

  const toggleBrief = (id) => {
    onFiltersChange({
      ...filters,
      briefs: filters.briefs.includes(id)
        ? filters.briefs.filter(x => x !== id)
        : [...filters.briefs, id],
    });
  };

  const toggleStatus = (id) => {
    onFiltersChange({
      ...filters,
      statuses: filters.statuses.includes(id)
        ? filters.statuses.filter(x => x !== id)
        : [...filters.statuses, id],
    });
  };

  const hasFilters = filters.platforms.length > 0 || filters.briefs.length > 0 || filters.statuses.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Platforms */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Platforms
            {filters.platforms.length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white text-xs">{filters.platforms.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PLATFORMS.map(p => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.platforms.includes(p)}
              onCheckedChange={() => togglePlatform(p)}
            >
              {p}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Campaign Briefs */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Campaigns
            {filters.briefs.length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white text-xs">{filters.briefs.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by Campaign Brief</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {briefs.length === 0 && (
            <div className="px-2 py-2 text-xs text-gray-500">No campaigns available</div>
          )}
          {briefs.map(b => (
            <DropdownMenuCheckboxItem
              key={b.id}
              checked={filters.briefs.includes(b.id)}
              onCheckedChange={() => toggleBrief(b.id)}
              className="line-clamp-1"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">{b.title}</span>
                <span className="text-xs text-gray-400">{b.month}</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Status
            {filters.statuses.length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white text-xs">{filters.statuses.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUSES.map(s => (
            <DropdownMenuCheckboxItem
              key={s.id}
              checked={filters.statuses.includes(s.id)}
              onCheckedChange={() => toggleStatus(s.id)}
            >
              {s.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasFilters && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onFiltersChange({ platforms: [], briefs: [], statuses: [] })}
          className="text-gray-500 hover:text-gray-700 gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}