import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, ShieldCheck, ExternalLink } from 'lucide-react';

// ─── Shared helpers ───────────────────────────────────────────────
const RISK_COLORS = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', under_review: 'bg-yellow-100 text-yellow-700',
  pending_review: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-700',
  license_required: 'bg-orange-100 text-orange-700', exempt: 'bg-blue-100 text-blue-700',
  open: 'bg-red-100 text-red-700', under_investigation: 'bg-yellow-100 text-yellow-700',
  reported_to_authorities: 'bg-orange-100 text-orange-700', remediated: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600', acknowledged: 'bg-blue-100 text-blue-700', resolved: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600', archived: 'bg-red-100 text-red-600',
  pending_review2: 'bg-yellow-100 text-yellow-700',
};
const SEV_COLORS = { info: 'bg-blue-100 text-blue-700', warning: 'bg-yellow-100 text-yellow-700', critical: 'bg-red-100 text-red-700', minor: 'bg-gray-100 text-gray-600', moderate: 'bg-yellow-100 text-yellow-700', major: 'bg-orange-100 text-orange-700' };

function Badge({ value, map }) {
  const cls = map[value] || 'bg-gray-100 text-gray-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{value?.replace(/_/g, ' ')}</span>;
}

function TableShell({ cols, rows, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
          <tr>{cols.map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.length === 0 ? <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-gray-400">{empty}</td></tr> : rows}
        </tbody>
      </table>
    </div>
  );
}

function FormField({ label, children, span = 1 }) {
  return <div className={span === 2 ? 'col-span-2' : ''}><Label className="text-xs mb-1 block">{label}</Label>{children}</div>;
}

// ─── Programs ────────────────────────────────────────────────────
const PROG_EMPTY = { name: '', description: '', regulations: [], owner_name: '', department: '', risk_level: 'medium', status: 'active', start_date: '', review_date: '', notes: '' };

function Programs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(PROG_EMPTY);
  const [editing, setEditing] = useState(null);
  const [regInput, setRegInput] = useState('');

  const { data: items = [] } = useQuery({ queryKey: ['ec-programs'], queryFn: () => base44.entities.ExportControlProgram.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-programs'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.ExportControlProgram.update(editing.id, d) : base44.entities.ExportControlProgram.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.ExportControlProgram.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p, regulations: p.regulations || [] }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(PROG_EMPTY); setOpen(true); };

  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search programs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Program</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-3 py-8 text-center">No programs found.</p>}
        {filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-gray-500">{(p.regulations || []).join(', ')}</p>
              </div>
              <Badge value={p.status} map={STATUS_COLORS} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Owner:</span><span className="text-gray-700 dark:text-gray-300">{p.owner_name || '—'}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Risk Level:</span><Badge value={p.risk_level} map={RISK_COLORS} /></div>
            </div>
            <div className="flex justify-end gap-1 mt-3">
              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Program' : 'New Program'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Program Name" span={2}><Input value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
            <FormField label="Description" span={2}><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
            <FormField label="Regulations (comma-separated)" span={2}>
              <Input value={(form.regulations || []).join(', ')} onChange={e => set('regulations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="EAR, ITAR, TCP" />
            </FormField>
            <FormField label="Owner"><Input value={form.owner_name ?? ''} onChange={e => set('owner_name', e.target.value)} /></FormField>
            <FormField label="Department"><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></FormField>
            <FormField label="Risk Level">
              <Select value={form.risk_level} onValueChange={v => set('risk_level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high', 'critical'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['active', 'inactive', 'under_review'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Start Date"><Input type="date" value={form.start_date ?? ''} onChange={e => set('start_date', e.target.value)} /></FormField>
            <FormField label="Review Date"><Input type="date" value={form.review_date ?? ''} onChange={e => set('review_date', e.target.value)} /></FormField>
            <FormField label="Notes" span={2}><Textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></FormField>
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

// ─── Personnel ───────────────────────────────────────────────────
const PERS_EMPTY = { employee_name: '', employee_id: '', email: '', department: '', role: '', nationality: '', citizenship: '', is_us_person: true, clearance_level: 'none', training_completed: false, training_date: '', training_expiry: '', status: 'active', notes: '' };

function Personnel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(PERS_EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['ec-personnel'], queryFn: () => base44.entities.ExportControlPersonnel.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-personnel'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.ExportControlPersonnel.update(editing.id, d) : base44.entities.ExportControlPersonnel.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.ExportControlPersonnel.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(PERS_EMPTY); setOpen(true); };

  const today = new Date();
  const trainingExpired = p => p.training_expiry && new Date(p.training_expiry) < today;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Personnel</Button></div>
      <TableShell
        cols={['Name', 'Dept', 'US Person', 'Clearance', 'Training', 'Expiry', 'Status', '']}
        empty="No personnel records."
        rows={items.map(p => (
          <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${trainingExpired(p) ? 'bg-red-50/40' : ''}`}>
            <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{p.employee_name}</p><p className="text-xs text-gray-400">{p.role}</p></td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.department || '—'}</td>
            <td className="px-4 py-3">{p.is_us_person ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Yes</span> : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">No</span>}</td>
            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{p.clearance_level?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3">{p.training_completed ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Complete</span> : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.training_expiry || '—'}{trainingExpired(p) && <span className="ml-1 text-xs text-red-600 font-medium">Expired</span>}</td>
            <td className="px-4 py-3"><Badge value={p.status} map={STATUS_COLORS} /></td>
            <td className="px-4 py-3 flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </td>
          </tr>
        ))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Personnel' : 'Add Personnel'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Full Name" span={2}><Input value={form.employee_name} onChange={e => set('employee_name', e.target.value)} /></FormField>
            <FormField label="Employee ID"><Input value={form.employee_id ?? ''} onChange={e => set('employee_id', e.target.value)} /></FormField>
            <FormField label="Email"><Input value={form.email ?? ''} onChange={e => set('email', e.target.value)} /></FormField>
            <FormField label="Department"><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></FormField>
            <FormField label="Role"><Input value={form.role ?? ''} onChange={e => set('role', e.target.value)} /></FormField>
            <FormField label="Nationality"><Input value={form.nationality ?? ''} onChange={e => set('nationality', e.target.value)} /></FormField>
            <FormField label="Citizenship"><Input value={form.citizenship ?? ''} onChange={e => set('citizenship', e.target.value)} /></FormField>
            <FormField label="Clearance Level">
              <Select value={form.clearance_level} onValueChange={v => set('clearance_level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['none', 'confidential', 'secret', 'top_secret'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['active', 'inactive', 'pending_review'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Training Date"><Input type="date" value={form.training_date ?? ''} onChange={e => set('training_date', e.target.value)} /></FormField>
            <FormField label="Training Expiry"><Input type="date" value={form.training_expiry ?? ''} onChange={e => set('training_expiry', e.target.value)} /></FormField>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!form.is_us_person} onChange={e => set('is_us_person', e.target.checked)} /> US Person</label>
              <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!form.training_completed} onChange={e => set('training_completed', e.target.checked)} /> Training Completed</label>
            </div>
            <FormField label="Notes" span={2}><Textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></FormField>
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

// ─── Deemed Exports ──────────────────────────────────────────────
const DE_EMPTY = { title: '', description: '', technology_item: '', eccn: '', recipient_name: '', recipient_nationality: '', department: '', disclosure_type: 'electronic', license_required: false, license_number: '', license_exception: '', status: 'pending_review', reviewed_by: '', review_date: '', incident_date: '', notes: '' };

function DeemedExports() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DE_EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['ec-deemed'], queryFn: () => base44.entities.DeemedExport.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-deemed'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.DeemedExport.update(editing.id, d) : base44.entities.DeemedExport.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.DeemedExport.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(DE_EMPTY); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Deemed Export</Button></div>
      <TableShell
        cols={['Title', 'Technology', 'ECCN', 'Recipient', 'Nationality', 'Disclosure', 'License Req.', 'Status', '']}
        empty="No deemed export records."
        rows={items.map(i => (
          <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.title}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.technology_item || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.eccn || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.recipient_name}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.recipient_nationality || '—'}</td>
            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.disclosure_type}</td>
            <td className="px-4 py-3">{i.license_required ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Required</span> : <span className="text-xs text-gray-400">No</span>}</td>
            <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
            <td className="px-4 py-3 flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
            </td>
          </tr>
        ))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Deemed Export' : 'New Deemed Export'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Title" span={2}><Input value={form.title} onChange={e => set('title', e.target.value)} /></FormField>
            <FormField label="Description" span={2}><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
            <FormField label="Technology Item"><Input value={form.technology_item ?? ''} onChange={e => set('technology_item', e.target.value)} /></FormField>
            <FormField label="ECCN"><Input value={form.eccn ?? ''} onChange={e => set('eccn', e.target.value)} /></FormField>
            <FormField label="Recipient Name"><Input value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} /></FormField>
            <FormField label="Recipient Nationality"><Input value={form.recipient_nationality ?? ''} onChange={e => set('recipient_nationality', e.target.value)} /></FormField>
            <FormField label="Department"><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></FormField>
            <FormField label="Disclosure Type">
              <Select value={form.disclosure_type} onValueChange={v => set('disclosure_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['verbal', 'written', 'visual', 'electronic', 'other'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['pending_review', 'approved', 'denied', 'license_required', 'exempt'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Incident Date"><Input type="date" value={form.incident_date ?? ''} onChange={e => set('incident_date', e.target.value)} /></FormField>
            <FormField label="Review Date"><Input type="date" value={form.review_date ?? ''} onChange={e => set('review_date', e.target.value)} /></FormField>
            <FormField label="Reviewed By"><Input value={form.reviewed_by ?? ''} onChange={e => set('reviewed_by', e.target.value)} /></FormField>
            <FormField label="License Number"><Input value={form.license_number ?? ''} onChange={e => set('license_number', e.target.value)} /></FormField>
            <FormField label="License Exception"><Input value={form.license_exception ?? ''} onChange={e => set('license_exception', e.target.value)} /></FormField>
            <div className="col-span-2"><label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!form.license_required} onChange={e => set('license_required', e.target.checked)} /> License Required</label></div>
            <FormField label="Notes" span={2}><Textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></FormField>
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

// ─── Violations ──────────────────────────────────────────────────
const VIO_EMPTY = { title: '', description: '', violation_type: 'other', regulation: 'EAR', severity: 'moderate', status: 'open', reported_by: '', assigned_to: '', violation_date: '', discovery_date: '', resolution_date: '', voluntary_disclosure: false, department: '', remediation_plan: '', notes: '' };

function Violations() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(VIO_EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['ec-violations'], queryFn: () => base44.entities.ExportViolation.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-violations'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.ExportViolation.update(editing.id, d) : base44.entities.ExportViolation.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.ExportViolation.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(VIO_EMPTY); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Report Violation</Button></div>
      <TableShell
        cols={['Title', 'Type', 'Regulation', 'Severity', 'Dept', 'Violation Date', 'Voluntary', 'Status', '']}
        empty="No violations recorded."
        rows={items.map(i => (
          <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.title}</td>
            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.violation_type?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.regulation}</td>
            <td className="px-4 py-3"><Badge value={i.severity} map={SEV_COLORS} /></td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.department || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.violation_date || '—'}</td>
            <td className="px-4 py-3">{i.voluntary_disclosure ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Yes</span> : <span className="text-xs text-gray-400">No</span>}</td>
            <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
            <td className="px-4 py-3 flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
            </td>
          </tr>
        ))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Violation' : 'Report Violation'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Title" span={2}><Input value={form.title} onChange={e => set('title', e.target.value)} /></FormField>
            <FormField label="Description" span={2}><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
            <FormField label="Violation Type">
              <Select value={form.violation_type} onValueChange={v => set('violation_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['unauthorized_export', 'unlicensed_transfer', 'false_statement', 'recordkeeping', 'sanctions', 'deemed_export', 'other'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Regulation">
              <Select value={form.regulation} onValueChange={v => set('regulation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['EAR', 'ITAR', 'OFAC', 'FCPA', 'other'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Severity">
              <Select value={form.severity} onValueChange={v => set('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['minor', 'moderate', 'major', 'critical'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['open', 'under_investigation', 'reported_to_authorities', 'remediated', 'closed'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Department"><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></FormField>
            <FormField label="Reported By"><Input value={form.reported_by ?? ''} onChange={e => set('reported_by', e.target.value)} /></FormField>
            <FormField label="Assigned To"><Input value={form.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value)} /></FormField>
            <FormField label="Violation Date"><Input type="date" value={form.violation_date ?? ''} onChange={e => set('violation_date', e.target.value)} /></FormField>
            <FormField label="Discovery Date"><Input type="date" value={form.discovery_date ?? ''} onChange={e => set('discovery_date', e.target.value)} /></FormField>
            <FormField label="Resolution Date"><Input type="date" value={form.resolution_date ?? ''} onChange={e => set('resolution_date', e.target.value)} /></FormField>
            <div className="col-span-2"><label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!form.voluntary_disclosure} onChange={e => set('voluntary_disclosure', e.target.checked)} /> Voluntary Disclosure</label></div>
            <FormField label="Remediation Plan" span={2}><Textarea rows={2} value={form.remediation_plan ?? ''} onChange={e => set('remediation_plan', e.target.value)} /></FormField>
            <FormField label="Notes" span={2}><Textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></FormField>
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

// ─── Alerts ──────────────────────────────────────────────────────
const ALERT_EMPTY = { title: '', description: '', alert_type: 'other', severity: 'warning', status: 'open', assigned_to: '', due_date: '', notes: '' };

function Alerts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(ALERT_EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['ec-alerts'], queryFn: () => base44.entities.ExportControlAlert.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-alerts'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.ExportControlAlert.update(editing.id, d) : base44.entities.ExportControlAlert.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.ExportControlAlert.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(ALERT_EMPTY); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Alert</Button></div>
      <TableShell
        cols={['Title', 'Type', 'Severity', 'Assigned To', 'Due Date', 'Status', '']}
        empty="No alerts."
        rows={items.map(i => (
          <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.title}</td>
            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.alert_type?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3"><Badge value={i.severity} map={SEV_COLORS} /></td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.assigned_to || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.due_date || '—'}</td>
            <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
            <td className="px-4 py-3 flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
            </td>
          </tr>
        ))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Alert' : 'New Alert'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Title" span={2}><Input value={form.title} onChange={e => set('title', e.target.value)} /></FormField>
            <FormField label="Description" span={2}><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
            <FormField label="Alert Type">
              <Select value={form.alert_type} onValueChange={v => set('alert_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['license_expiry', 'training_expiry', 'sanctions_match', 'shipment_flag', 'personnel_change', 'regulation_update', 'other'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Severity">
              <Select value={form.severity} onValueChange={v => set('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['info', 'warning', 'critical'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['open', 'acknowledged', 'resolved'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Assigned To"><Input value={form.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value)} /></FormField>
            <FormField label="Due Date"><Input type="date" value={form.due_date ?? ''} onChange={e => set('due_date', e.target.value)} /></FormField>
            <FormField label="Notes" span={2}><Textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} /></FormField>
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

// ─── Audits (reuses ComplianceAudit) ─────────────────────────────
const AUD_EMPTY = { title: '', description: '', audit_type: 'internal', scope: '', status: 'planned', auditor_name: '', department: '', start_date: '', end_date: '', findings: '', recommendations: '', risk_rating: 'medium', follow_up_date: '', file_url: '' };
const AUD_STATUS = { planned: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-600' };

function AuditsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(AUD_EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['ec-audits'], queryFn: () => base44.entities.ComplianceAudit.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-audits'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.ComplianceAudit.update(editing.id, d) : base44.entities.ComplianceAudit.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.ComplianceAudit.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(AUD_EMPTY); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Audit</Button></div>
      <TableShell
        cols={['Title', 'Type', 'Auditor', 'Dept', 'Start', 'End', 'Risk', 'Status', '']}
        empty="No audits."
        rows={items.map(i => (
          <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.title}</td>
            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{i.audit_type?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.auditor_name || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.department || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.start_date || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.end_date || '—'}</td>
            <td className="px-4 py-3"><Badge value={i.risk_rating} map={RISK_COLORS} /></td>
            <td className="px-4 py-3"><Badge value={i.status} map={AUD_STATUS} /></td>
            <td className="px-4 py-3 flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
            </td>
          </tr>
        ))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Audit' : 'New Audit'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Title" span={2}><Input value={form.title} onChange={e => set('title', e.target.value)} /></FormField>
            <FormField label="Scope" span={2}><Textarea rows={2} value={form.scope} onChange={e => set('scope', e.target.value)} /></FormField>
            <FormField label="Audit Type">
              <Select value={form.audit_type} onValueChange={v => set('audit_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['internal', 'external', 'regulatory', 'third_party'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['planned', 'in_progress', 'completed', 'cancelled'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Risk Rating">
              <Select value={form.risk_rating} onValueChange={v => set('risk_rating', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high', 'critical'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Auditor"><Input value={form.auditor_name ?? ''} onChange={e => set('auditor_name', e.target.value)} /></FormField>
            <FormField label="Department"><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></FormField>
            <FormField label="Start Date"><Input type="date" value={form.start_date ?? ''} onChange={e => set('start_date', e.target.value)} /></FormField>
            <FormField label="End Date"><Input type="date" value={form.end_date ?? ''} onChange={e => set('end_date', e.target.value)} /></FormField>
            <FormField label="Follow-up Date"><Input type="date" value={form.follow_up_date ?? ''} onChange={e => set('follow_up_date', e.target.value)} /></FormField>
            <FormField label="Findings" span={2}><Textarea rows={2} value={form.findings ?? ''} onChange={e => set('findings', e.target.value)} /></FormField>
            <FormField label="Recommendations" span={2}><Textarea rows={2} value={form.recommendations ?? ''} onChange={e => set('recommendations', e.target.value)} /></FormField>
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

// ─── Tech Control Plans ──────────────────────────────────────────
const TCP_EMPTY = { title: '', description: '', program_name: '', version: '1.0', owner_name: '', department: '', regulation: 'EAR', classification: '', status: 'draft', effective_date: '', expiry_date: '', review_date: '', approved_by: '', approved_date: '', file_url: '', controls: '', notes: '' };

function TechControlPlans() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(TCP_EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ['ec-tcp'], queryFn: () => base44.entities.TechControlPlan.list('-created_date') });
  const inv = () => qc.invalidateQueries({ queryKey: ['ec-tcp'] });
  const save = useMutation({ mutationFn: d => editing ? base44.entities.TechControlPlan.update(editing.id, d) : base44.entities.TechControlPlan.create(d), onSuccess: () => { inv(); setOpen(false); } });
  const del = useMutation({ mutationFn: id => base44.entities.TechControlPlan.delete(id), onSuccess: inv });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = p => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const openCreate = () => { setEditing(null); setForm(TCP_EMPTY); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Tech Control Plan</Button></div>
      <TableShell
        cols={['Title', 'Program', 'Regulation', 'Classification', 'Version', 'Owner', 'Effective', 'Expiry', 'Status', '']}
        empty="No tech control plans."
        rows={items.map(i => (
          <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.title}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.program_name || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.regulation}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.classification || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.version || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.owner_name || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.effective_date || '—'}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.expiry_date || '—'}</td>
            <td className="px-4 py-3"><Badge value={i.status} map={STATUS_COLORS} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                {i.file_url && <a href={i.file_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>}
                <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="text-red-500" onClick={() => del.mutate(i.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </td>
          </tr>
        ))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Tech Control Plan' : 'New Tech Control Plan'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Title" span={2}><Input value={form.title} onChange={e => set('title', e.target.value)} /></FormField>
            <FormField label="Description" span={2}><Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
            <FormField label="Program Name"><Input value={form.program_name ?? ''} onChange={e => set('program_name', e.target.value)} /></FormField>
            <FormField label="Version"><Input value={form.version ?? ''} onChange={e => set('version', e.target.value)} /></FormField>
            <FormField label="Regulation">
              <Select value={form.regulation} onValueChange={v => set('regulation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['EAR', 'ITAR', 'both', 'other'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['draft', 'active', 'under_review', 'archived'].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Classification (ECCN)"><Input value={form.classification ?? ''} onChange={e => set('classification', e.target.value)} placeholder="e.g. EAR99, 5E002" /></FormField>
            <FormField label="Owner"><Input value={form.owner_name ?? ''} onChange={e => set('owner_name', e.target.value)} /></FormField>
            <FormField label="Department"><Input value={form.department ?? ''} onChange={e => set('department', e.target.value)} /></FormField>
            <FormField label="Effective Date"><Input type="date" value={form.effective_date ?? ''} onChange={e => set('effective_date', e.target.value)} /></FormField>
            <FormField label="Expiry Date"><Input type="date" value={form.expiry_date ?? ''} onChange={e => set('expiry_date', e.target.value)} /></FormField>
            <FormField label="Review Date"><Input type="date" value={form.review_date ?? ''} onChange={e => set('review_date', e.target.value)} /></FormField>
            <FormField label="Approved By"><Input value={form.approved_by ?? ''} onChange={e => set('approved_by', e.target.value)} /></FormField>
            <FormField label="Approved Date"><Input type="date" value={form.approved_date ?? ''} onChange={e => set('approved_date', e.target.value)} /></FormField>
            <FormField label="File URL" span={2}><Input value={form.file_url ?? ''} onChange={e => set('file_url', e.target.value)} placeholder="https://…" /></FormField>
            <FormField label="Controls / Restrictions" span={2}><Textarea rows={3} value={form.controls ?? ''} onChange={e => set('controls', e.target.value)} /></FormField>
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

// ─── Main Page ───────────────────────────────────────────────────
export default function ExportControl() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-blue-600" /> Export Control
      </h1>

      <Tabs defaultValue="programs">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="deemed">Deemed Exports</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="tcp">Tech Control Plans</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="programs"><Programs /></TabsContent>
          <TabsContent value="personnel"><Personnel /></TabsContent>
          <TabsContent value="deemed"><DeemedExports /></TabsContent>
          <TabsContent value="violations"><Violations /></TabsContent>
          <TabsContent value="alerts"><Alerts /></TabsContent>
          <TabsContent value="audits"><AuditsTab /></TabsContent>
          <TabsContent value="tcp"><TechControlPlans /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}