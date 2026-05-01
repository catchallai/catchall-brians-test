import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const SHARE_CLASSES = ['common', 'preferred_a', 'preferred_b', 'preferred_c', 'other'];

const EMPTY = {
  name: '', total_shares: '', shares_granted: 0, shares_reserved: 0,
  share_class: 'common', effective_date: '', notes: '', is_active: true,
};

export default function EquityPoolTab({ pools, grants }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['equity-pools'] });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing ? base44.entities.EquityPool.update(editing.id, data) : base44.entities.EquityPool.create(data),
    onSuccess: () => { invalidate(); setOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EquityPool.delete(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Pool</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pools.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">No equity pools defined.</div>
        )}
        {pools.map((p) => {
          const total = p.total_shares || 0;
          const granted = p.shares_granted || 0;
          const reserved = p.shares_reserved || 0;
          const available = total - granted - reserved;
          const usedPct = total > 0 ? Math.round(((granted + reserved) / total) * 100) : 0;

          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">{p.share_class?.replace(/_/g, ' ')} · {p.effective_date}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{total.toLocaleString()}</p>
                    <p className="text-gray-400">Total</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{granted.toLocaleString()}</p>
                    <p className="text-gray-400">Granted</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-600">{available.toLocaleString()}</p>
                    <p className="text-gray-400">Available</p>
                  </div>
                </div>
                <Progress value={usedPct} className="h-2" />
                <p className="text-xs text-gray-400 text-right">{usedPct}% allocated</p>
                {p.notes && <p className="text-xs text-gray-500 italic">{p.notes}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Pool' : 'New Equity Pool'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Pool Name</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            {[
              ['Total Shares', 'total_shares', 'number'],
              ['Shares Granted', 'shares_granted', 'number'],
              ['Shares Reserved', 'shares_reserved', 'number'],
              ['Effective Date', 'effective_date', 'date'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <Input type={type} value={form[key] ?? ''} onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
              </div>
            ))}
            <div>
              <Label className="text-xs mb-1 block">Share Class</Label>
              <Select value={form.share_class} onValueChange={(v) => set('share_class', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SHARE_CLASSES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
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