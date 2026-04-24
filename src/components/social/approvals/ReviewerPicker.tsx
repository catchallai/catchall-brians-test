import type { ComponentType, WheelEvent } from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import COPY from '@/lib/copy';

// shadcn/ui components are exported from .jsx files and lose their prop types
// under checkJs / strict TS. Cast to ComponentType<any> so JSX usage compiles.
const TypedPopoverContent = PopoverContent as ComponentType<any>;
const TypedCommand = Command as ComponentType<any>;
const TypedCommandInput = CommandInput as ComponentType<any>;
const TypedCommandList = CommandList as ComponentType<any>;
const TypedCommandEmpty = CommandEmpty as ComponentType<any>;
const TypedCommandGroup = CommandGroup as ComponentType<any>;
const TypedCommandItem = CommandItem as ComponentType<any>;
const TypedBadge = Badge as ComponentType<any>;

const PICKER_COPY = COPY.reviewerPicker;

/** A team member available for selection in the reviewer picker. */
export interface ReviewerOption {
  email: string;
  name: string;
  role: string;
}

interface ReviewerPickerProps {
  /** Currently selected reviewers. */
  value: ReviewerOption[];
  /** Called with the updated selection whenever a reviewer is added or removed. */
  onChange: (reviewers: ReviewerOption[]) => void;
  /** Full list of eligible team members to choose from. */
  teamMembers: ReviewerOption[];
  /** Prevents interaction when true. */
  disabled?: boolean;
  /** Applies error styling to the trigger (e.g. when validation fails). */
  error?: boolean;
}

/**
 * Multi-select autocomplete for assigning reviewers to a post.
 *
 * Uses the Popover + Command (cmdk) pattern established by TagSelector.
 * Selected reviewers render as avatar pills in the trigger; the dropdown
 * supports search by name or email and toggles selection on click.
 */
export function ReviewerPicker({
  value,
  onChange,
  teamMembers,
  disabled = false,
  error = false,
}: ReviewerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEmails = useMemo(() => new Set(value.map((r) => r.email)), [value]);

  const filtered = teamMembers.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleOpenChange = (next: boolean) => {
    if (disabled && next) return;
    setOpen(next);
    if (!next) setSearch('');
  };

  const handleSelect = useCallback(
    (member: ReviewerOption) => {
      if (selectedEmails.has(member.email)) {
        onChange(value.filter((r) => r.email !== member.email));
      } else {
        onChange([...value, member]);
      }
    },
    [value, onChange, selectedEmails]
  );

  const handleRemove = useCallback(
    (email: string) => onChange(value.filter((r) => r.email !== email)),
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !search && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={PICKER_COPY.placeholder}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm cursor-pointer select-none',
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-red-400 focus:ring-red-400',
            open && 'outline-none ring-1 ring-ring'
          )}
        >
          {value.map((reviewer) => (
            <span
              key={reviewer.email}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 pl-1 pr-1.5 py-0.5 text-xs font-medium text-violet-700"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-200 text-[10px] font-semibold text-violet-700">
                {reviewer.name?.[0]?.toUpperCase() || reviewer.email[0].toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate">{reviewer.name || reviewer.email}</span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={PICKER_COPY.removeLabel(reviewer.name || reviewer.email)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(reviewer.email);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-violet-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
          {value.length === 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              {PICKER_COPY.placeholder}
            </span>
          )}
        </div>
      </PopoverTrigger>

      <TypedPopoverContent
        className="w-72 p-0"
        align="start"
        onWheel={(e: WheelEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <TypedCommand shouldFilter={false}>
          <TypedCommandInput
            placeholder={PICKER_COPY.searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />
          <TypedCommandList>
            {filtered.length === 0 ? (
              <TypedCommandEmpty>{PICKER_COPY.noResults}</TypedCommandEmpty>
            ) : (
              <TypedCommandGroup>
                {filtered.map((member) => (
                  <TypedCommandItem
                    key={member.email}
                    value={member.email}
                    onSelect={() => handleSelect(member)}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        selectedEmails.has(member.email) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-600 shrink-0">
                      {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                    </span>
                    <span className="truncate flex-1">{member.name || member.email}</span>
                    <TypedBadge variant="outline" className="text-xs ml-1 shrink-0">
                      {member.role}
                    </TypedBadge>
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
