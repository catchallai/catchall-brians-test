import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  fully_vested: 'bg-blue-100 text-blue-700',
  partially_exercised: 'bg-yellow-100 text-yellow-700',
  fully_exercised: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};

const GRANT_TYPES = ['iso', 'nso', 'rsu', 'sar', 'warrant'];
const VESTING_SCHEDULES = ['4yr_1yr_cliff', '3yr_monthly', '4yr_monthly', 'immediate', 'custom'];

const EMPTY = {
  employee_name: '', employee_email: '', department: '',
  grant_type: 'rsu', grant_date: '', shares_granted: '',
  strike_price: '', current_price: '', vesting_schedule: '4yr_1yr_cliff',
  vesting_start_date: '', cliff_months: 12, vesting_months: 48,
  shares_vested: 0, shares_exercised: 0, expiry_date: '',
  status: 'active', notes: '',
};

export default function EquityGrantsTab({ grants }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['equity-grants'] });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? base44.entities.EquityGrant.update(editing.id, data)
        : base44.entities.EquityGrant.create(data),
    onSuccess: () => { invalidate(); setOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EquityGrant.delete(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (g) => { setEditing(g); setForm({ ...g }); setOpen(true); };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = grants.filter((g) =>
    `${g.employee_name} ${g.department} ${g.grant_type}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search grants…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Grant</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase">
            <tr>
              {['Employee', 'Type', 'Grant Date', 'Shares', 'Vested', 'Exercised', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No grants found.</td></tr>
            )}
            {filtered.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{g.employee_name || '—'}</p>
                  <p className="text-xs text-gray-400">{g.department}</p>
                </td>
                <td className="px-4 py-3 uppercase font-semibold text-gray-700 dark:text-gray-300">{g.grant_type}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{g.grant_date || '—'}</td>
                <td className="px-4 py-3">{Number(g.shares_granted || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{Number(g.shares_vested || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{Number(g.shares_exercised || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-700'}`}>
                    {g.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(g)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(g.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Grant' : 'New Equity Grant'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              ['Employee Name', 'employee_name', 'text'],
              ['Employee Email', 'employee_email', 'email'],
              ['Department', 'department', 'text'],
              ['Grant Date', 'grant_date', 'date'],
              ['Shares Granted', 'shares_granted', 'number'],
              ['Strike Price ($)', 'strike_price', 'number'],
              ['Current Price ($)', 'current_price', 'number'],
              ['Vesting Start', 'vesting_start_date', 'date'],
              ['Cliff (months)', 'cliff_months', 'number'],
              ['Vesting (months)', 'vesting_months', 'number'],
              ['Shares Vested', 'shares_vested', 'number'],
              ['Shares Exercised', 'shares_exercised', 'number'],
              ['Expiry Date', 'expiry_date', 'date'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <Input type={type} value={form[key] ?? ''} onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
              </div>
            ))}
            <div>
              <Label className="text-xs mb-1 block">Grant Type</Label>
              <Select value={form.grant_type} onValueChange={(v) => set('grant_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRANT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Vesting Schedule</Label>
              <Select value={form.vesting_schedule} onValueChange={(v) => set('vesting_schedule', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VESTING_SCHEDULES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATUS_COLORS).map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Notes</Label>
              <Input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}