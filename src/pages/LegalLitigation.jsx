import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Scale, Pencil, Trash2, ExternalLink } from 'lucide-react';

const STATUS_COLORS = { pre_litigation: 'bg-gray-100 text-gray-600', filed: 'bg-blue-100 text-blue-700', discovery: 'bg-yellow-100 text-yellow-700', trial: 'bg-orange-100 text-orange-700', appeal: 'bg-purple-100 text-purple-700', settled: 'bg-green-100 text-green-700', dismissed: 'bg-teal-100 text-teal-700', closed: 'bg-gray-100 text-gray-600' };
const PRIORITY_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const EMPTY = { case_name: '', case_number: '', description: '', case_type: 'civil', status: 'pre_litigation', our_role: 'defendant', opposing_party: '', opposing_counsel: '', our_counsel: '', court_name: '', jurisdiction: '', judge_name: '', filed_date: '', next_hearing_date: '', resolution_date: '', claim_amount: '', settlement_amount: '', legal_reserve: '', priority: 'medium', notes: '', file_url: '' };

function Badge({ value, map }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[value] || 'bg-gray-100 text-gray-600'}`}>{value?.replace(/_/g, ' ')}</span>;
}

export default function LegalLitigation() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: items = [] } = useQuery({ queryKey: ['legal-litigation'], queryFn: () => base44.entities.Litigation.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['legal-litigation'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.Litigation.update(editing.id, d) : base44.entities.Litigation.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.Litigation.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const filtered = filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus);
  const totalReserve = filtered.reduce((s, i) => s + (i.legal_reserve || 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Scale className="w-5 h-5 text-red-600" /> Litigation</h1>
          {totalReserve > 0 && <p className="text-sm text-gray-500 mt-0.5">Total Legal Reserve: <span className="font-semibold text-gray-700 dark:text-gray-200">${totalReserve.toLocaleString()}</span></p>}
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Case</Button>
      </div>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Statuses</SelectItem>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Case', 'Type', 'Our Role', 'Opposing Party', 'Court', 'Next Hearing', 'Claim', 'Reserve', 'Priority', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No cases found.</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => openEdit(i)}>
                <td className="px-4 py-3"><p className="font-medium text-red-600 dark:text-red-400 hover:underline">{i.case_name}</p>{i.case_number && <p className="text-xs text-gray-400">#{i.case_number}</p>}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.case_type}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.our_role}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.opposing_party || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.court_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.next_hearing_date || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.claim_amount ? `$${Number(i.claim_amount).toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.legal_reserve ? `$${Number(i.legal_reserve).toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3"><Badge value={i.priority} map={PRIORITY_COLORS} /></td>
                <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
                <td className="px-4 py-3 flex gap-1" onClick={e => e.stopPropagation()}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit: ${editing.case_name}` : 'New Case'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Case Name</Label><Input value={form.case_name} onChange={e => set('case_name', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Case Number</Label><Input value={form.case_number ?? ''} onChange={e => set('case_number', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Case Type</Label>
              <Select value={form.case_type} onValueChange={v => set('case_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['civil', 'criminal', 'arbitration', 'mediation', 'administrative', 'regulatory', 'employment', 'ip', 'other'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Our Role</Label>
              <Select value={form.our_role} onValueChange={v => set('our_role', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['plaintiff', 'defendant', 'third_party', 'respondent', 'petitioner'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high', 'critical'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['opposing_party', 'Opposing Party', 'text'], ['opposing_counsel', 'Opposing Counsel', 'text'], ['our_counsel', 'Our Counsel', 'text'], ['court_name', 'Court Name', 'text'], ['jurisdiction', 'Jurisdiction', 'text'], ['judge_name', 'Judge', 'text'], ['filed_date', 'Filed Date', 'date'], ['next_hearing_date', 'Next Hearing', 'date'], ['resolution_date', 'Resolution Date', 'date'], ['claim_amount', 'Claim Amount ($)', 'number'], ['settlement_amount', 'Settlement Amount ($)', 'number'], ['legal_reserve', 'Legal Reserve ($)', 'number']].map(([key, label, type]) => (
              <div key={key}><Label className="text-xs mb-1 block">{label}</Label><Input type={type} value={form[key] ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} /></div>
            ))}
            <div className="col-span-2"><Label className="text-xs mb-1 block">Description / Notes</Label><Textarea rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>
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