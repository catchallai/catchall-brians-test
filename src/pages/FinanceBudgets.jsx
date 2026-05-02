import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BarChart3, AlertTriangle, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
};

const CATEGORY_LABELS = {
  operating: 'Operating', capital: 'Capital', payroll: 'Payroll',
  marketing: 'Marketing', rd: 'R&D', other: 'Other',
};

const emptyBudget = {
  name: '', fiscal_year: new Date().getFullYear(), period: 'annual',
  category: 'operating', status: 'draft', total_budgeted: '',
  total_spent: 0, owner_name: '', notes: '',
};

export default function FinanceBudgets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyBudget);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['finance-budgets'],
    queryFn: () => base44.entities.FinanceBudget.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.FinanceBudget.update(editing.id, data)
      : base44.entities.FinanceBudget.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-budgets'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinanceBudget.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-budgets'] }),
  });

  const openCreate = () => { setEditing(null); setForm(emptyBudget); setModalOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ ...b }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = () => {
    saveMutation.mutate({ ...form, total_budgeted: Number(form.total_budgeted), total_spent: Number(form.total_spent || 0) });
  };

  const filtered = budgets.filter(b => {
    const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalBudgeted = filtered.reduce((s, b) => s + (b.total_budgeted || 0), 0);
  const totalSpent = filtered.reduce((s, b) => s + (b.total_spent || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Budget Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage departmental budgets</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />New Budget
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Budgeted', value: fmt(totalBudgeted), color: 'blue' },
          { label: 'Total Spent', value: fmt(totalSpent), color: 'red' },
          { label: 'Remaining', value: fmt(totalBudgeted - totalSpent), color: 'emerald' },
          { label: 'Utilization', value: totalBudgeted > 0 ? ((totalSpent/totalBudgeted)*100).toFixed(0)+'%' : '0%', color: 'violet' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search budgets..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Budget Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading budgets...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-500">No budgets found</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={openCreate}>Create your first budget</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const pct = b.total_budgeted > 0 ? Math.min(100, ((b.total_spent || 0) / b.total_budgeted) * 100) : 0;
            const over = pct >= 90;
            const remaining = (b.total_budgeted || 0) - (b.total_spent || 0);
            return (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{b.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {CATEGORY_LABELS[b.category] || b.category} · FY{b.fiscal_year} · {b.period?.toUpperCase()}
                      </p>
                    </div>
                    <Badge className={`${STATUS_COLORS[b.status]} border-0 ml-2`}>{b.status}</Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Spent: {fmt(b.total_spent || 0)}</span>
                      <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${over ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={remaining >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                        {remaining >= 0 ? fmt(remaining) + ' remaining' : fmt(Math.abs(remaining)) + ' over budget'}
                      </span>
                      <span className="text-gray-400">of {fmt(b.total_budgeted)}</span>
                    </div>
                  </div>

                  {over && (
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-3">
                      <AlertTriangle className="w-3 h-3" />
                      {pct >= 100 ? 'Over budget!' : 'Approaching limit'}
                    </div>
                  )}

                  {b.owner_name && <p className="text-xs text-gray-400 mb-3">Owner: {b.owner_name}</p>}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(b)}>
                      <Pencil className="w-3 h-3 mr-1" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => confirm('Delete this budget?') && deleteMutation.mutate(b.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Budget' : 'New Budget'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Budget Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Q2 2026 Marketing" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fiscal Year</Label>
                <Input type="number" value={form.fiscal_year} onChange={e => setForm(f => ({...f, fiscal_year: Number(e.target.value)}))} />
              </div>
              <div>
                <Label>Period</Label>
                <Select value={form.period} onValueChange={v => setForm(f => ({...f, period: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['annual','q1','q2','q3','q4','monthly'].map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total Budgeted ($) *</Label>
                <Input type="number" value={form.total_budgeted} onChange={e => setForm(f => ({...f, total_budgeted: e.target.value}))} placeholder="50000" />
              </div>
              <div>
                <Label>Total Spent ($)</Label>
                <Input type="number" value={form.total_spent} onChange={e => setForm(f => ({...f, total_spent: e.target.value}))} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input value={form.owner_name} onChange={e => setForm(f => ({...f, owner_name: e.target.value}))} placeholder="Finance Manager" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleSave} disabled={saveMutation.isPending || !form.name || !form.total_budgeted}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Budget'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}