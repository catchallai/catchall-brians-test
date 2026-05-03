import { useState } from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const classificationConfig = {
  internal: {
    label: 'Internal',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    icon: 'text-blue-500',
  },
  classified: {
    label: 'Classified',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
    icon: 'text-red-500',
  },
  external: {
    label: 'External',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    icon: 'text-amber-500',
  },
  public: {
    label: 'Public',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    icon: 'text-green-500',
  },
};

export default function ClassificationBadge({ classification = 'internal', onChange, editable = true }) {
  const config = classificationConfig[classification] || classificationConfig.internal;

  if (!editable) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Shield className={`w-3.5 h-3.5 ${config.icon}`} />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <Select value={classification} onValueChange={onChange}>
      <SelectTrigger className={`h-auto w-auto px-2.5 py-1 text-xs font-medium rounded-full border inline-flex gap-1.5 ${config.color} hover:opacity-80 transition-opacity`}>
        <Shield className={`w-3.5 h-3.5 ${config.icon}`} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="internal">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Internal</span>
          </div>
        </SelectItem>
        <SelectItem value="classified">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            <span>Classified</span>
          </div>
        </SelectItem>
        <SelectItem value="external">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>External</span>
          </div>
        </SelectItem>
        <SelectItem value="public">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>Public</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}