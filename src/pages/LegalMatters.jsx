import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Briefcase, Search, Pencil, Trash2, ExternalLink } from 'lucide-react';

const PRIORITY_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
const STATUS_COLORS = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', on_hold: 'bg-gray-100 text-gray-600', closed: 'bg-green-100 text-green-700', archived: 'bg-slate-100 text-slate-600' };
const TYPES = ['contract', 'litigation', 'regulatory', 'employment', 'ip', 'corporate', 'real_estate', 'tax', 'data_privacy', 'm_and_a', 'other'];
const EMPTY = { title: '', description: '', matter_type: 'other', status: 'open', priority: 'medium', assigned_attorney: '', client_name: '', opposing_party: '', jurisdiction: '', open_date: '', close_date: '', deadline: '', estimated_cost: '', actual_cost: '', billing_type: 'hourly', notes: '', file_url: '' };

function Badge({ value, map }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[value] || 'bg-gray-100 text-gray-600'}`}>{value?.replace(/_/g, ' ')}</span>;
}

export default function LegalMatters() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['legal-matters'], queryFn: () => base44.entities.LegalMatter.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['legal-matters'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.LegalMatter.update(editing.id, d) : base44.entities.LegalMatter.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.LegalMatter.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const filtered = items
    .filter(i => filterStatus === 'all' || i.status === filterStatus)
    .filter(i => filterType === 'all' || i.matter_type === filterType)
    .filter(i => `${i.title} ${i.assigned_attorney} ${i.client_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-600" /> Legal Matters</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Matter</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search matters…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>{['all', 'open', 'in_progress', 'on_hold', 'closed', 'archived'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Type', 'Attorney', 'Client', 'Deadline', 'Est. Cost', 'Priority', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No matters found.</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => openEdit(i)}>
                <td className="px-4 py-3"><p className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{i.title}</p>{i.jurisdiction && <p className="text-xs text-gray-400">{i.jurisdiction}</p>}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.matter_type?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.assigned_attorney || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.client_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.deadline || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.estimated_cost ? `$${Number(i.estimated_cost).toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3"><Badge value={i.priority} map={PRIORITY_COLORS} /></td>
                <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    {i.file_url && <a href={i.file_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit: ${editing.title}` : 'New Legal Matter'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description</Label><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            {[['matter_type', 'Matter Type', TYPES], ['status', 'Status', ['open', 'in_progress', 'on_hold', 'closed', 'archived']], ['priority', 'Priority', ['low', 'medium', 'high', 'urgent']], ['billing_type', 'Billing Type', ['hourly', 'flat_fee', 'contingency', 'retainer', 'pro_bono']]].map(([key, label, opts]) => (
              <div key={key}><Label className="text-xs mb-1 block">{label}</Label>
                <Select value={form[key]} onValueChange={v => set(key, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{opts.map(o => <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            {[['assigned_attorney', 'Assigned Attorney', 'text'], ['client_name', 'Client Name', 'text'], ['opposing_party', 'Opposing Party', 'text'], ['jurisdiction', 'Jurisdiction', 'text'], ['open_date', 'Open Date', 'date'], ['deadline', 'Deadline', 'date'], ['estimated_cost', 'Estimated Cost ($)', 'number'], ['actual_cost', 'Actual Cost ($)', 'number']].map(([key, label, type]) => (
              <div key={key}><Label className="text-xs mb-1 block">{label}</Label><Input type={type} value={form[key] ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} /></div>
            ))}
            <div className="col-span-2"><Label className="text-xs mb-1 block">File URL</Label><Input value={form.file_url ?? ''} onChange={e => set('file_url', e.target.value)} placeholder="https://…" /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Notes</Label><Textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}