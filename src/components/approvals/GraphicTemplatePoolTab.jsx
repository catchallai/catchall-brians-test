import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Image, X, ExternalLink } from 'lucide-react';
import ApprovalWorkflowPanel from './ApprovalWorkflowPanel';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  changes_requested: { label: 'Changes Needed', color: 'bg-orange-100 text-orange-700' },
  pending_brand_approval: { label: 'Brand Approval', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved ✓', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-400' },
};

const TEMPLATE_TYPES = [
  'social_post',
  'story',
  'reel_cover',
  'ad_banner',
  'email_header',
  'newsletter_layout',
  'website_hero',
  'carousel_slide',
  'other',
];
const AESTHETICS = [
  'minimal',
  'bold',
  'editorial',
  'lifestyle',
  'corporate',
  'playful',
  'luxury',
  'documentary',
];
const CHANNELS = ['Social', 'Email', 'Ads', 'Website', 'Newsletter', 'EDM'];

export default function GraphicTemplatePoolTab({ currentUser }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    template_type: 'social_post',
    aesthetic_style: 'minimal',
    preview_url: '',
    file_url: '',
    dimensions: '',
    channels: [],
  });

  const qc = useQueryClient();
  const QUERY_KEY = ['approved-graphic-templates'];

  const { data: items = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => base44.entities.ApprovedGraphicTemplate.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ApprovedGraphicTemplate.create(data),
    onSuccess: (newItem) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      setShowForm(false);
      setForm({
        title: '',
        template_type: 'social_post',
        aesthetic_style: 'minimal',
        preview_url: '',
        file_url: '',
        dimensions: '',
        channels: [],
      });
      setSelected(newItem);
    },
  });

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchType = typeFilter === 'all' || item.template_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

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
      <div className="flex-1 min-w-0 space-y-3">
        {/* Stats */}
        <div className="flex gap-3 items-center">
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
              <Plus className="w-4 h-4" /> Add Template
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
              placeholder="Search templates..."
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
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TEMPLATE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* New Template Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm text-gray-800 dark:text-white">
                New Graphic Template
              </p>
              <button onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Template name"
              className="text-sm"
            />
            <div className="flex gap-2">
              <Select
                value={form.template_type}
                onValueChange={(v) => setForm((f) => ({ ...f, template_type: v }))}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.aesthetic_style}
                onValueChange={(v) => setForm((f) => ({ ...f, aesthetic_style: v }))}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AESTHETICS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              value={form.preview_url}
              onChange={(e) => setForm((f) => ({ ...f, preview_url: e.target.value }))}
              placeholder="Preview image URL"
              className="text-sm"
            />
            <Input
              value={form.file_url}
              onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
              placeholder="Source file URL (Canva / Figma / Drive)"
              className="text-sm"
            />
            <Input
              value={form.dimensions}
              onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))}
              placeholder="Dimensions e.g. 1080x1080"
              className="text-sm"
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
                onClick={() =>
                  createMutation.mutate({
                    ...form,
                    status: 'draft',
                    submitted_by: currentUser?.email,
                    submitted_by_name: currentUser?.full_name,
                    workflow_history: [],
                  })
                }
                disabled={!form.title}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Save Draft
              </Button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoading && (
            <div className="col-span-2 text-center py-8 text-gray-400 text-sm">Loading...</div>
          )}
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
            const isSelected = selected?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(isSelected ? null : item)}
                className={`text-left rounded-xl border transition-all overflow-hidden ${isSelected ? 'border-violet-400 ring-1 ring-violet-300' : 'border-gray-100 dark:border-slate-700 hover:border-gray-200'}`}
              >
                {item.preview_url ? (
                  <div className="w-full h-28 bg-gray-100 dark:bg-slate-700 overflow-hidden">
                    <img
                      src={item.preview_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-28 bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="p-3 bg-white dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {item.title}
                    </p>
                    <Badge className={`${cfg.color} text-xs flex-shrink-0`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.template_type?.replace(/_/g, ' ')} · {item.aesthetic_style}
                  </p>
                  {item.dimensions && (
                    <p className="text-xs text-gray-300 dark:text-gray-600">{item.dimensions}</p>
                  )}
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Source File
                    </a>
                  )}
                </div>
              </button>
            );
          })}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
              No templates found.
            </div>
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
          {selected.preview_url && (
            <img
              src={selected.preview_url}
              alt=""
              className="w-full rounded-lg object-cover max-h-36"
            />
          )}
          <ApprovalWorkflowPanel
            item={selected}
            entityName="ApprovedGraphicTemplate"
            queryKey={QUERY_KEY}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
}
