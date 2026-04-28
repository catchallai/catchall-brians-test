import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  X,
  Target,
  Megaphone,
  Globe,
  Mail,
  Smartphone,
  Radio,
  LayoutGrid,
  Loader2,
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved ✓', color: 'bg-green-100 text-green-700' },
  active: { label: 'Active', color: 'bg-violet-100 text-violet-700' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-500' },
};

const CHANNEL_ICONS = {
  Ads: Megaphone,
  Social: Radio,
  Newsletter: Mail,
  EDM: Mail,
  Website: Globe,
  SMS: Smartphone,
  Other: LayoutGrid,
};

const CHANNELS = ['Social', 'Ads', 'Newsletter', 'EDM', 'Website', 'SMS', 'Other'];

const BLANK_BRIEF = {
  title: '',
  month: '',
  objective: '',
  focal_point: '',
  aesthetic_direction: '',
  target_audience: '',
  key_messages: [''],
  drivers: CHANNELS.map((ch) => ({ channel: ch, focus: '', notes: '' })),
  notes: '',
};

export default function CampaignBriefTab({ currentUser }) {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_BRIEF);
  const qc = useQueryClient();
  const QUERY_KEY = ['campaign-briefs'];

  const { data: briefs = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => base44.entities.CampaignBrief.list('-created_date', 100),
  });

  const { data: approvedCopy = [] } = useQuery({
    queryKey: ['approved-copy'],
    queryFn: () => base44.entities.ApprovedCopy.filter({ status: 'approved' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: approvedTemplates = [] } = useQuery({
    queryKey: ['approved-graphic-templates'],
    queryFn: () => base44.entities.ApprovedGraphicTemplate.filter({ status: 'approved' }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignBrief.create(data),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      setShowForm(false);
      setForm(BLANK_BRIEF);
      setSelected(item);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CampaignBrief.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const toggleCopyOnBrief = (brief, copyId) => {
    const current = brief.approved_copy_ids || [];
    const updated = current.includes(copyId)
      ? current.filter((i) => i !== copyId)
      : [...current, copyId];
    updateMutation.mutate({ id: brief.id, data: { approved_copy_ids: updated } });
    setSelected((s) => (s ? { ...s, approved_copy_ids: updated } : s));
  };

  const toggleTemplateOnBrief = (brief, tplId) => {
    const current = brief.approved_template_ids || [];
    const updated = current.includes(tplId)
      ? current.filter((i) => i !== tplId)
      : [...current, tplId];
    updateMutation.mutate({ id: brief.id, data: { approved_template_ids: updated } });
    setSelected((s) => (s ? { ...s, approved_template_ids: updated } : s));
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left: Brief List */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Campaign Briefs</p>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-gray-700 dark:text-white">New Brief</p>
              <button onClick={() => setShowForm(false)}>
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title e.g. March Multi-Channel"
              className="text-sm h-8"
            />
            <Input
              value={form.month}
              onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
              placeholder="Period e.g. 2026-03"
              className="text-sm h-8"
            />
            <Input
              value={form.focal_point}
              onChange={(e) => setForm((f) => ({ ...f, focal_point: e.target.value }))}
              placeholder="Focal point / theme"
              className="text-sm h-8"
            />
            <Textarea
              value={form.objective}
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
              placeholder="Campaign objective..."
              className="text-sm min-h-[60px] resize-none"
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  createMutation.mutate({
                    ...form,
                    status: 'draft',
                    owner_email: currentUser?.email,
                    owner_name: currentUser?.full_name,
                    workflow_history: [],
                  })
                }
                disabled={!form.title || createMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {isLoading && <div className="text-xs text-gray-400 text-center py-4">Loading...</div>}
          {briefs.map((brief) => {
            const cfg = STATUS_CONFIG[brief.status] || STATUS_CONFIG.draft;
            const isSelected = selected?.id === brief.id;
            return (
              <button
                key={brief.id}
                onClick={() => setSelected(isSelected ? null : brief)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {brief.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{brief.month}</p>
                    {brief.focal_point && (
                      <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 truncate">
                        {brief.focal_point}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <span>{brief.approved_copy_ids?.length || 0} copy</span>
                      <span>·</span>
                      <span>{brief.approved_template_ids?.length || 0} tpl</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {!isLoading && briefs.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-8">
              No briefs yet. Create your first.
            </div>
          )}
        </div>
      </div>

      {/* Right: Brief Detail */}
      {selected ? (
        <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selected.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {selected.month} · {selected.focal_point}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${(STATUS_CONFIG[selected.status] || STATUS_CONFIG.draft).color}`}
                >
                  {(STATUS_CONFIG[selected.status] || STATUS_CONFIG.draft).label}
                </Badge>
                <Select
                  value={selected.status}
                  onValueChange={(v) => {
                    updateMutation.mutate({ id: selected.id, data: { status: v } });
                    setSelected((s) => ({ ...s, status: v }));
                  }}
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selected.objective && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Objective
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.objective}</p>
              </div>
            )}

            {/* Channel Drivers */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Channel Drivers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  selected.drivers || CHANNELS.map((c) => ({ channel: c, focus: '', notes: '' }))
                ).map((driver) => {
                  const Icon = CHANNEL_ICONS[driver.channel] || LayoutGrid;
                  return (
                    <div
                      key={driver.channel}
                      className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="w-3.5 h-3.5 text-violet-500" />
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                          {driver.channel}
                        </p>
                      </div>
                      {driver.focus ? (
                        <p className="text-xs text-gray-600 dark:text-gray-300">{driver.focus}</p>
                      ) : (
                        <p className="text-xs text-gray-300 italic">No focus set</p>
                      )}
                      {driver.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{driver.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Approved Copy Pool */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <p className="text-sm font-bold text-gray-800 dark:text-white mb-3">
              Approved Copy Pool
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({(selected.approved_copy_ids || []).length} linked)
              </span>
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {approvedCopy.length === 0 && (
                <p className="text-xs text-gray-400">
                  No approved copy yet. Approve copy in the Copy Pool tab first.
                </p>
              )}
              {approvedCopy.map((copy) => {
                const linked = (selected.approved_copy_ids || []).includes(copy.id);
                return (
                  <div
                    key={copy.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${linked ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                        {copy.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {copy.copy_type?.replace(/_/g, ' ')} · {(copy.channels || []).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleCopyOnBrief(selected, copy.id)}
                      className={`ml-2 text-xs px-2 py-1 rounded-md border font-medium transition-colors ${linked ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' : 'border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600'}`}
                    >
                      {linked ? '✓ Linked' : '+ Link'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approved Template Pool */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <p className="text-sm font-bold text-gray-800 dark:text-white mb-3">
              Approved Graphic Templates
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({(selected.approved_template_ids || []).length} linked)
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {approvedTemplates.length === 0 && (
                <p className="col-span-3 text-xs text-gray-400">No approved templates yet.</p>
              )}
              {approvedTemplates.map((tpl) => {
                const linked = (selected.approved_template_ids || []).includes(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    onClick={() => toggleTemplateOnBrief(selected, tpl.id)}
                    className={`text-left rounded-lg border overflow-hidden transition-all ${linked ? 'border-green-400 ring-1 ring-green-300' : 'border-gray-100 dark:border-slate-700 hover:border-violet-300'}`}
                  >
                    {tpl.preview_url ? (
                      <img
                        src={tpl.preview_url}
                        alt={tpl.title}
                        className="w-full h-16 object-cover"
                      />
                    ) : (
                      <div className="w-full h-16 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-gray-300 text-xs">No preview</span>
                      </div>
                    )}
                    <div className="p-1.5 bg-white dark:bg-slate-800">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                        {tpl.title}
                      </p>
                      {linked && <p className="text-xs text-green-600 font-semibold">✓ Linked</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center space-y-2">
            <Target className="w-10 h-10 mx-auto text-gray-200 dark:text-gray-700" />
            <p className="text-sm">Select a brief to view details and link approved assets</p>
          </div>
        </div>
      )}
    </div>
  );
}
