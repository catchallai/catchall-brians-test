import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Pencil, Trash2, ExternalLink } from 'lucide-react';

const STATUS_COLORS = { active: 'bg-blue-100 text-blue-700', compliant: 'bg-green-100 text-green-700', non_compliant: 'bg-red-100 text-red-700', pending_renewal: 'bg-yellow-100 text-yellow-700', expired: 'bg-gray-100 text-gray-600', waived: 'bg-purple-100 text-purple-700' };
const TYPES = ['regulatory', 'contractual', 'statutory', 'license', 'permit', 'filing', 'reporting', 'other'];
const EMPTY = { title: '', description: '', obligation_type: 'regulatory', regulation_name: '', jurisdiction: '', owner_name: '', department: '', status: 'active', due_date: '', renewal_date: '', recurrence: 'annual', penalty_for_non_compliance: '', notes: '', file_url: '' };

function Badge({ value, map }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[value] || 'bg-gray-100 text-gray-600'}`}>{value?.replace(/_/g, ' ')}</span>;
}

export default function LegalObligations() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: items = [] } = useQuery({ queryKey: ['legal-obligations'], queryFn: () => base44.entities.LegalObligation.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['legal-obligations'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.LegalObligation.update(editing.id, d) : base44.entities.LegalObligation.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.LegalObligation.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const today = new Date();
  const overdue = i => i.due_date && new Date(i.due_date) < today && i.status === 'active';
  const filtered = filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" /> Legal Obligations</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Obligation</Button>
      </div>
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Statuses</SelectItem>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Type', 'Regulation', 'Jurisdiction', 'Owner', 'Due Date', 'Recurrence', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No obligations found.</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${overdue(i) ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{i.title}</p>{overdue(i) && <span className="text-xs text-red-600 font-medium">Overdue</span>}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.obligation_type?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.regulation_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.jurisdiction || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.owner_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.due_date || '—'}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.recurrence?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
                <td className="px-4 py-3 flex gap-1">
                  {i.file_url && <a href={i.file_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Obligation' : 'New Obligation'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description</Label><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Type</Label>
              <Select value={form.obligation_type} onValueChange={v => set('obligation_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Recurrence</Label>
              <Select value={form.recurrence} onValueChange={v => set('recurrence', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['one_time', 'monthly', 'quarterly', 'annual', 'biennial'].map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['regulation_name', 'Regulation / Law', 'text'], ['jurisdiction', 'Jurisdiction', 'text'], ['owner_name', 'Owner', 'text'], ['department', 'Department', 'text'], ['due_date', 'Due Date', 'date'], ['renewal_date', 'Renewal Date', 'date']].map(([key, label, type]) => (
              <div key={key}><Label className="text-xs mb-1 block">{label}</Label><Input type={type} value={form[key] ?? ''} onChange={e => set(key, e.target.value)} /></div>
            ))}
            <div className="col-span-2"><Label className="text-xs mb-1 block">Penalty for Non-Compliance</Label><Input value={form.penalty_for_non_compliance ?? ''} onChange={e => set('penalty_for_non_compliance', e.target.value)} /></div>
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