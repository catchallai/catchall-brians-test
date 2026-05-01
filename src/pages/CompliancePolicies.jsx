import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  under_review: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-600',
};

const CATEGORIES = ['hr', 'data_privacy', 'financial', 'health_safety', 'environmental', 'code_of_conduct', 'it_security', 'regulatory', 'other'];

const EMPTY = { title: '', description: '', category: 'other', owner_name: '', version: '1.0', status: 'draft', effective_date: '', review_date: '', file_url: '', requires_acknowledgment: true };

export default function CompliancePolicies() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: policies = [] } = useQuery({ queryKey: ['comp-policies'], queryFn: () => base44.entities.CompliancePolicy.list('-created_date') });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['comp-policies'] });
  const saveMutation = useMutation({
    mutationFn: (d) => editing ? base44.entities.CompliancePolicy.update(editing.id, d) : base44.entities.CompliancePolicy.create(d),
    onSuccess: () => { invalidate(); setOpen(false); },
  });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.CompliancePolicy.delete(id), onSuccess: invalidate });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const filtered = policies
    .filter(p => filterCat === 'all' || p.category === filterCat)
    .filter(p => `${p.title} ${p.owner_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Policies</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Policy</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search policies…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Category', 'Owner', 'Version', 'Effective', 'Review Due', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No policies found.</td></tr>}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{p.title}</p>
                  {p.requires_acknowledgment && <span className="text-xs text-violet-600">Acknowledgment required</span>}
                </td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{p.category?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.owner_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.version || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.effective_date || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.review_date || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {p.file_url && <a href={p.file_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Policy' : 'New Policy'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description</Label><Textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['draft', 'active', 'under_review', 'archived'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['Owner', 'owner_name', 'text'], ['Version', 'version', 'text'], ['Effective Date', 'effective_date', 'date'], ['Review Date', 'review_date', 'date']].map(([label, key, type]) => (
              <div key={key}><Label className="text-xs mb-1 block">{label}</Label><Input type={type} value={form[key] ?? ''} onChange={e => set(key, e.target.value)} /></div>
            ))}
            <div className="col-span-2"><Label className="text-xs mb-1 block">File URL</Label><Input value={form.file_url ?? ''} onChange={e => set('file_url', e.target.value)} placeholder="https://…" /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="ack" checked={!!form.requires_acknowledgment} onChange={e => set('requires_acknowledgment', e.target.checked)} />
              <Label htmlFor="ack" className="text-xs cursor-pointer">Requires employee acknowledgment</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}