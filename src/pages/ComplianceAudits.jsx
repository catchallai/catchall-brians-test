import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, ExternalLink } from 'lucide-react';

const STATUS_COLORS = { planned: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-600' };
const RISK_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const EMPTY = { title: '', description: '', audit_type: 'internal', scope: '', status: 'planned', auditor_name: '', department: '', start_date: '', end_date: '', findings: '', recommendations: '', risk_rating: 'medium', follow_up_date: '', file_url: '' };

export default function ComplianceAudits() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: audits = [] } = useQuery({ queryKey: ['comp-audits'], queryFn: () => base44.entities.ComplianceAudit.list('-created_date') });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['comp-audits'] });
  const saveMutation = useMutation({
    mutationFn: (d) => editing ? base44.entities.ComplianceAudit.update(editing.id, d) : base44.entities.ComplianceAudit.create(d),
    onSuccess: () => { invalidate(); setOpen(false); },
  });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.ComplianceAudit.delete(id), onSuccess: invalidate });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (a) => { setEditing(a); setForm({ ...a }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Search className="w-5 h-5 text-violet-600" /> Audits</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Audit</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Type', 'Auditor', 'Dept', 'Start', 'End', 'Risk', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {audits.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No audits scheduled.</td></tr>}
            {audits.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.title}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{a.audit_type?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.auditor_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.department || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.start_date || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.end_date || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[a.risk_rating] || ''}`}>{a.risk_rating}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || ''}`}>{a.status?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {a.file_url && <a href={a.file_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Audit' : 'New Audit'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Scope</Label><Textarea rows={2} value={form.scope} onChange={e => set('scope', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Audit Type</Label>
              <Select value={form.audit_type} onValueChange={v => set('audit_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['internal', 'external', 'regulatory', 'third_party'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['planned', 'in_progress', 'completed', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Risk Rating</Label>
              <Select value={form.risk_rating} onValueChange={v => set('risk_rating', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high', 'critical'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Auditor</Label><Input value={form.auditor_name ?? ''} onChange={e => set('auditor_name', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Department</Label><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Start Date</Label><Input type="date" value={form.start_date ?? ''} onChange={e => set('start_date', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">End Date</Label><Input type="date" value={form.end_date ?? ''} onChange={e => set('end_date', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Follow-up Date</Label><Input type="date" value={form.follow_up_date ?? ''} onChange={e => set('follow_up_date', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Findings</Label><Textarea rows={2} value={form.findings ?? ''} onChange={e => set('findings', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Recommendations</Label><Textarea rows={2} value={form.recommendations ?? ''} onChange={e => set('recommendations', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">File URL</Label><Input value={form.file_url ?? ''} onChange={e => set('file_url', e.target.value)} placeholder="https://…" /></div>
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