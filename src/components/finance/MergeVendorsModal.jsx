import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, GitMerge, CheckCircle2, AlertTriangle } from 'lucide-react';

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;

export default function MergeVendorsModal({ vendors, open, onClose }) {
  const qc = useQueryClient();
  const [primaryId, setPrimaryId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMerge = async () => {
    if (!primaryId || selectedIds.size < 2) return;
    const duplicateIds = [...selectedIds].filter(id => id !== primaryId);
    setLoading(true);

    const primary = vendors.find(v => v.id === primaryId);
    let totalSpend = primary.total_spend || 0;
    let invoiceCount = primary.invoice_count || 0;

    for (const dupId of duplicateIds) {
      const dup = vendors.find(v => v.id === dupId);
      totalSpend += (dup?.total_spend || 0);
      invoiceCount += (dup?.invoice_count || 0);

      setMsg(`Reassigning invoices from ${dup?.name}...`);
      // Reassign InvoiceImports
      const invs = await base44.entities.InvoiceImport.filter({ vendor_id: dupId });
      await Promise.all(invs.map(i => base44.entities.InvoiceImport.update(i.id, { vendor_id: primaryId, vendor_name: primary.name })));

      setMsg(`Reassigning products from ${dup?.name}...`);
      // Reassign VendorProducts
      const prods = await base44.entities.VendorProduct.filter({ vendor_id: dupId });
      await Promise.all(prods.map(p => base44.entities.VendorProduct.update(p.id, { vendor_id: primaryId, vendor_name: primary.name })));

      // Delete duplicate vendor
      setMsg(`Removing duplicate ${dup?.name}...`);
      await base44.entities.Vendor.delete(dupId);
    }

    // Update primary with combined totals
    setMsg('Updating primary vendor totals...');
    await base44.entities.Vendor.update(primaryId, {
      total_spend: totalSpend,
      invoice_count: invoiceCount,
    });

    qc.invalidateQueries({ queryKey: ['vendors'] });
    qc.invalidateQueries({ queryKey: ['invoice-imports'] });
    qc.invalidateQueries({ queryKey: ['vendor-products'] });
    setLoading(false);
    setDone(true);
  };

  const handleClose = () => {
    setPrimaryId(null);
    setSelectedIds(new Set());
    setDone(false);
    setLoading(false);
    setMsg('');
    onClose();
  };

  const canMerge = primaryId && selectedIds.size >= 2 && selectedIds.has(primaryId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-violet-600" />
            Merge Duplicate Vendors
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">Vendors Merged!</p>
            <p className="text-sm text-gray-500">All invoices and products have been reassigned to the primary vendor.</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Select the vendors to merge, then pick which one to keep as the <strong>primary</strong>. All invoices and products from duplicates will be moved to the primary, then duplicates will be deleted.</span>
            </div>

            <div className="space-y-2">
              {vendors.map(v => (
                <div
                  key={v.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedIds.has(v.id)
                      ? primaryId === v.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-violet-300 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSelect(v.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(v.id)}
                    onChange={() => {}}
                    className="rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.invoice_count || 0} invoices · {fmt(v.total_spend)} spend</p>
                  </div>
                  {selectedIds.has(v.id) && (
                    <button
                      onClick={e => { e.stopPropagation(); setPrimaryId(v.id); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        primaryId === v.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                      }`}
                    >
                      {primaryId === v.id ? '★ Primary' : 'Set Primary'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selectedIds.size >= 2 && !primaryId && (
              <p className="text-xs text-amber-600 text-center">Click "Set Primary" on the vendor you want to keep.</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={!canMerge || loading}
                onClick={handleMerge}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{msg}</>
                  : `Merge ${selectedIds.size} Vendors`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}