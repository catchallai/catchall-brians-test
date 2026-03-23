export default function EnhancedTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-3 min-w-[160px]">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatter ? formatter(entry.value, entry.name) : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
