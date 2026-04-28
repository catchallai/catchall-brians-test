import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const STAGES = [
  'new_lead',
  'email_list',
  'media_inquiry',
  'reservation_request',
  'contacted',
  'no_response',
  'closed',
  'not_interested',
];

export default function BulkActionsPanel({ opportunities, onDelete, onUpdateStage, isLoading }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStage, setBulkStage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const selectedCount = selectedIds.size;
  const totalValue = opportunities
    .filter((opp) => selectedIds.has(opp.id))
    .reduce((sum, opp) => sum + (opp.value || 0), 0);

  const toggleSelectAll = () => {
    if (selectedIds.size === opportunities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(opportunities.map((opp) => opp.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStageChange = async () => {
    if (bulkStage && selectedIds.size > 0) {
      for (const id of selectedIds) {
        await onUpdateStage(id, bulkStage);
      }
      setSelectedIds(new Set());
      setBulkStage('');
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await onDelete(id);
    }
    setSelectedIds(new Set());
    setDeleteConfirm(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      {selectedCount > 0 && (
        <Card className="glass-card rounded-2xl border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedCount} selected • $
                  {totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} total value
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={bulkStage} onValueChange={setBulkStage}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkStageChange}
                  disabled={!bulkStage}
                  className="gap-2"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirm(true)}
                  className="gap-2"
                  size="sm"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setSelectedIds(new Set())} size="sm">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="glass-card rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCount === opportunities.length && opportunities.length > 0}
                    indeterminate={selectedCount > 0 && selectedCount < opportunities.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Opportunity</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No opportunities to display
                  </TableCell>
                </TableRow>
              ) : (
                opportunities.map((opp) => (
                  <TableRow
                    key={opp.id}
                    className={selectedIds.has(opp.id) ? 'bg-violet-50 dark:bg-violet-900/20' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(opp.id)}
                        onChange={() => toggleSelect(opp.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{opp.title}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {opp.contact_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {opp.stage?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${(opp.value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Opportunities"
        description={`Are you sure you want to delete ${selectedCount} opportunity(ies)? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isLoading}
      />
    </div>
  );
}
