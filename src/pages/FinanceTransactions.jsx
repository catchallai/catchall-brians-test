import { useState, useMemo, useCallback } from 'react';
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
import { Plus, ArrowUpRight, Pencil, Trash2, Download, Filter, CheckSquare, X, RefreshCw, FileText } from 'lucide-react';
import InvoicePDFImporter from '@/components/finance/InvoicePDFImporter';

const fmt = (n) => `$${Number(Math.abs(n || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_COLORS = {
  revenue: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-red-100 text-red-700',
  payroll: 'bg-violet-100 text-violet-700',
  tax: 'bg-orange-100 text-orange-700',
  transfer: 'bg-blue-100 text-blue-700',
  refund: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

const emptyTxn = {
  date: new Date().toISOString().split('T')[0],
  description: '', type: 'expense', category: '',
  amount: '', department: '', source: 'manual',
  vendor_or_client: '', reference: '', notes: '',
  tax_deductible: false, account: 'operating', status: 'cleared',
};

function exportCSV(rows) {
  const cols = ['date','description','type','category','amount','department','source','vendor_or_client','status','reference'];
  const header = cols.join(',');
  const lines = rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','));
  const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function FinanceTransactions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTxn);
  const [selected, setSelected] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => base44.entities.FinanceTransaction.list('-date', 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.FinanceTransaction.update(editing.id, data)
      : base44.entities.FinanceTransaction.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-transactions'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinanceTransaction.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-transactions'] }),
  });

  const reconcileMutation = useMutation({
    mutationFn: (ids) => Promise.all([...ids].map(id =>
      base44.entities.FinanceTransaction.update(id, { status: 'reconciled' })
    )),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-transactions'] }); setSelected(new Set()); },
  });

  const openCreate = () => { setEditing(null); setForm(emptyTxn); setModalOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = () => saveMutation.mutate({ ...form, amount: Number(form.amount) });

  const departments = useMemo(() => ['all', ...new Set(transactions.map(t => t.department).filter(Boolean))], [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase()) && !t.vendor_or_client?.toLowerCase().includes(search.toLowerCase()) && !t.category?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterSource !== 'all' && t.source !== filterSource) return false;
    if (filterDept !== 'all' && t.department !== filterDept) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    return true;
  }), [transactions, search, filterType, filterSource, filterDept, filterStatus, dateFrom, dateTo]);

  const totalIn = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const unreconciled = filtered.filter(t => t.status === 'cleared').length;

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));
  }, [filtered]);

  const clearFilters = () => {
    setSearch(''); setFilterType('all'); setFilterSource('all');
    setFilterDept('all'); setFilterStatus('all'); setDateFrom(''); setDateTo('');
  };
  const hasFilters = search || filterType !== 'all' || filterSource !== 'all' || filterDept !== 'all' || filterStatus !== 'all' || dateFrom || dateTo;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            Transactions Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All financial transactions — manual, payroll, sales, CRM, payments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
            <Download className="w-4 h-4 mr-1" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPdfImportOpen(true)} className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
            <FileText className="w-4 h-4 mr-1" />Import Invoice PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
            <Filter className="w-4 h-4 mr-1" />Filters {hasFilters && <span className="ml-1 bg-indigo-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">!</span>}
          </Button>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />New Transaction
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">Total Inflows</p><p className="text-xl font-bold text-emerald-600">{fmt(totalIn)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">Total Outflows</p><p className="text-xl font-bold text-red-500">{fmt(totalOut)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">Net</p><p className={`text-xl font-bold ${(totalIn-totalOut) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(totalIn - totalOut)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">Unreconciled</p><p className={`text-xl font-bold ${unreconciled > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{unreconciled}</p></CardContent></Card>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.keys(TYPE_COLORS).map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  {['all','manual','payroll','sales','payments','crm','hris'].map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All Sources' : s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d === 'all' ? 'All Depts' : d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {['all','pending','cleared','reconciled','void'].map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs" />
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs" />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                  <X className="w-4 h-4 mr-1" />Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-700 h-7"
            onClick={() => reconcileMutation.mutate(selected)}>
            <RefreshCw className="w-3 h-3 mr-1" />Mark Reconciled
          </Button>
          <Button size="sm" variant="ghost" className="text-gray-500 h-7" onClick={() => setSelected(new Set())}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">{filtered.length} transactions</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-3 py-3">
                  <input type="checkbox" className="rounded"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} />
                </th>
                {['Date','Description','Type','Category','Amount','Dept','Source','Status',''].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">Loading transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No transactions found.</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${selected.has(t.id) ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" className="rounded" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">{t.date}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{t.description}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`${TYPE_COLORS[t.type] || 'bg-gray-100 text-gray-600'} border-0 text-xs`}>{t.type}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{t.category || '—'}</td>
                    <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.amount >= 0 ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{t.department || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap capitalize">{t.source}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`border-0 text-xs ${t.status === 'reconciled' ? 'bg-emerald-100 text-emerald-700' : t.status === 'void' ? 'bg-red-100 text-red-600' : t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => confirm('Delete?') && deleteMutation.mutate(t.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(TYPE_COLORS).map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="e.g. Office supplies — Q2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount ($) *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="+ inflow / - outflow" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder="e.g. SaaS, Rent, COGS" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Department</Label>
                <Input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} placeholder="e.g. Marketing" />
              </div>
              <div>
                <Label>Account</Label>
                <Select value={form.account} onValueChange={v => setForm(f => ({...f, account: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['operating','payroll','tax_reserve','capex','other'].map(a => <SelectItem key={a} value={a}>{a.replace(/_/g,' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor / Client</Label>
                <Input value={form.vendor_or_client} onChange={e => setForm(f => ({...f, vendor_or_client: e.target.value}))} placeholder="Company name" />
              </div>
              <div>
                <Label>Reference #</Label>
                <Input value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))} placeholder="Check, wire ref..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({...f, source: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['manual','payroll','sales','payments','crm','hris'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending','cleared','reconciled','void'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}
                disabled={saveMutation.isPending || !form.description || !form.amount || !form.date}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Transaction'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <InvoicePDFImporter open={pdfImportOpen} onClose={() => setPdfImportOpen(false)} existingVendors={[]} />
    </div>
  );
}