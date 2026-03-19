import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const alertIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const alertColors = {
  critical: 'bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500',
};

const textColors = {
  critical: 'text-rose-800 dark:text-rose-200',
  warning: 'text-amber-800 dark:text-amber-200',
  info: 'text-blue-800 dark:text-blue-200',
  success: 'text-emerald-800 dark:text-emerald-200',
};

const iconColors = {
  critical: 'text-rose-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
  success: 'text-emerald-600',
};

export default function AlertWidget({ alerts = [] }) {
  const AlertIcon = alertIcons[alerts[0]?.type] || Info;

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert, idx) => {
        const Icon = alertIcons[alert.type] || Info;
        return (
          <div
            key={idx}
            className={`p-3 rounded-lg ${alertColors[alert.type]} ${textColors[alert.type]}`}
          >
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[alert.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-semibold">{alert.title}</p>
                {alert.message && <p className="text-xs mt-1 opacity-90">{alert.message}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
