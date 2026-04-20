import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, ChevronRight, X } from 'lucide-react';
import ApprovalWorkflowPanel from './ApprovalWorkflowPanel';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  changes_requested: { label: 'Changes Needed', color: 'bg-orange-100 text-orange-700' },
  pending_brand_approval: { label: 'Brand Approval', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved ✓', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-400' },
};

const COPY_TYPES = [
  'headline',
  'body_copy',
  'cta',
  'caption',
  'subject_line',
  'ad_copy',
  'email_body',
  'newsletter_intro',
  'website_copy',
  'other',
];
const CHANNELS = ['Social', 'Email', 'Ads', 'Website', 'Newsletter', 'EDM', 'SMS'];
const TONES = [
  'professional',
  'casual',
  'inspirational',
  'urgent',
  'educational',
  'playful',
  'authoritative',
];

export default function CopyPoolTab({ currentUser }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    copy_type: 'caption',
    content: '',
    tone: 'professional',
    channels: [],
    tags: [],
  });

  const qc = useQueryClient();
  const QUERY_KEY = ['approved-copy'];

  const { data: items = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => base44.entities.ApprovedCopy.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ApprovedCopy.create(data),
    onSuccess: (newItem) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      setShowForm(false);
      setForm({
        title: '',
        copy_type: 'caption',
        content: '',
        tone: 'professional',
        channels: [],
        tags: [],
      });
      setSelected(newItem);
    },
  });

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.content?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchType = typeFilter === 'all' || item.copy_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...form,
      status: 'draft',
      submitted_by: currentUser?.email,
      submitted_by_name: currentUser?.full_name,
      workflow_history: [],
    });
  };

  const toggleChannel = (ch) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));
  };

  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const pendingCount = items.filter((i) => ['pending_brand_approval'].includes(i.status)).length;

  return (
    <div className="flex gap-4 h-full">
      {/* Left: List */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Stats */}
        <div className="flex gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{approvedCount}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Approved</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Pending Review</p>
          </div>
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Copy
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search copy..."
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {COPY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* New Copy Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-800 dark:text-white text-sm">New Copy Item</p>
              <button onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title (internal reference)"
              className="text-sm"
            />
            <div className="flex gap-2">
              <Select
                value={form.copy_type}
                onValueChange={(v) => setForm((f) => ({ ...f, copy_type: v }))}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COPY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v }))}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Copy text..."
              className="text-sm min-h-[100px] resize-none"
            />
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Channels</p>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${form.channels.includes(ch) ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-500 hover:border-violet-300'}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!form.title || !form.content}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Save Draft
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {isLoading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
            const isSelected = selected?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(isSelected ? null : item)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.content}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                        {item.copy_type?.replace(/_/g, ' ')}
                      </span>
                      {(item.channels || []).slice(0, 3).map((ch) => (
                        <span
                          key={ch}
                          className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 px-1.5 py-0.5 rounded"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-300 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No copy items found.</div>
          )}
        </div>
      </div>

      {/* Right: Approval Panel */}
      {selected && (
        <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4 self-start sticky top-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {selected.title}
            </p>
            <button onClick={() => setSelected(null)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
            {selected.content}
          </div>
          <ApprovalWorkflowPanel
            item={selected}
            entityName="ApprovedCopy"
            queryKey={QUERY_KEY}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
}
