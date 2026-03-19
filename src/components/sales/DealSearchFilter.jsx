import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export default function DealSearchFilter({ deals = [], onFilter }) {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch = !search || deal.title.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stage === 'all' || deal.stage === stage;
      const min = minValue ? parseInt(minValue) : 0;
      const max = maxValue ? parseInt(maxValue) : Infinity;
      const matchesValue = (deal.value || 0) >= min && (deal.value || 0) <= max;
      return matchesSearch && matchesStage && matchesValue;
    });
  }, [deals, search, stage, minValue, maxValue]);

  React.useEffect(() => {
    onFilter?.(filtered);
  }, [filtered, onFilter]);

  const clearFilters = () => {
    setSearch('');
    setStage('all');
    setMinValue('');
    setMaxValue('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {(search || stage !== 'all' || minValue || maxValue) && (
          <Button size="sm" variant="outline" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="closed_won">Won</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Min value ($)"
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
          className="text-sm"
        />

        <Input
          type="number"
          placeholder="Max value ($)"
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
          className="text-sm"
        />

        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
          {filtered.length} deals
        </div>
      </div>
    </div>
  );
}
