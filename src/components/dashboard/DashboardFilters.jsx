import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Filter, X, Download } from 'lucide-react';

export default function DashboardFilters({ filters, onFiltersChange, onExport, onClear }) {
  const handleDateChange = (type, date) => {
    onFiltersChange({
      ...filters,
      [type]: date?.toISOString(),
    });
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClear} className="gap-1">
              <X className="w-3 h-3" />
              Clear
            </Button>
            <Button size="sm" onClick={onExport} className="gap-1">
              <Download className="w-3 h-3" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Date Range</Label>
            <Select
              value={filters.dateRange || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.dateRange === 'custom' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-9 font-normal"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.startDate
                        ? new Date(filters.startDate).toLocaleDateString()
                        : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate ? new Date(filters.startDate) : undefined}
                      onSelect={(date) => handleDateChange('startDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-9 font-normal"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.endDate
                        ? new Date(filters.endDate).toLocaleDateString()
                        : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate ? new Date(filters.endDate) : undefined}
                      onSelect={(date) => handleDateChange('endDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
