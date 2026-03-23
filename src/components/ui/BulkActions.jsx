import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Download, X, CheckSquare } from 'lucide-react';

export default function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  isAllSelected,
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card rounded-2xl shadow-xl px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={(checked) => (checked ? onSelectAll() : onDeselectAll())}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} of {totalCount} selected
        </span>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-2">
        {!isAllSelected && (
          <Button variant="ghost" size="sm" onClick={onSelectAll} className="gap-1">
            <CheckSquare className="w-4 h-4" />
            Select All
          </Button>
        )}

        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}

        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDeselectAll}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
