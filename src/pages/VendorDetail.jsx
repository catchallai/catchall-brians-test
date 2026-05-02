import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, ArrowLeft, FileText, Package, AlertTriangle,
  DollarSign, Calendar, ExternalLink, TrendingUp, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import InvoicePDFImporter from '@/components/finance/InvoicePDFImporter';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtK = (n) => `$${(Number(n || 0) / 1000).toFixed(1)}k`;

const PRODUCT_TYPE_COLORS = {
  software: '#6366f1', service: '#10b981', contract: '#f59e0b',
  hardware: '#06b6d4', subscription: '#8b5cf6', license: '#f97316',
  consulting: '#84cc16', other: '#94a3b8',
};

const STATUS_BADGE = {
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
};

export default function VendorDetail() {
  const params = new URLSearchParams(window.location.search);
  const vendorId = params.get('id');
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | products | invoices

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => base44.entities.Vendor.get(vendorId),
    enabled: !!vendorId,
  });

  const { data: allVendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => base44.entities.VendorProduct.filter({ vendor_id: vendorId }),
    enabled: !!vendorId,
  });

  const { data: invoiceImports = [] } = useQuery({
    queryKey: ['invoice-imports', vendorId],
    queryFn: () => base44.entities.InvoiceImport.filter({ vendor_id: vendorId }),
    enabled: !!vendorId,
  });

  const today = new Date();
  const in30 = new Date(today); in30.setDate(today.getDate() + 30);
  const in60 = new Date(today); in60.setDate(today.getDate() + 60);

  const expiredProducts = products.filter(p => p.expiration_date && new Date(p.expiration_date) < today && p.status !== 'cancelled');
  const expiringIn30 = products.filter(p => p.expiration_date && new Date(p.expiration_date) >= today && new Date(p.expiration_date) <= in30);
  const expiringIn60 = products.filter(p => p.expiration_date && new Date(p.expiration_date) >= today && new Date(p.expiration_date) <= in60);
  const activeProducts = products.filter(p => p.status === 'active');

  const totalSpend = invoiceImports.reduce((s, i) => s + (i.total_amount || 0), 0);
  const avgInvoice = invoiceImports.length > 0 ? totalSpend / invoiceImports.length : 0;

  // Spend over time by month
  const spendByMonth = useMemo(() => {
    const map = {};
    invoiceImports.forEach(inv => {
      if (!inv.invoice_date) return;
      const key = inv.invoice_date.substring(0, 7); // YYYY-MM
      map[key] = (map[key] || 0) + (inv.total_amount || 0);
    });
    return Object.entries(map).sort().map(([month, amount]) => ({ month, Amount: amount }));
  }, [invoiceImports]);

  // Products by type (donut)
  const productsByType = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const t = p.product_type || 'other';
      map[t] = (map[t] || 0) + (p.total_amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [products]);

  if (vendorLoading) {
    return <div className="p-8 text-center text-gray-400">Loading vendor...</div>;
  }
  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Vendor not found.</p>
        <Link to="/VendorSpace"><Button className="mt-4" variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Vendors</Button></Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${products.length})` },
    { id: 'invoices', label: `Invoices (${invoiceImports.length})` },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/VendorSpace">
            <Button variant="ghost" size="sm" className="mt-1">
              <ArrowLeft className="w-4 h-4 mr-1" />Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.name}</h1>
              <Badge className={`border-0 ${vendor.type === 'vendor' ? 'bg-blue-100 text-blue-700' : vendor.type === 'contractor' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {vendor.type}
              </Badge>
              <Badge className={`border-0 ${vendor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {vendor.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap text-sm text-gray-500">
              {vendor.email && <span>📧 {vendor.email}</span>}
              {vendor.phone && <span>📞 {vendor.phone}</span>}
              {vendor.website && <a href={vendor.website} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />{vendor.website}</a>}
              {vendor.category && <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">{vendor.category}</span>}
            </div>
          </div>
        </div>
        <Button onClick={() => setImportOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0">
          <FileText className="w-4 h-4 mr-2" />Add Invoice
        </Button>
      </div>

      {/* Expiry Alerts */}
      {(expiredProducts.length > 0 || expiringIn30.length > 0) && (
        <div className="space-y-2">
          {expiredProducts.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">{expiredProducts.length} expired product{expiredProducts.length > 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {expiredProducts.map(p => <Badge key={p.id} className="bg-red-100 text-red-600 border-red-200 text-xs">{p.name} · {p.expiration_date}</Badge>)}
                </div>
              </div>
            </div>
          )}
          {expiringIn30.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{expiringIn30.length} expiring within 30 days</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {expiringIn30.map(p => <Badge key={p.id} className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{p.name} · {p.expiration_date}</Badge>)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: fmt(totalSpend), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Invoices', value: invoiceImports.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Products', value: activeProducts.length, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Invoice', value: fmt(avgInvoice), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-800 text-indigo-600 border border-b-white border-gray-200 dark:border-gray-700 dark:border-b-gray-800 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Spend over time */}
          <Card>
            <CardHeader><CardTitle className="text-base">Spend Over Time</CardTitle></CardHeader>
            <CardContent>
              {spendByMonth.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No invoice history yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={spendByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="Amount" fill="#6366f1" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Products by type */}
          <Card>
            <CardHeader><CardTitle className="text-base">Spend by Product Type</CardTitle></CardHeader>
            <CardContent>
              {productsByType.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No products yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={productsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {productsByType.map((entry, i) => (
                        <Cell key={entry.name} fill={PRODUCT_TYPE_COLORS[entry.name.toLowerCase()] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend formatter={v => <span className="text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Vendor info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Vendor Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Company Name', value: vendor.name },
                { label: 'Type', value: vendor.type },
                { label: 'Category', value: vendor.category },
                { label: 'Email', value: vendor.email },
                { label: 'Phone', value: vendor.phone },
                { label: 'Address', value: vendor.address },
                { label: 'Website', value: vendor.website },
                { label: 'Tax ID', value: vendor.tax_id },
                { label: 'Payment Terms', value: vendor.payment_terms },
                { label: 'First Invoice', value: vendor.first_invoice_date },
                { label: 'Last Invoice', value: vendor.last_invoice_date },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[200px] truncate">{r.value}</span>
                </div>
              ))}
              {vendor.notes && <p className="text-xs text-gray-400 italic pt-1">{vendor.notes}</p>}
            </CardContent>
          </Card>

          {/* Expiry timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">
              Software & License Expirations
              {(expiredProducts.length > 0 || expiringIn60.length > 0) && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            </CardTitle></CardHeader>
            <CardContent>
              {products.filter(p => p.expiration_date).length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">No tracked expiration dates</div>
              ) : (
                <div className="space-y-2">
                  {products.filter(p => p.expiration_date).sort((a, b) => a.expiration_date > b.expiration_date ? 1 : -1).map(p => {
                    const daysLeft = Math.ceil((new Date(p.expiration_date) - today) / (1000 * 60 * 60 * 24));
                    const isExpired = daysLeft < 0;
                    const isWarning = daysLeft >= 0 && daysLeft <= 30;
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : isWarning ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.product_type} · expires {p.expiration_date}</p>
                        </div>
                        <Badge className={`text-xs border-0 ${isExpired ? 'bg-red-100 text-red-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isExpired ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Product / Service','Type','Amount','Start Date','Expiration','Invoice #','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No products yet. Import an invoice to add products.</td></tr>
                ) : (
                  products.map(p => {
                    const daysLeft = p.expiration_date ? Math.ceil((new Date(p.expiration_date) - today) / (1000 * 60 * 60 * 24)) : null;
                    const isExpired = daysLeft !== null && daysLeft < 0;
                    const isWarning = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${isExpired ? 'bg-red-50/40' : isWarning ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{p.name}</p>
                          {p.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="border-0 text-xs" style={{ backgroundColor: (PRODUCT_TYPE_COLORS[p.product_type] || '#94a3b8') + '20', color: PRODUCT_TYPE_COLORS[p.product_type] || '#94a3b8' }}>
                            {p.product_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{fmt(p.total_amount)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.start_date || '—'}</td>
                        <td className="px-4 py-3">
                          {p.expiration_date ? (
                            <div>
                              <p className={`text-xs font-medium ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-600'}`}>{p.expiration_date}</p>
                              {daysLeft !== null && (
                                <p className={`text-xs ${isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-400'}`}>
                                  {isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                                </p>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{p.invoice_number || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'} border-0 text-xs`}>{p.status}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['File','Invoice #','Date','Due Date','Total','Line Items','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoiceImports.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No invoices yet.</td></tr>
                ) : (
                  invoiceImports.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-xs max-w-[150px] truncate">{inv.file_name}</span>
                          {inv.file_url && (
                            <a href={inv.file_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-3 h-3 text-indigo-400 hover:text-indigo-600" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{inv.invoice_number || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{inv.invoice_date || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{inv.due_date || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{fmt(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{inv.line_items_count || 0}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-xs ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'processed' ? 'bg-blue-100 text-blue-700' : inv.status === 'disputed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {inv.ai_summary && (
                          <span className="text-xs text-gray-400 italic max-w-[150px] truncate block" title={inv.ai_summary}>{inv.ai_summary}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <InvoicePDFImporter open={importOpen} onClose={() => setImportOpen(false)} existingVendors={allVendors} />
    </div>
  );
}