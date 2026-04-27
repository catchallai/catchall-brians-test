import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Copy, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { todayLocal } from '@/utils/date';

const PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'YouTube'];

export default function DraftFromAssetsModal({ open, onOpenChange, onSuccess, campaignBriefId }) {
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Instagram']);
  const [scheduledDate, setScheduledDate] = useState(todayLocal());
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [scheduleError, setScheduleError] = useState('');
  const qc = useQueryClient();

  const { data: approvedCopy = [] } = useQuery({
    queryKey: ['approved-copy-pool'],
    queryFn: () => base44.entities.ApprovedCopy.filter({ status: 'approved' }),
    enabled: open,
  });

  const { data: approvedTemplates = [] } = useQuery({
    queryKey: ['approved-templates-pool'],
    queryFn: () => base44.entities.ApprovedGraphicTemplate.filter({ status: 'approved' }),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Compute an absolute ISO timestamp in the user's local timezone so the server
      // can validate future-date without needing to guess the user's UTC offset.
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime || '10:00'}:00`).toISOString();
      const res = await base44.functions.invoke('createDraftFromApproved', {
        copyId: selectedCopy?.id,
        templateId: selectedTemplate?.id,
        scheduledDate,
        scheduledTime,
        scheduledAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platforms: selectedPlatforms,
        campaignBriefId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['calendar-posts'] });
      onSuccess?.(data);
      onOpenChange(false);
      reset();
    },
  });

  const togglePlatform = (p) => {
    setSelectedPlatforms((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));
  };

  const reset = () => {
    setSelectedCopy(null);
    setSelectedTemplate(null);
    setSelectedPlatforms(['Instagram']);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-violet-600" />
            Create Draft from Approved Assets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Copy Selection */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Approved Copy
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-100 dark:border-slate-700 rounded-lg p-2">
              {approvedCopy.length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">No approved copy available</p>
              )}
              {approvedCopy.map((copy) => (
                <button
                  key={copy.id}
                  onClick={() => setSelectedCopy(copy)}
                  className={`text-left p-2 rounded-lg border transition-all ${
                    selectedCopy?.id === copy.id
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {copy.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {copy.copy_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Checkbox
                      checked={selectedCopy?.id === copy.id}
                      className="pointer-events-none"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Approved Template
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-100 dark:border-slate-700 rounded-lg p-2">
              {approvedTemplates.length === 0 && (
                <p className="text-xs text-gray-400 col-span-2 py-4 text-center">
                  No approved templates available
                </p>
              )}
              {approvedTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`text-left rounded-lg border overflow-hidden transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? 'border-violet-400 ring-1 ring-violet-300'
                      : 'border-gray-100 dark:border-slate-700 hover:border-gray-200'
                  }`}
                >
                  {tpl.preview_url ? (
                    <img
                      src={tpl.preview_url}
                      alt={tpl.title}
                      className="w-full h-20 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <div className="p-1.5 bg-white dark:bg-slate-800">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                      {tpl.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Date/Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Scheduled Date
              </p>
              <Input
                type="date"
                value={scheduledDate}
                min={todayLocal()}
                onChange={(e) => {
                  setScheduleError('');
                  setScheduledDate(e.target.value);
                }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Scheduled Time
              </p>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                    selectedPlatforms.includes(p)
                      ? 'border-violet-400 bg-violet-600 text-white'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(p)}
                    className="pointer-events-none"
                  />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule error */}
          {scheduleError && (
            <div className="flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{scheduleError}</p>
            </div>
          )}

          {/* Error */}
          {createMutation.error && (
            <div className="flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">
                {createMutation.error?.message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
              if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
                setScheduleError('Scheduled time must be in the future.');
                return;
              }
              setScheduleError('');
              createMutation.mutate();
            }}
            disabled={!selectedCopy || !selectedTemplate || createMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Draft Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
