import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GraduationCap, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = { active: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-600', archived: 'bg-red-100 text-red-600' };
const CATS = ['anti_harassment', 'data_privacy', 'code_of_conduct', 'safety', 'financial', 'it_security', 'diversity', 'other'];
const EMPTY = { title: '', description: '', category: 'other', status: 'draft', due_date: '', frequency: 'annual', required: true, url: '', duration_minutes: '' };

export default function ComplianceTraining() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: trainings = [] } = useQuery({ queryKey: ['comp-trainings'], queryFn: () => base44.entities.ComplianceTraining.list('-created_date') });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['comp-trainings'] });
  const saveMutation = useMutation({
    mutationFn: (d) => editing ? base44.entities.ComplianceTraining.update(editing.id, d) : base44.entities.ComplianceTraining.create(d),
    onSuccess: () => { invalidate(); setOpen(false); },
  });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.ComplianceTraining.delete(id), onSuccess: invalidate });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const today = new Date();
  const overdue = (t) => t.due_date && new Date(t.due_date) < today && t.status === 'active';

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" /> Compliance Training</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Training</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Category', 'Frequency', 'Due Date', 'Duration', 'Required', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {trainings.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No trainings yet.</td></tr>}
            {trainings.map(t => (
              <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${overdue(t) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{t.title}</p>
                  {overdue(t) && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                </td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{t.category?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{t.frequency?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.due_date || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.duration_minutes ? `${t.duration_minutes} min` : '—'}</td>
                <td className="px-4 py-3">{t.required ? <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Required</span> : <span className="text-xs text-gray-400">Optional</span>}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ''}`}>{t.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Training' : 'New Training'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description</Label><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Frequency</Label>
              <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['one_time', 'annual', 'bi_annual', 'quarterly'].map(f => <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['draft', 'active', 'archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Due Date</Label><Input type="date" value={form.due_date ?? ''} onChange={e => set('due_date', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Duration (minutes)</Label><Input type="number" value={form.duration_minutes ?? ''} onChange={e => set('duration_minutes', Number(e.target.value))} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Training URL</Label><Input value={form.url ?? ''} onChange={e => set('url', e.target.value)} placeholder="https://…" /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="req" checked={!!form.required} onChange={e => set('required', e.target.checked)} />
              <Label htmlFor="req" className="text-xs cursor-pointer">Required training</Label>
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