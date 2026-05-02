import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, Plus, FileText, Upload, Search, Package,
  AlertTriangle, DollarSign, TrendingUp, ExternalLink,
} from 'lucide-react';
import InvoicePDFImporter from '@/components/finance/InvoicePDFImporter';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;

const TYPE_COLORS = {
  vendor: 'bg-blue-100 text-blue-700',
  contractor: 'bg-violet-100 text-violet-700',
  customer: 'bg-emerald-100 text-emerald-700',
  supplier: 'bg-orange-100 text-orange-700',
  partner: 'bg-indigo-100 text-indigo-700',
};

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  on_hold: 'bg-amber-100 text-amber-700',
};

export default function VendorSpace() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list('-total_spend'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: () => base44.entities.VendorProduct.list('-created_date', 500),
  });

  const { data: imports = [] } = useQuery({
    queryKey: ['invoice-imports'],
    queryFn: () => base44.entities.InvoiceImport.list('-created_date', 200),
  });

  // Expiring soon (within 60 days)
  const today = new Date();
  const in60 = new Date(today); in60.setDate(today.getDate() + 60);
  const expiringSoon = products.filter(p => {
    if (!p.expiration_date) return false;
    const exp = new Date(p.expiration_date);
    return exp >= today && exp <= in60;
  });
  const expired = products.filter(p => p.expiration_date && new Date(p.expiration_date) < today && p.status !== 'cancelled');

  const filtered = vendors.filter(v => {
    if (search && !v.name?.toLowerCase().includes(search.toLowerCase()) && !v.category?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && v.type !== filterType) return false;
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    return true;
  });

  const totalSpend = vendors.reduce((s, v) => s + (v.total_spend || 0), 0);
  const totalVendors = vendors.length;
  const activeProducts = products.filter(p => p.status === 'active').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Vendor Space
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vendors, contractors & customers — populated from PDF invoice ingestion
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4 mr-2" />Import Invoice PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total Vendors</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVendors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total Spend</p>
            <p className="text-2xl font-bold text-indigo-600">{fmt(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Active Products</p>
            <p className="text-2xl font-bold text-emerald-600">{activeProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 relative">
            <p className="text-xs text-gray-500 mb-1">Expiring Soon / Expired</p>
            <p className={`text-2xl font-bold ${expired.length > 0 || expiringSoon.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {expiringSoon.length + expired.length}
            </p>
            {(expiringSoon.length > 0 || expired.length > 0) && (
              <div className="absolute top-3 right-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiry Alerts */}
      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-2">
          {expired.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> {expired.length} Expired Product{expired.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {expired.slice(0, 6).map(p => (
                  <Badge key={p.id} className="bg-red-100 text-red-700 border-red-200">
                    {p.name} — {p.expiration_date}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> {expiringSoon.length} Expiring within 60 days
              </p>
              <div className="flex flex-wrap gap-2">
                {expiringSoon.slice(0, 6).map(p => (
                  <Badge key={p.id} className="bg-amber-100 text-amber-700 border-amber-200">
                    {p.name} — expires {p.expiration_date}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.keys(TYPE_COLORS).map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace('_',' ').charAt(0).toUpperCase()+s.replace('_',' ').slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-400 self-center">{filtered.length} vendors</p>
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-500">No vendors yet</p>
            <p className="text-sm text-gray-400 mt-1">Import a PDF invoice to automatically create vendor profiles</p>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />Import First Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => {
            const vendorImports = imports.filter(i => i.vendor_id === v.id);
            const vendorProducts = products.filter(p => p.vendor_id === v.id);
            const vendorExpiring = vendorProducts.filter(p => p.expiration_date && new Date(p.expiration_date) >= today && new Date(p.expiration_date) <= in60);
            const vendorExpired = vendorProducts.filter(p => p.expiration_date && new Date(p.expiration_date) < today && p.status !== 'cancelled');

            return (
              <Card key={v.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-white text-base truncate">{v.name}</p>
                        {(vendorExpired.length > 0 || vendorExpiring.length > 0) && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`${TYPE_COLORS[v.type] || 'bg-gray-100 text-gray-600'} border-0 text-xs`}>{v.type || 'vendor'}</Badge>
                        <Badge className={`${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'} border-0 text-xs`}>{v.status}</Badge>
                        {v.category && <span className="text-xs text-gray-400">{v.category}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-lg font-bold text-indigo-600">{fmt(v.total_spend)}</p>
                      <p className="text-xs text-gray-400">total spend</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{v.invoice_count || vendorImports.length}</p>
                      <p className="text-xs text-gray-400">Invoices</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{vendorProducts.length}</p>
                      <p className="text-xs text-gray-400">Products</p>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${vendorExpired.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : vendorExpiring.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <p className={`text-base font-bold ${vendorExpired.length > 0 ? 'text-red-600' : vendorExpiring.length > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                        {vendorExpired.length + vendorExpiring.length}
                      </p>
                      <p className="text-xs text-gray-400">Expiring</p>
                    </div>
                  </div>

                  {v.email && <p className="text-xs text-gray-400 mb-1 truncate">📧 {v.email}</p>}
                  {v.last_invoice_date && <p className="text-xs text-gray-400 mb-3">Last invoice: {v.last_invoice_date}</p>}

                  <Link to={`/VendorDetail?id=${v.id}`}>
                    <Button variant="outline" size="sm" className="w-full group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />View Vendor Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <InvoicePDFImporter open={importOpen} onClose={() => setImportOpen(false)} existingVendors={vendors} />
    </div>
  );
}