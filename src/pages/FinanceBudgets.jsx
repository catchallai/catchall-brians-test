import { useState, useMemo } from 'react';
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
import { Plus, BarChart3, AlertTriangle, Pencil, Trash2, List, LayoutGrid } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;

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

const CATEGORY_COLORS = {
  operating: '#6366f1', capital: '#f59e0b', payroll: '#7c3aed',
  marketing: '#06b6d4', rd: '#10b981', other: '#94a3b8',
};

const emptyBudget = {
  name: '', fiscal_year: new Date().getFullYear(), period: 'annual',
  category: 'operating', status: 'draft', total_budgeted: '',
  total_spent: 0, owner_name: '', department: '', notes: '',
};

export default function FinanceBudgets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // cards | table
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

  const filtered = useMemo(() => budgets.filter(b => {
    const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.department?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchCat = filterCategory === 'all' || b.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  }), [budgets, search, filterStatus, filterCategory]);

  const totalBudgeted = filtered.reduce((s, b) => s + (b.total_budgeted || 0), 0);
  const totalSpent = filtered.reduce((s, b) => s + (b.total_spent || 0), 0);
  const overBudgetCount = filtered.filter(b => (b.total_spent || 0) > (b.total_budgeted || 0)).length;

  // Category rollup chart
  const categoryChart = useMemo(() => {
    const map = {};
    budgets.filter(b => ['active','approved'].includes(b.status)).forEach(b => {
      const cat = b.category || 'other';
      if (!map[cat]) map[cat] = { cat, Budgeted: 0, Spent: 0 };
      map[cat].Budgeted += b.total_budgeted || 0;
      map[cat].Spent += b.total_spent || 0;
    });
    return Object.values(map).map(r => ({ ...r, name: CATEGORY_LABELS[r.cat] || r.cat }));
  }, [budgets]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Budget Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage departmental & company-wide budgets</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />New Budget
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Budgeted', value: fmt(totalBudgeted) },
          { label: 'Total Spent', value: fmt(totalSpent), color: totalSpent > totalBudgeted ? 'text-red-600' : 'text-gray-900 dark:text-white' },
          { label: 'Remaining', value: fmt(totalBudgeted - totalSpent), color: (totalBudgeted - totalSpent) < 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Over Budget', value: overBudgetCount, color: overBudgetCount > 0 ? 'text-red-600' : 'text-emerald-600', suffix: 'budgets' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color || 'text-gray-900 dark:text-white'}`}>
                {k.value}{k.suffix ? ' ' + k.suffix : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Chart */}
      {categoryChart.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Budgeted vs Spent by Category (Active)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryChart} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="Budgeted" fill="#c4b5fd" radius={[3,3,0,0]} />
                <Bar dataKey="Spent" fill="#7c3aed" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Input placeholder="Search budgets..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')}><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Content */}
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
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const pct = b.total_budgeted > 0 ? Math.min(100, ((b.total_spent || 0) / b.total_budgeted) * 100) : 0;
            const over = pct >= 90;
            const remaining = (b.total_budgeted || 0) - (b.total_spent || 0);
            const catColor = CATEGORY_COLORS[b.category] || '#94a3b8';
            return (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{b.name}</p>
                      </div>
                      <p className="text-xs text-gray-400 pl-4">
                        {CATEGORY_LABELS[b.category] || b.category} · FY{b.fiscal_year} · {b.period?.toUpperCase()}
                        {b.department && ` · ${b.department}`}
                      </p>
                    </div>
                    <Badge className={`${STATUS_COLORS[b.status]} border-0 ml-2 flex-shrink-0`}>{b.status}</Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">{fmt(b.total_spent || 0)} spent</span>
                      <span className={over ? 'text-red-500 font-semibold' : 'text-gray-500'}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : over ? 'bg-amber-500' : 'bg-emerald-500'}`}
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
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1 mb-3">
                      <AlertTriangle className="w-3 h-3" />
                      {pct >= 100 ? 'Over budget!' : 'Approaching budget limit'}
                    </div>
                  )}

                  {b.owner_name && <p className="text-xs text-gray-400 mb-3">Owner: {b.owner_name}</p>}

                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
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
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Budget','Category','Period','Owner','Dept','Budgeted','Spent','Remaining','Util.','Status',''].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(b => {
                  const pct = b.total_budgeted > 0 ? Math.min(100, ((b.total_spent || 0) / b.total_budgeted) * 100) : 0;
                  const remaining = (b.total_budgeted || 0) - (b.total_spent || 0);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white max-w-[160px] truncate">{b.name}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{CATEGORY_LABELS[b.category] || b.category}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs uppercase">{b.period}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[100px] truncate">{b.owner_name || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{b.department || '—'}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">{fmt(b.total_budgeted)}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{fmt(b.total_spent || 0)}</td>
                      <td className={`px-3 py-2.5 font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(remaining)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${STATUS_COLORS[b.status]} border-0 text-xs`}>{b.status}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(b)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                            onClick={() => confirm('Delete?') && deleteMutation.mutate(b.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner Name</Label>
                <Input value={form.owner_name} onChange={e => setForm(f => ({...f, owner_name: e.target.value}))} placeholder="Finance Manager" />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} placeholder="e.g. Marketing" />
              </div>
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