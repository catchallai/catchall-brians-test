import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const EMPTY = {
  grant_id: '', employee_name: '', exercise_date: '', shares_exercised: '',
  strike_price: '', fmv_at_exercise: '', total_cost: '', gain: '',
  exercise_type: 'cash', status: 'pending', notes: '',
};

export default function EquityExercisesTab({ exercises, grants }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['equity-exercises'] });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing ? base44.entities.EquityExercise.update(editing.id, data) : base44.entities.EquityExercise.create(data),
    onSuccess: () => { invalidate(); setOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EquityExercise.delete(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e }); setOpen(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const autoCalc = () => {
    const cost = (Number(form.shares_exercised) || 0) * (Number(form.strike_price) || 0);
    const gain = (Number(form.shares_exercised) || 0) * ((Number(form.fmv_at_exercise) || 0) - (Number(form.strike_price) || 0));
    setForm((f) => ({ ...f, total_cost: cost.toFixed(2), gain: gain.toFixed(2) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Log Exercise</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              {['Employee', 'Date', 'Shares', 'Strike', 'FMV', 'Cost', 'Gain', 'Type', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {exercises.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No exercises recorded.</td></tr>
            )}
            {exercises.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.employee_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.exercise_date || '—'}</td>
                <td className="px-4 py-3">{Number(e.shares_exercised || 0).toLocaleString()}</td>
                <td className="px-4 py-3">${Number(e.strike_price || 0).toFixed(2)}</td>
                <td className="px-4 py-3">${Number(e.fmv_at_exercise || 0).toFixed(2)}</td>
                <td className="px-4 py-3">${Number(e.total_cost || 0).toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-green-600">${Number(e.gain || 0).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{e.exercise_type?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-700'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(e.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Exercise' : 'Log Exercise'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Employee Name</Label>
              <Input value={form.employee_name} onChange={(e) => set('employee_name', e.target.value)} />
            </div>
            {[
              ['Exercise Date', 'exercise_date', 'date'],
              ['Shares Exercised', 'shares_exercised', 'number'],
              ['Strike Price ($)', 'strike_price', 'number'],
              ['FMV at Exercise ($)', 'fmv_at_exercise', 'number'],
              ['Total Cost ($)', 'total_cost', 'number'],
              ['Gain ($)', 'gain', 'number'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <Input type={type} value={form[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
            <div className="col-span-2">
              <Button variant="outline" size="sm" onClick={autoCalc} type="button">Auto-calculate Cost & Gain</Button>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Exercise Type</Label>
              <Select value={form.exercise_type} onValueChange={(v) => set('exercise_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['cash', 'cashless', 'net_exercise'].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'completed', 'cancelled'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
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