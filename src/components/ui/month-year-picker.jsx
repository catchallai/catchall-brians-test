import { useEffect, useMemo, useState } from 'react';
import { format, setMonth, startOfMonth, subYears, addYears } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Copilot suggestion: Use a neutral year (2000) for MONTHS to avoid magic numbers
const MONTHS = Array.from({ length: 12 }, (_, index) =>
  format(new Date(2000, index, 1), 'MMM').toUpperCase()
);

export function MonthYearPicker({ value, onSelect, className }) {
  const selectedMonth = value ? startOfMonth(value) : startOfMonth(new Date());
  const [displayYear, setDisplayYear] = useState(selectedMonth.getFullYear());
  const currentYear = new Date().getFullYear();
  const selectedMonthKey = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`;

  useEffect(() => {
    setDisplayYear(selectedMonth.getFullYear());
  }, [selectedMonthKey]);

  // Copilot suggestion: Expand availableYears to always include displayYear
  const availableYears = useMemo(() => {
    const startYear = Math.min(currentYear - 10, displayYear);
    const endYear = Math.max(currentYear + 10, displayYear);
    return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  }, [currentYear, displayYear]);

  const monthDates = useMemo(
    () => MONTHS.map((_, index) => startOfMonth(setMonth(new Date(displayYear, 0, 1), index))),
    [displayYear]
  );

  // Copilot suggestion: Clamp shiftYear to availableYears range
  const shiftYear = (direction) => {
    setDisplayYear((year) => {
      const nextYear =
        direction < 0
          ? subYears(new Date(year, 0, 1), 1).getFullYear()
          : addYears(new Date(year, 0, 1), 1).getFullYear();
      const minYear = availableYears[0];
      const maxYear = availableYears[availableYears.length - 1];
      return Math.min(Math.max(nextYear, minYear), maxYear);
    });
  };

  return (
    <div className={cn('w-[280px] rounded-xl bg-white p-3 select-none', className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Previous year"
          onClick={() => shiftYear(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 px-2">
          <Select
            value={String(displayYear)}
            onValueChange={(value) => setDisplayYear(Number(value))}
          >
            <SelectTrigger className="h-9 justify-center text-sm font-semibold">
              <SelectValue placeholder={String(displayYear)} />
            </SelectTrigger>
            <SelectContent position="popper">
              {availableYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Next year"
          onClick={() => shiftYear(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {monthDates.map((monthDate, index) => {
          const isSelected =
            selectedMonth.getFullYear() === monthDate.getFullYear() &&
            selectedMonth.getMonth() === monthDate.getMonth();

          return (
            <Button
              key={monthDate.toISOString()}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'h-10 text-xs tracking-[0.2em]',
                isSelected && 'bg-violet-600 text-white hover:bg-violet-700'
              )}
              onClick={() => onSelect?.(monthDate)}
            >
              {MONTHS[index]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
