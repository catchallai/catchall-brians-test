import React from 'react';
import { Circle, Phone } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

const statusLabels = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};

export default function PresenceIndicator({ presence, size = 'sm' }) {
  if (!presence) return null;

  const sizeClass = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4';
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4';
  const iconSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  const tooltip = presence.in_call ? `${presence.name} - In Call` : `${presence.name} - ${statusLabels[presence.status]}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative inline-block ${sizeClass}`}>
            <Circle
              className={`${dotSize} ${statusColors[presence.status]} fill-current`}
            />
            {presence.in_call && (
              <Phone
                className={`${iconSize} text-white absolute inset-0 m-auto`}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}