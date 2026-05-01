import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';

const STATUS_COLORS = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', dissolved: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700' };
const ENTITY_TYPES = ['corporation', 'llc', 'partnership', 'sole_proprietorship', 'nonprofit', 'trust', 'subsidiary', 'joint_venture', 'other'];
const EMPTY = { name: '', entity_type: 'llc', jurisdiction: '', registration_number: '', ein_tax_id: '', status: 'active', parent_entity_name: '', registered_agent: '', registered_address: '', incorporation_date: '', dissolution_date: '', annual_report_due: '', fiscal_year_end: '', ownership_percentage: '', notes: '' };

function Badge({ value, map }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[value] || 'bg-gray-100 text-gray-600'}`}>{value?.replace(/_/g, ' ')}</span>;
}

export default function LegalEntities() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['legal-entities'], queryFn: () => base44.entities.LegalEntity.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['legal-entities'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.LegalEntity.update(editing.id, d) : base44.entities.LegalEntity.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.LegalEntity.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const today = new Date();
  const reportDueSoon = i => i.annual_report_due && new Date(i.annual_report_due) > today && new Date(i.annual_report_due) < new Date(today.getTime() + 60 * 86400000);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-slate-600" /> Legal Entities</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Entity</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
            <tr>{['Name', 'Type', 'Jurisdiction', 'Reg. Number', 'EIN/Tax ID', 'Parent', 'Incorporated', 'Annual Report Due', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No entities found.</td></tr>}
            {items.map(i => (
              <tr key={i.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${reportDueSoon(i) ? 'bg-yellow-50/40 dark:bg-yellow-900/10' : ''}`}>
                <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{i.name}</p>{reportDueSoon(i) && <span className="text-xs text-yellow-600 font-medium">Annual report due soon</span>}</td>
                <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.entity_type?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.jurisdiction || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.registration_number || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.ein_tax_id || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.parent_entity_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.incorporation_date || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.annual_report_due || '—'}</td>
                <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
                <td className="px-4 py-3 flex gap-1">
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Entity' : 'Add Entity'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Entity Name</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Entity Type</Label>
              <Select value={form.entity_type} onValueChange={v => set('entity_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['jurisdiction', 'Jurisdiction', 'text'], ['registration_number', 'Registration Number', 'text'], ['ein_tax_id', 'EIN / Tax ID', 'text'], ['parent_entity_name', 'Parent Entity', 'text'], ['registered_agent', 'Registered Agent', 'text'], ['ownership_percentage', 'Ownership %', 'number'], ['incorporation_date', 'Incorporation Date', 'date'], ['dissolution_date', 'Dissolution Date', 'date'], ['annual_report_due', 'Annual Report Due', 'date'], ['fiscal_year_end', 'Fiscal Year End (MM-DD)', 'text']].map(([key, label, type]) => (
              <div key={key}><Label className="text-xs mb-1 block">{label}</Label><Input type={type} value={form[key] ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} /></div>
            ))}
            <div className="col-span-2"><Label className="text-xs mb-1 block">Registered Address</Label><Input value={form.registered_address ?? ''} onChange={e => set('registered_address', e.target.value)} /></div>
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