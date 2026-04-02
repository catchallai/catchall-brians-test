import { useEffect, useMemo, useState } from 'react';
import { format, setMonth, startOfMonth } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
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

  // Limit availableYears to currentYear-10 to currentYear+10
  const availableYears = useMemo(() => {
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  }, [currentYear]);

  const monthDates = useMemo(
    () => MONTHS.map((_, index) => startOfMonth(setMonth(new Date(displayYear, 0, 1), index))),
    [displayYear]
  );
  return (
    <div className={cn('w-[280px] rounded-xl bg-white p-3 select-none', className)}>
      <div className="mb-3">
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
