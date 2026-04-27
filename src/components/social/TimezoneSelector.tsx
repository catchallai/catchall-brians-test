import { useMemo, useState, type ComponentType, type WheelEvent } from 'react';
import { Check, Globe } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';
import { TIMEZONE_REGIONS } from '@/types/enums';
import { getUtcOffsetLabel, resolveRegionIana } from '@/utils/date';

// shadcn/ui components are exported from .jsx files and lose their prop types
// under checkJs / strict TS. Cast to ComponentType<any> so JSX usage compiles.
const TypedPopoverContent = PopoverContent as ComponentType<any>;
const TypedCommand = Command as ComponentType<any>;
const TypedCommandInput = CommandInput as ComponentType<any>;
const TypedCommandList = CommandList as ComponentType<any>;
const TypedCommandEmpty = CommandEmpty as ComponentType<any>;
const TypedCommandGroup = CommandGroup as ComponentType<any>;
const TypedCommandItem = CommandItem as ComponentType<any>;

const SELECTOR_COPY = COPY.calendarPostModal;

type TimezoneSelectorProps = {
  value: string;
  onChange: (timezone: string) => void;
  /** Date used to compute the UTC offset label (so DST is reflected accurately). */
  referenceDate?: Date;
  disabled?: boolean;
  className?: string;
};

/**
 * Searchable timezone picker rendered as a compact globe-icon button. Clicking
 * opens a Popover + Command list of curated, business-friendly timezone regions
 * (e.g. "Pacific Time (US & Canada)") each backed by a single canonical IANA
 * zone that handles DST correctly.
 */
export default function TimezoneSelector({
  value,
  onChange,
  referenceDate,
  disabled = false,
  className,
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const refDate = referenceDate ?? new Date();
  const refTime = refDate.getTime();

  const options = useMemo(() => {
    return TIMEZONE_REGIONS.map((region) => ({
      ...region,
      offset: getUtcOffsetLabel(region.iana, new Date(refTime)),
    }));
  }, [refTime]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.iana.toLowerCase().includes(q) ||
        o.offset.toLowerCase().includes(q) ||
        o.aliases?.some((a) => a.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedRegionIana = resolveRegionIana(value);
  const selectedOffset = getUtcOffsetLabel(value, refDate);

  const handleOpenChange = (next: boolean) => {
    if (disabled && next) return;
    setOpen(next);
    if (!next) setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={SELECTOR_COPY.timezone}
          title={value || SELECTOR_COPY.timezone}
          className={cn(
            'flex items-center gap-1.5 h-[34px] px-2.5 rounded-lg border text-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900',
            className
          )}
        >
          <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
          <span className="font-medium">{selectedOffset}</span>
        </button>
      </PopoverTrigger>
      <TypedPopoverContent
        className="w-80 p-0"
        align="end"
        onWheel={(e: WheelEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <TypedCommand shouldFilter={false}>
          <TypedCommandInput
            placeholder={SELECTOR_COPY.timezoneSearchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <TypedCommandList>
            {filtered.length === 0 ? (
              <TypedCommandEmpty>{SELECTOR_COPY.timezoneNoResults}</TypedCommandEmpty>
            ) : (
              <TypedCommandGroup>
                {filtered.map((opt) => (
                  <TypedCommandItem
                    key={opt.iana}
                    value={opt.iana}
                    onSelect={() => {
                      onChange(opt.iana);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        opt.iana === selectedRegionIana ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-medium shrink-0 text-xs tabular-nums w-[68px]">
                      {opt.offset}
                    </span>
                    <span className="truncate flex-1 text-sm text-gray-500 dark:text-gray-400">
                      {opt.label}
                    </span>
                  </TypedCommandItem>
                ))}
              </TypedCommandGroup>
            )}
          </TypedCommandList>
        </TypedCommand>
      </TypedPopoverContent>
    </Popover>
  );
}
