import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';

const STATUS_COLORS = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', on_retainer: 'bg-purple-100 text-purple-700' };
const TYPE_COLORS = { in_house: 'bg-blue-100 text-blue-700', external: 'bg-indigo-100 text-indigo-700', contract: 'bg-yellow-100 text-yellow-700', pro_bono: 'bg-teal-100 text-teal-700' };
const EMPTY = { name: '', firm_name: '', type: 'external', specialization: [], email: '', phone: '', bar_number: '', jurisdiction: '', status: 'active', hourly_rate: '', retainer_amount: '', ytd_spend: '', notes: '' };

function Badge({ value, map }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[value] || 'bg-gray-100 text-gray-600'}`}>{value?.replace(/_/g, ' ')}</span>;
}

export default function LegalCounsel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['legal-counsel'], queryFn: () => base44.entities.LegalCounsel.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['legal-counsel'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.LegalCounsel.update(editing.id, d) : base44.entities.LegalCounsel.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.LegalCounsel.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p, specialization: p.specialization || [] }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };

  const totalYTD = items.reduce((s, i) => s + (i.ytd_spend || 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-teal-600" /> Legal Counsel</h1>
          {totalYTD > 0 && <p className="text-sm text-gray-500 mt-0.5">YTD Legal Spend: <span className="font-semibold text-gray-700 dark:text-gray-200">${totalYTD.toLocaleString()}</span></p>}
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Counsel</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.length === 0 && <p className="text-gray-400 text-sm col-span-3 py-8 text-center">No counsel records yet.</p>}
        {items.map(i => (
          <div key={i.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(i)}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">{i.name}</p>
                {i.firm_name && <p className="text-xs text-gray-500">{i.firm_name}</p>}
              </div>
              <Badge value={i.status} map={STATUS_COLORS} />
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              <Badge value={i.type} map={TYPE_COLORS} />
              {(i.specialization || []).slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{s}</span>)}
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              {i.email && <p>📧 {i.email}</p>}
              {i.phone && <p>📞 {i.phone}</p>}
              {i.jurisdiction && <p>⚖️ {i.jurisdiction}</p>}
              {i.hourly_rate && <p>💰 ${i.hourly_rate}/hr</p>}
              {i.ytd_spend && <p>📊 YTD: ${Number(i.ytd_spend).toLocaleString()}</p>}
            </div>
            <div className="flex justify-end gap-1 mt-3" onClick={e => e.stopPropagation()}>
              <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit: ${editing.name}` : 'Add Counsel'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1 block">Full Name</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Firm Name</Label><Input value={form.firm_name ?? ''} onChange={e => set('firm_name', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(TYPE_COLORS).map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Email</Label><Input value={form.email ?? ''} onChange={e => set('email', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Phone</Label><Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Bar Number</Label><Input value={form.bar_number ?? ''} onChange={e => set('bar_number', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Jurisdiction</Label><Input value={form.jurisdiction ?? ''} onChange={e => set('jurisdiction', e.target.value)} /></div>
            <div><Label className="text-xs mb-1 block">Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate ?? ''} onChange={e => set('hourly_rate', Number(e.target.value))} /></div>
            <div><Label className="text-xs mb-1 block">Retainer ($)</Label><Input type="number" value={form.retainer_amount ?? ''} onChange={e => set('retainer_amount', Number(e.target.value))} /></div>
            <div><Label className="text-xs mb-1 block">YTD Spend ($)</Label><Input type="number" value={form.ytd_spend ?? ''} onChange={e => set('ytd_spend', Number(e.target.value))} /></div>
            <div className="col-span-2"><Label className="text-xs mb-1 block">Specializations (comma-separated)</Label><Input value={(form.specialization || []).join(', ')} onChange={e => set('specialization', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="IP, Employment, M&A" /></div>
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