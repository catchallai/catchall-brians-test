/**
 * Reusable badge showing a data source with its sync status.
 */
export default function DataSourceBadge({ label, color, count, icon: Icon }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${color}`}>
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
      {count != null && (
        <span className="bg-white/60 rounded-full px-1.5 py-0.5 font-bold">{count}</span>
      )}
    </div>
  );
}