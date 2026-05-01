import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Pencil, Trash2 } from 'lucide-react';

const STATUS_COLORS = { open: 'bg-red-100 text-red-700', under_investigation: 'bg-yellow-100 text-yellow-700', resolved: 'bg-blue-100 text-blue-700', closed: 'bg-gray-100 text-gray-600' };
const SEV_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const CATS = ['policy_violation', 'data_breach', 'harassment', 'safety', 'fraud', 'conflict_of_interest', 'other'];
const EMPTY = { title: '', description: '', category: 'other', severity: 'medium', status: 'open', reported_by: '', assigned_to: '', incident_date: '', resolution_notes: '', anonymous: false, department: '' };

export default function ComplianceIncidents() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: incidents = [] } = useQuery({ queryKey: ['comp-incidents'], queryFn: () => base44.entities.ComplianceIncident.list('-created_date') });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['comp-incidents'] });
  const saveMutation = useMutation({
    mutationFn: (d) => editing ? base44.entities.ComplianceIncident.update(editing.id, d) : base44.entities.ComplianceIncident.create(d),
    onSuccess: () => { invalidate(); setOpen(false); },
  });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.ComplianceIncident.delete(id), onSuccess: invalidate });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (i) => { setEditing(i); setForm({ ...i }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const filtered = filterStatus === 'all' ? incidents : incidents.filter(i => i.status === filterStatus);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Incidents</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Report Incident</Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['open', 'under_investigation', 'resolved', 'closed'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Category', 'Severity', 'Dept', 'Date', 'Reported By', 'Assigned To', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No incidents found.</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{i.title}</p>{i.anonymous && <span className="text-xs text-gray-400">Anonymous</span>}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.category?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEV_COLORS[i.severity] || ''}`}>{i.severity}</span></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.department || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.incident_date || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.anonymous ? 'Anonymous' : (i.reported_by || '—')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.assigned_to || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[i.status] || ''}`}>{i.status?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Incident' : 'Report Incident'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description</Label><Textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Severity</Label>
              <Select value={form.severity} onValueChange={v => set('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high', 'critical'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['open', 'under_investigation', 'resolved', 'closed'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Incident Date</Label><Input type="date" value={form.incident_date ?? ''} onChange={e => set('incident_date', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Department</Label><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Reported By</Label><Input value={form.reported_by ?? ''} onChange={e => set('reported_by', e.target.value)} disabled={form.anonymous} /></div>
            <div><Label className="text-xs mb-1 block">Assigned To</Label><Input value={form.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Resolution Notes</Label><Textarea rows={2} value={form.resolution_notes ?? ''} onChange={e => set('resolution_notes', e.target.value)} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="anon" checked={!!form.anonymous} onChange={e => set('anonymous', e.target.checked)} />
              <Label htmlFor="anon" className="text-xs cursor-pointer">Report anonymously</Label>
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