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

const TypedPopoverContent = PopoverContent as ComponentType<any>;
const TypedCommand = Command as ComponentType<any>;
const TypedCommandInput = CommandInput as ComponentType<any>;
const TypedCommandList = CommandList as ComponentType<any>;
const TypedCommandEmpty = CommandEmpty as ComponentType<any>;
const TypedCommandGroup = CommandGroup as ComponentType<any>;
const TypedCommandItem = CommandItem as ComponentType<any>;

const SELECTOR_COPY = COPY.calendarPostModal;

/**
 * Curated list of business-friendly timezone regions, mapped to a canonical IANA
 * zone that handles DST correctly. Order roughly west-to-east. Aliases let the
 * popover surface a region as "selected" even when the stored IANA value is a
 * synonym (e.g. America/Vancouver still maps to Pacific Time).
 */
const TIMEZONE_REGIONS: { iana: string; label: string; aliases?: string[] }[] = [
  { iana: 'Pacific/Midway', label: 'Samoa Time' },
  { iana: 'Pacific/Honolulu', label: 'Hawaii Time' },
  {
    iana: 'America/Anchorage',
    label: 'Alaska Time (US & Canada)',
    aliases: ['America/Juneau', 'America/Nome', 'America/Sitka', 'America/Yakutat'],
  },
  {
    iana: 'America/Los_Angeles',
    label: 'Pacific Time (US & Canada)',
    aliases: ['America/Vancouver', 'America/Tijuana', 'US/Pacific'],
  },
  { iana: 'America/Phoenix', label: 'Arizona Time (US)' },
  {
    iana: 'America/Denver',
    label: 'Mountain Time (US & Canada)',
    aliases: ['America/Edmonton', 'America/Boise', 'US/Mountain'],
  },
  {
    iana: 'America/Chicago',
    label: 'Central Time (US & Canada)',
    aliases: ['America/Winnipeg', 'America/Mexico_City', 'US/Central'],
  },
  { iana: 'America/Bogota', label: 'Colombia Time', aliases: ['America/Lima'] },
  {
    iana: 'America/New_York',
    label: 'Eastern Time (US & Canada)',
    aliases: ['America/Toronto', 'America/Detroit', 'US/Eastern'],
  },
  { iana: 'America/Caracas', label: 'Venezuela Time' },
  {
    iana: 'America/Halifax',
    label: 'Atlantic Time (Canada)',
    aliases: ['America/Glace_Bay', 'America/Goose_Bay'],
  },
  {
    iana: 'America/Sao_Paulo',
    label: 'Brasilia Time',
    aliases: ['America/Argentina/Buenos_Aires', 'America/Montevideo', 'America/Santiago'],
  },
  { iana: 'America/St_Johns', label: 'Newfoundland Time (Canada)' },
  { iana: 'Atlantic/South_Georgia', label: 'South Georgia Time' },
  { iana: 'Atlantic/Azores', label: 'Azores Time' },
  {
    iana: 'Europe/London',
    label: 'Greenwich Mean Time (UK & Ireland)',
    aliases: ['Europe/Dublin', 'Europe/Lisbon', 'GB'],
  },
  {
    iana: 'Europe/Paris',
    label: 'Central European Time',
    aliases: [
      'Europe/Berlin',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Vienna',
      'Europe/Stockholm',
      'Europe/Warsaw',
      'Europe/Zurich',
    ],
  },
  {
    iana: 'Europe/Helsinki',
    label: 'Eastern European Time',
    aliases: ['Europe/Athens', 'Europe/Bucharest', 'Africa/Cairo', 'Asia/Jerusalem'],
  },
  {
    iana: 'Europe/Moscow',
    label: 'Moscow Time',
    aliases: ['Europe/Istanbul', 'Africa/Nairobi'],
  },
  {
    iana: 'Africa/Lagos',
    label: 'West Africa Time',
    aliases: ['Africa/Algiers', 'Africa/Tunis'],
  },
  { iana: 'Africa/Johannesburg', label: 'South Africa Time' },
  { iana: 'Asia/Tehran', label: 'Iran Time' },
  {
    iana: 'Asia/Dubai',
    label: 'Gulf Time (UAE)',
    aliases: ['Asia/Muscat', 'Asia/Baku', 'Asia/Tbilisi', 'Asia/Yerevan'],
  },
  { iana: 'Asia/Kabul', label: 'Afghanistan Time' },
  {
    iana: 'Asia/Karachi',
    label: 'Pakistan Time',
    aliases: ['Asia/Tashkent', 'Asia/Yekaterinburg'],
  },
  { iana: 'Asia/Kolkata', label: 'India Standard Time', aliases: ['Asia/Colombo'] },
  { iana: 'Asia/Kathmandu', label: 'Nepal Time' },
  { iana: 'Asia/Dhaka', label: 'Bangladesh Time', aliases: ['Asia/Almaty'] },
  { iana: 'Asia/Yangon', label: 'Myanmar Time' },
  {
    iana: 'Asia/Bangkok',
    label: 'Indochina Time',
    aliases: ['Asia/Ho_Chi_Minh', 'Asia/Jakarta'],
  },
  {
    iana: 'Asia/Singapore',
    label: 'Singapore Time',
    aliases: ['Asia/Hong_Kong', 'Asia/Manila', 'Asia/Kuala_Lumpur', 'Asia/Taipei'],
  },
  {
    iana: 'Asia/Shanghai',
    label: 'China Standard Time',
    aliases: ['Asia/Macau', 'Asia/Urumqi'],
  },
  { iana: 'Australia/Perth', label: 'Australian Western Time' },
  {
    iana: 'Asia/Tokyo',
    label: 'Japan Standard Time',
    aliases: ['Asia/Seoul'],
  },
  { iana: 'Australia/Adelaide', label: 'Australian Central Time' },
  {
    iana: 'Australia/Sydney',
    label: 'Australian Eastern Time',
    aliases: ['Australia/Melbourne', 'Australia/Brisbane', 'Australia/Hobart'],
  },
  { iana: 'Pacific/Auckland', label: 'New Zealand Time', aliases: ['Pacific/Fiji'] },
  { iana: 'UTC', label: 'Coordinated Universal Time', aliases: ['Etc/UTC', 'GMT'] },
];

/**
 * Returns "UTC", "UTC-5", or "UTC+5:30" for the zone at the given reference date.
 * The reference date matters: zones with DST shift offset across the year, so the
 * label should reflect what the user will actually publish at.
 */
export function getUtcOffsetLabel(timeZone: string, referenceDate: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const offset =
      formatter.formatToParts(referenceDate).find((p) => p.type === 'timeZoneName')?.value ?? '';
    if (!offset || offset === 'GMT' || offset === 'GMT+00:00') return 'UTC';
    const match = offset.match(/^GMT([+-])(\d{1,2}):(\d{2})$/);
    if (!match) return offset.replace('GMT', 'UTC');
    const [, sign, hh, mm] = match;
    const hours = parseInt(hh, 10);
    return mm === '00' ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${mm}`;
  } catch {
    return 'UTC';
  }
}

/** Resolves an IANA value to its curated region's canonical IANA, or null. */
function resolveRegionIana(value: string): string | null {
  if (!value) return null;
  const direct = TIMEZONE_REGIONS.find((r) => r.iana === value);
  if (direct) return direct.iana;
  const aliased = TIMEZONE_REGIONS.find((r) => r.aliases?.includes(value));
  return aliased ? aliased.iana : null;
}

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  /** Date used to compute the UTC offset label (so DST is reflected accurately). */
  referenceDate?: Date;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable timezone picker rendered as a compact globe-icon button. Clicking
 * opens a Popover + Command list of curated, business-friendly timezone regions
 * (e.g. "Pacific Time (US & Canada)") each backed by a single canonical IANA
 * zone that handles DST correctly.
 */
export function TimezoneSelector({
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

export default TimezoneSelector;
