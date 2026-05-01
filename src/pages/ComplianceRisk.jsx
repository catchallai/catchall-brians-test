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
import { Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react';

const LIKELIHOOD_SCORE = { rare: 1, unlikely: 2, possible: 3, likely: 4, almost_certain: 5 };
const IMPACT_SCORE = { negligible: 1, minor: 2, moderate: 3, major: 4, catastrophic: 5 };

const getRiskLevel = (likelihood, impact) => {
  const score = (LIKELIHOOD_SCORE[likelihood] || 1) * (IMPACT_SCORE[impact] || 1);
  if (score >= 15) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
  if (score >= 9) return { label: 'High', color: 'bg-orange-100 text-orange-700' };
  if (score >= 4) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', color: 'bg-green-100 text-green-700' };
};

const STATUS_COLORS = { identified: 'bg-gray-100 text-gray-600', assessed: 'bg-blue-100 text-blue-700', mitigating: 'bg-yellow-100 text-yellow-700', accepted: 'bg-purple-100 text-purple-700', closed: 'bg-green-100 text-green-700' };
const CATS = ['operational', 'legal', 'financial', 'reputational', 'regulatory', 'it', 'hr', 'other'];
const EMPTY = { title: '', description: '', category: 'other', likelihood: 'possible', impact: 'moderate', status: 'identified', owner_name: '', mitigation_plan: '', review_date: '', department: '' };

export default function ComplianceRisk() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: risks = [] } = useQuery({ queryKey: ['comp-risks'], queryFn: () => base44.entities.ComplianceRisk.list('-created_date') });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['comp-risks'] });
  const saveMutation = useMutation({
    mutationFn: (d) => editing ? base44.entities.ComplianceRisk.update(editing.id, d) : base44.entities.ComplianceRisk.create(d),
    onSuccess: () => { invalidate(); setOpen(false); },
  });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.ComplianceRisk.delete(id), onSuccess: invalidate });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const filtered = filterStatus === 'all' ? risks : risks.filter(r => r.status === filterStatus);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-600" /> Risk Register</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Log Risk</Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['identified', 'assessed', 'mitigating', 'accepted', 'closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Title', 'Category', 'Likelihood', 'Impact', 'Risk Level', 'Owner', 'Review Date', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No risks logged.</td></tr>}
            {filtered.map(r => {
              const level = getRiskLevel(r.likelihood, r.impact);
              return (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.title}</td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{r.category}</td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{r.likelihood?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{r.impact}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${level.color}`}>{level.label}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.owner_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.review_date || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Risk' : 'Log Risk'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Title</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description</Label><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['identified', 'assessed', 'mitigating', 'accepted', 'closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Likelihood</Label>
              <Select value={form.likelihood} onValueChange={v => set('likelihood', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(LIKELIHOOD_SCORE).map(l => <SelectItem key={l} value={l}>{l.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Impact</Label>
              <Select value={form.impact} onValueChange={v => set('impact', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(IMPACT_SCORE).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Owner</Label><Input value={form.owner_name ?? ''} onChange={e => set('owner_name', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Department</Label><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Review Date</Label><Input type="date" value={form.review_date ?? ''} onChange={e => set('review_date', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Mitigation Plan</Label><Textarea rows={2} value={form.mitigation_plan ?? ''} onChange={e => set('mitigation_plan', e.target.value)} /></div>
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