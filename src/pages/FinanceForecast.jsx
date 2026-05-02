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
import { TrendingUp, Plus, Pencil, Trash2, Target } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(0)}k`;

const emptyForecast = {
  name: '', fiscal_year: new Date().getFullYear(), period: 'annual',
  status: 'draft', created_by_name: '',
  revenue_forecast: '', expense_forecast: '', payroll_forecast: '',
  ebitda_forecast: '', assumptions: '', notes: '',
};

export default function FinanceForecast() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForecast);

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ['finance-forecasts'],
    queryFn: () => base44.entities.FinanceForecast.list('-fiscal_year'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.FinanceForecast.update(editing.id, data)
      : base44.entities.FinanceForecast.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-forecasts'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinanceForecast.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-forecasts'] }),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForecast); setModalOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm({ ...f }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      fiscal_year: Number(form.fiscal_year),
      revenue_forecast: Number(form.revenue_forecast) || 0,
      expense_forecast: Number(form.expense_forecast) || 0,
      payroll_forecast: Number(form.payroll_forecast) || 0,
      ebitda_forecast: Number(form.ebitda_forecast) || 0,
    });
  };

  // Chart comparing forecasts
  const chartData = forecasts.map(fc => ({
    name: `${fc.period?.toUpperCase()} ${fc.fiscal_year}`,
    Revenue: fc.revenue_forecast || 0,
    Expenses: (fc.expense_forecast || 0) + (fc.payroll_forecast || 0),
    EBITDA: fc.ebitda_forecast || 0,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Financial Forecasts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Forward-looking financial projections</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />New Forecast
        </Button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Forecast Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="Revenue" fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="EBITDA" fill="#6366f1" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Forecast Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading forecasts...</div>
      ) : forecasts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-500">No forecasts yet</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>Create first forecast</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forecasts.map((fc) => {
            const totalExp = (fc.expense_forecast || 0) + (fc.payroll_forecast || 0);
            const ebitda = fc.ebitda_forecast || (fc.revenue_forecast - totalExp);
            const margin = fc.revenue_forecast > 0 ? ((ebitda / fc.revenue_forecast) * 100).toFixed(1) : '0';
            return (
              <Card key={fc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{fc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">FY{fc.fiscal_year} · {fc.period?.toUpperCase()}</p>
                    </div>
                    <Badge className={`border-0 ${fc.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {fc.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Revenue', value: fc.revenue_forecast, color: 'text-emerald-600' },
                      { label: 'Operating Expenses', value: fc.expense_forecast, color: 'text-red-500' },
                      { label: 'Payroll', value: fc.payroll_forecast, color: 'text-violet-600' },
                      { label: 'EBITDA', value: ebitda, color: ebitda >= 0 ? 'text-blue-600' : 'text-red-600' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500">{row.label}</span>
                        <span className={`font-semibold ${row.color}`}>{fmt(row.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-500 font-medium">Net Margin</span>
                      <span className={`font-bold ${ebitda >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{margin}%</span>
                    </div>
                  </div>

                  {fc.assumptions && (
                    <p className="text-xs text-gray-400 mt-3 italic line-clamp-2">{fc.assumptions}</p>
                  )}

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(fc)}>
                      <Pencil className="w-3 h-3 mr-1" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => confirm('Delete forecast?') && deleteMutation.mutate(fc.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Forecast' : 'New Forecast'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Forecast Name *</Label>
              <Input value={form.name} onChange={f('name')} placeholder="e.g. FY2026 Annual Forecast" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Fiscal Year</Label>
                <Input type="number" value={form.fiscal_year} onChange={f('fiscal_year')} />
              </div>
              <div>
                <Label>Period</Label>
                <Select value={form.period} onValueChange={v => setForm(p => ({...p, period: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['annual','q1','q2','q3','q4'].map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Revenue Forecast ($)</Label>
                <Input type="number" value={form.revenue_forecast} onChange={f('revenue_forecast')} placeholder="0" />
              </div>
              <div>
                <Label>Expense Forecast ($)</Label>
                <Input type="number" value={form.expense_forecast} onChange={f('expense_forecast')} placeholder="0" />
              </div>
              <div>
                <Label>Payroll Forecast ($)</Label>
                <Input type="number" value={form.payroll_forecast} onChange={f('payroll_forecast')} placeholder="0" />
              </div>
              <div>
                <Label>EBITDA Forecast ($)</Label>
                <Input type="number" value={form.ebitda_forecast} onChange={f('ebitda_forecast')} placeholder="Auto-calc if blank" />
              </div>
            </div>
            <div>
              <Label>Key Assumptions</Label>
              <Textarea value={form.assumptions} onChange={f('assumptions')} rows={2} placeholder="e.g. 10% YoY growth, 5 new hires..." />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={f('notes')} rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saveMutation.isPending || !form.name}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Forecast'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}