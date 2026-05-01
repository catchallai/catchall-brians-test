import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pin, Megaphone, Pencil, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const CATEGORY_COLORS = {
  company_news: 'bg-violet-100 text-violet-700',
  policy: 'bg-yellow-100 text-yellow-700',
  event: 'bg-green-100 text-green-700',
  benefits: 'bg-teal-100 text-teal-700',
  hiring: 'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
};

const EMPTY = {
  title: '', body: '', category: 'general', priority: 'normal',
  status: 'published', author_name: '', pinned: false, expires_at: '',
};

export default function HRISAnnouncements() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('published');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: announcements = [] } = useQuery({
    queryKey: ['hris-announcements'],
    queryFn: () => base44.entities.HRISAnnouncement.list('-created_date'),
  });

  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: () => base44.auth.me() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['hris-announcements'] });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? base44.entities.HRISAnnouncement.update(editing.id, data)
        : base44.entities.HRISAnnouncement.create({ ...data, author_name: user?.full_name || 'HR Team', published_at: new Date().toISOString() }),
    onSuccess: () => { invalidate(); setOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HRISAnnouncement.delete(id),
    onSuccess: invalidate,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a }); setOpen(true); };

  const filtered = announcements
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => `${a.title} ${a.body}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-violet-600" /> Announcements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Company-wide communications and updates</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Announcement</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">No announcements found.</div>
        )}
        {filtered.map((a) => (
          <Card key={a.id} className={`relative ${a.pinned ? 'border-violet-300 dark:border-violet-700' : ''}`}>
            {a.pinned && (
              <div className="absolute top-3 right-12 text-violet-500"><Pin className="w-4 h-4" /></div>
            )}
            <CardHeader className="pb-2 flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[a.priority] || ''}`}>
                    {a.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[a.category] || ''}`}>
                    {a.category?.replace(/_/g, ' ')}
                  </span>
                  {a.status === 'draft' && <Badge variant="outline" className="text-xs">Draft</Badge>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                <p className="text-xs text-gray-400">
                  By {a.author_name || 'HR Team'} · {a.published_at ? format(new Date(a.published_at), 'MMM d, yyyy') : ''}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1 block">Title</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Body</Label>
              <Textarea rows={5} value={form.body} onChange={(e) => set('body', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Category</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['company_news', 'policy', 'event', 'benefits', 'hiring', 'general'].map((c) => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low', 'normal', 'high', 'urgent'].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['draft', 'published', 'archived'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="pinned" checked={!!form.pinned} onChange={(e) => set('pinned', e.target.checked)} className="rounded" />
                <Label htmlFor="pinned" className="text-xs cursor-pointer">Pin to top</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}