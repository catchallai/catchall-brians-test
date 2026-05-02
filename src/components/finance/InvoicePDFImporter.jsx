import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Package, Building2, X, Edit2, Save,
} from 'lucide-react';

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PRODUCT_TYPES = ['software', 'service', 'contract', 'hardware', 'subscription', 'license', 'consulting', 'other'];

export default function InvoicePDFImporter({ open, onClose, existingVendors = [] }) {
  const qc = useQueryClient();
  const fileRef = useRef();

  const [step, setStep] = useState('upload'); // upload | reviewing | done
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState(null);

  // Parsed result state (editable before saving)
  const [parsed, setParsed] = useState(null);
  // parsed = { vendor: {...}, invoice: {...}, lineItems: [...] }

  const reset = () => {
    setStep('upload'); setFile(null); setLoading(false);
    setError(null); setParsed(null); setLoadingMsg('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') { setFile(f); setError(null); }
    else setError('Please select a valid PDF file.');
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setLoadingMsg('Uploading PDF...');

    // 1. Upload the PDF
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setLoadingMsg('Extracting text and scanning line items with AI...');

    // 2. Use AI to extract structured data
    const schema = {
      type: 'object',
      properties: {
        vendor: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['vendor', 'contractor', 'customer', 'supplier', 'partner'] },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            website: { type: 'string' },
            tax_id: { type: 'string' },
            category: { type: 'string' },
          },
        },
        invoice: {
          type: 'object',
          properties: {
            invoice_number: { type: 'string' },
            invoice_date: { type: 'string' },
            due_date: { type: 'string' },
            total_amount: { type: 'number' },
            subtotal: { type: 'number' },
            tax_amount: { type: 'number' },
            currency: { type: 'string' },
            payment_terms: { type: 'string' },
            summary: { type: 'string' },
          },
        },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              product_type: { type: 'string', enum: ['software', 'service', 'contract', 'hardware', 'subscription', 'license', 'consulting', 'other'] },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
              total_amount: { type: 'number' },
              start_date: { type: 'string' },
              expiration_date: { type: 'string' },
            },
          },
        },
      },
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a financial document parser. Extract all information from this invoice PDF.
For each line item, identify:
- The product/service name and description
- The type (software, service, contract, hardware, subscription, license, consulting, or other)
- Quantity and pricing
- Start date and expiration/end date if mentioned (common for software licenses, SaaS subscriptions, service contracts)
For the vendor, extract company name, contact info, and categorize them (Software, Services, Hardware, etc).
Return dates in YYYY-MM-DD format. If a field is not present, omit it.`,
      file_urls: [file_url],
      response_json_schema: schema,
    });

    setLoadingMsg('Done!');

    // Match vendor to existing
    const existingMatch = existingVendors.find(
      v => v.name?.toLowerCase() === result.vendor?.name?.toLowerCase()
    );

    setParsed({
      vendor: { ...result.vendor, _existing: existingMatch || null },
      invoice: { ...result.invoice, file_url, file_name: file.name },
      lineItems: (result.line_items || []).map((li, i) => ({ ...li, _key: i, _include: true })),
    });
    setStep('reviewing');
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setLoadingMsg('Saving vendor...');

    let vendorId;
    let vendorName = parsed.vendor.name;

    if (parsed.vendor._existing) {
      vendorId = parsed.vendor._existing.id;
      // Update spend totals
      const newTotal = (parsed.vendor._existing.total_spend || 0) + (parsed.invoice.total_amount || 0);
      const newCount = (parsed.vendor._existing.invoice_count || 0) + 1;
      await base44.entities.Vendor.update(vendorId, {
        total_spend: newTotal,
        invoice_count: newCount,
        last_invoice_date: parsed.invoice.invoice_date || new Date().toISOString().split('T')[0],
      });
    } else {
      const v = await base44.entities.Vendor.create({
        name: parsed.vendor.name,
        type: parsed.vendor.type || 'vendor',
        email: parsed.vendor.email,
        phone: parsed.vendor.phone,
        address: parsed.vendor.address,
        website: parsed.vendor.website,
        tax_id: parsed.vendor.tax_id,
        category: parsed.vendor.category,
        status: 'active',
        total_spend: parsed.invoice.total_amount || 0,
        invoice_count: 1,
        first_invoice_date: parsed.invoice.invoice_date || new Date().toISOString().split('T')[0],
        last_invoice_date: parsed.invoice.invoice_date || new Date().toISOString().split('T')[0],
      });
      vendorId = v.id;
    }

    setLoadingMsg('Creating invoice record...');
    const invoiceImport = await base44.entities.InvoiceImport.create({
      vendor_id: vendorId,
      vendor_name: vendorName,
      file_url: parsed.invoice.file_url,
      file_name: parsed.invoice.file_name,
      invoice_number: parsed.invoice.invoice_number,
      invoice_date: parsed.invoice.invoice_date,
      due_date: parsed.invoice.due_date,
      total_amount: parsed.invoice.total_amount,
      subtotal: parsed.invoice.subtotal,
      tax_amount: parsed.invoice.tax_amount,
      currency: parsed.invoice.currency || 'USD',
      status: 'processed',
      line_items_count: parsed.lineItems.filter(li => li._include).length,
      ai_summary: parsed.invoice.summary,
    });

    setLoadingMsg('Creating finance transaction...');
    const txn = await base44.entities.FinanceTransaction.create({
      date: parsed.invoice.invoice_date || new Date().toISOString().split('T')[0],
      description: `Invoice from ${vendorName}${parsed.invoice.invoice_number ? ' #' + parsed.invoice.invoice_number : ''}`,
      type: 'expense',
      category: parsed.vendor.category || 'Vendor Invoice',
      amount: -(parsed.invoice.total_amount || 0),
      vendor_or_client: vendorName,
      source: 'manual',
      status: 'cleared',
      reference: parsed.invoice.invoice_number,
      notes: parsed.invoice.summary,
    });

    // Update invoice with transaction ID
    await base44.entities.InvoiceImport.update(invoiceImport.id, { transaction_id: txn.id });

    setLoadingMsg('Creating product line items...');
    const includedItems = parsed.lineItems.filter(li => li._include);
    await Promise.all(includedItems.map(li =>
      base44.entities.VendorProduct.create({
        vendor_id: vendorId,
        vendor_name: vendorName,
        invoice_import_id: invoiceImport.id,
        name: li.name,
        description: li.description,
        product_type: li.product_type || 'other',
        quantity: li.quantity || 1,
        unit_price: li.unit_price || 0,
        total_amount: li.total_amount || 0,
        currency: parsed.invoice.currency || 'USD',
        start_date: li.start_date || null,
        expiration_date: li.expiration_date || null,
        invoice_date: parsed.invoice.invoice_date,
        invoice_number: parsed.invoice.invoice_number,
        status: 'active',
      })
    ));

    // Invalidate caches
    qc.invalidateQueries({ queryKey: ['finance-transactions'] });
    qc.invalidateQueries({ queryKey: ['vendors'] });
    qc.invalidateQueries({ queryKey: ['invoice-imports'] });
    qc.invalidateQueries({ queryKey: ['vendor-products'] });

    setStep('done');
    setLoading(false);
    setLoadingMsg('');
  };

  const updateLineItem = (key, field, value) => {
    setParsed(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(li => li._key === key ? { ...li, [field]: value } : li),
    }));
  };

  const updateVendor = (field, value) => setParsed(prev => ({ ...prev, vendor: { ...prev.vendor, [field]: value } }));
  const updateInvoice = (field, value) => setParsed(prev => ({ ...prev, invoice: { ...prev.invoice, [field]: value } }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Import Invoice from PDF
          </DialogTitle>
        </DialogHeader>

        {/* STEP: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-6 py-2">
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') { setFile(f); setError(null); } }}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                {file ? file.name : 'Click or drag a PDF invoice here'}
              </p>
              <p className="text-sm text-gray-400 mt-1">AI will extract vendor, invoice totals, and all line items</p>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 truncate">{file.name}</p>
                  <p className="text-xs text-indigo-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}><X className="w-4 h-4" /></Button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={!file || loading}
                onClick={handleParse}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingMsg}</>
                ) : (
                  <>Scan & Extract</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP: REVIEWING */}
        {step === 'reviewing' && parsed && (
          <div className="space-y-5 py-2">
            {/* Vendor */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Vendor / Contractor</span>
                {parsed.vendor._existing ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs ml-auto">Existing vendor matched</Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs ml-auto">New vendor will be created</Badge>
                )}
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input value={parsed.vendor.name || ''} onChange={e => updateVendor('name', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={parsed.vendor.type || 'vendor'} onValueChange={v => updateVendor('type', v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['vendor','contractor','customer','supplier','partner'].map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={parsed.vendor.email || ''} onChange={e => updateVendor('email', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={parsed.vendor.phone || ''} onChange={e => updateVendor('phone', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Input value={parsed.vendor.category || ''} onChange={e => updateVendor('category', e.target.value)} className="h-8 text-sm" placeholder="e.g. Software, Services" />
                </div>
                <div>
                  <Label className="text-xs">Website</Label>
                  <Input value={parsed.vendor.website || ''} onChange={e => updateVendor('website', e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* Invoice summary */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Invoice Details</span>
                <span className="ml-auto text-sm font-bold text-gray-900 dark:text-white">Total: {fmt(parsed.invoice.total_amount)}</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Invoice #</Label>
                  <Input value={parsed.invoice.invoice_number || ''} onChange={e => updateInvoice('invoice_number', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Invoice Date</Label>
                  <Input type="date" value={parsed.invoice.invoice_date || ''} onChange={e => updateInvoice('invoice_date', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={parsed.invoice.due_date || ''} onChange={e => updateInvoice('due_date', e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Total Amount ($) *</Label>
                  <Input type="number" value={parsed.invoice.total_amount || ''} onChange={e => updateInvoice('total_amount', parseFloat(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                <Package className="w-4 h-4 text-violet-600" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Line Items / Products</span>
                <Badge className="bg-violet-100 text-violet-700 border-0 text-xs ml-auto">
                  {parsed.lineItems.filter(li => li._include).length} of {parsed.lineItems.length} selected
                </Badge>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {parsed.lineItems.length === 0 && (
                  <p className="text-center py-6 text-sm text-gray-400">No line items detected in this PDF</p>
                )}
                {parsed.lineItems.map((li) => (
                  <div key={li._key} className={`p-4 ${!li._include ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 rounded" checked={li._include} onChange={e => updateLineItem(li._key, '_include', e.target.checked)} />
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label className="text-xs">Product / Service Name</Label>
                          <Input value={li.name || ''} onChange={e => updateLineItem(li._key, 'name', e.target.value)} className="h-8 text-sm" disabled={!li._include} />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select value={li.product_type || 'other'} onValueChange={v => updateLineItem(li._key, 'product_type', v)} disabled={!li._include}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Total Amount ($)</Label>
                          <Input type="number" value={li.total_amount || ''} onChange={e => updateLineItem(li._key, 'total_amount', parseFloat(e.target.value))} className="h-8 text-sm" disabled={!li._include} />
                        </div>
                        {/* Show date fields for software/subscription/license/contract */}
                        {['software','subscription','license','contract','service'].includes(li.product_type) && (
                          <>
                            <div>
                              <Label className="text-xs text-indigo-600">Start Date</Label>
                              <Input type="date" value={li.start_date || ''} onChange={e => updateLineItem(li._key, 'start_date', e.target.value)} className="h-8 text-sm border-indigo-200" disabled={!li._include} />
                            </div>
                            <div>
                              <Label className="text-xs text-amber-600">Expiration Date ⚠️</Label>
                              <Input type="date" value={li.expiration_date || ''} onChange={e => updateLineItem(li._key, 'expiration_date', e.target.value)} className="h-8 text-sm border-amber-200" disabled={!li._include} />
                            </div>
                          </>
                        )}
                        {li.description && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-400 italic">{li.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={reset}>← Re-upload</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={loading || !parsed.vendor.name || !parsed.invoice.total_amount}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingMsg}</>
                ) : (
                  <>Save Everything</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP: DONE */}
        {step === 'done' && (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Imported!</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Vendor, invoice record, finance transaction, and all product line items have been created successfully.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={reset}>Import Another</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}