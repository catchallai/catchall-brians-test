import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Settings2, LayoutGrid } from 'lucide-react';

const sections = [
  { key: 'realTime', label: 'Real-Time Visitors' },
  { key: 'visitorType', label: 'New vs Returning' },
  { key: 'topPages', label: 'Top Pages' },
  { key: 'userFlow', label: 'User Flow' },
  { key: 'engagement', label: 'Engagement Metrics' },
  { key: 'referrals', label: 'Top Referrers' },
  { key: 'browserOS', label: 'Browser & OS' },
  { key: 'peakHours', label: 'Peak Hours' },
];

export default function AnalyticsTogglePanel({ visibility, onToggle }) {
  const enabledCount = Object.values(visibility).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid className="w-4 h-4" />
          Widgets
          <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-xs px-1.5 py-0.5 rounded-full">
            {enabledCount}/{sections.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Settings2 className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-900 dark:text-white">Toggle Widgets</span>
        </div>
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{section.label}</span>
              <Switch
                checked={visibility[section.key]}
                onCheckedChange={() => onToggle(section.key)}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => sections.forEach((s) => !visibility[s.key] && onToggle(s.key))}
          >
            Show All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => sections.forEach((s) => visibility[s.key] && onToggle(s.key))}
          >
            Hide All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
