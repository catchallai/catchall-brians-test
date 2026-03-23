import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function HelpTooltip({ content, side = 'top' }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <HelpCircle className="w-3 h-3 text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
