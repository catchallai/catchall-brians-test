import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  Package, Building2, X, ChevronRight, ChevronLeft,
} from 'lucide-react';

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PRODUCT_TYPES = ['software', 'service', 'contract', 'hardware', 'subscription', 'license', 'consulting', 'other'];

// Normalize a vendor name for fuzzy matching: lowercase, strip legal suffixes, punctuation, extra spaces
const LEGAL_SUFFIXES = /\b(inc|llc|ltd|co|corp|corporation|limited|group|holdings|gmbh|ag|sa|bv|nv|plc|pvt|private|technologies|technology|solutions|services|consulting|systems|software|international|global|worldwide)\b\.?/gi;
const normalizeName = (name = '') =>
  name.toLowerCase().replace(LEGAL_SUFFIXES, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

const findVendorMatch = (vendorName, vendorList) => {
  if (!vendorName) return null;
  const norm = normalizeName(vendorName);
  // 1. Exact match
  let match = vendorList.find(v => v.name?.toLowerCase() === vendorName.toLowerCase());
  if (match) return match;
  // 2. Normalized match (strips legal suffixes)
  match = vendorList.find(v => normalizeName(v.name) === norm);
  if (match) return match;
  // 3. One contains the other (e.g. "Tata" matches "Tata Technologies")
  match = vendorList.find(v => {
    const vn = normalizeName(v.name);
    return vn && norm && (vn.includes(norm) || norm.includes(vn));
  });
  return match || null;
};

const AI_SCHEMA = {
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

export default function InvoicePDFImporter({ open, onClose, existingVendors = [] }) {
  const qc = useQueryClient();
  const fileRef = useRef();

  // Always fetch latest vendors to prevent duplicates at save time
  const { data: allVendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  // step: 'upload' | 'processing' | 'reviewing' | 'done'
  const [step, setStep] = useState('upload');
  const [files, setFiles] = useState([]); // Array of File objects
  const [error, setError] = useState(null);

  // Queue of parsed results — one per file
  const [queue, setQueue] = useState([]); // Array of { file, parsed, status: 'pending'|'saved'|'error' }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [processingIdx, setProcessingIdx] = useState(null); // which file is being AI-processed
  const [savingIdx, setSavingIdx] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const reset = () => {
    setStep('upload'); setFiles([]); setError(null);
    setQueue([]); setCurrentIdx(0); setProcessingIdx(null);
    setSavingIdx(null); setLoadingMsg('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selected.length === 0) { setError('Please select valid PDF files.'); return; }
    setFiles(selected);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (dropped.length > 0) { setFiles(dropped); setError(null); }
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // Parse all files via AI, build queue
  const handleProcessAll = async () => {
    if (files.length === 0) return;
    setStep('processing');
    const results = [];

    for (let i = 0; i < files.length; i++) {
      setProcessingIdx(i);
      setLoadingMsg(`Processing ${i + 1} of ${files.length}: ${files[i].name}...`);

      const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a financial document parser. Extract all information from this invoice PDF.
For each line item, identify the product/service name, type (software, service, contract, hardware, subscription, license, consulting, or other), quantity, pricing, and start/expiration dates if mentioned.
For the vendor, extract company name, contact info, and categorize them. Return dates in YYYY-MM-DD format. If a field is not present, omit it.`,
        file_urls: [file_url],
        response_json_schema: AI_SCHEMA,
      });

      // Use freshly-fetched allVendors to find match (prevents duplicates)
      const existingMatch = findVendorMatch(result.vendor?.name, allVendors);

      results.push({
        file: files[i],
        parsed: {
          vendor: { ...result.vendor, _existing: existingMatch || null },
          invoice: { ...result.invoice, file_url, file_name: files[i].name },
          lineItems: (result.line_items || []).map((li, k) => ({ ...li, _key: k, _include: true })),
        },
        status: 'pending',
      });
    }

    setQueue(results);
    setCurrentIdx(0);
    setProcessingIdx(null);
    setStep('reviewing');
    setLoadingMsg('');
  };

  const updateLineItem = (field, value, key) => {
    setQueue(prev => prev.map((item, i) => i !== currentIdx ? item : {
      ...item,
      parsed: {
        ...item.parsed,
        lineItems: item.parsed.lineItems.map(li => li._key === key ? { ...li, [field]: value } : li),
      },
    }));
  };

  const updateVendor = (field, value) => {
    setQueue(prev => prev.map((item, i) => i !== currentIdx ? item : {
      ...item, parsed: { ...item.parsed, vendor: { ...item.parsed.vendor, [field]: value } },
    }));
  };

  const updateInvoice = (field, value) => {
    setQueue(prev => prev.map((item, i) => i !== currentIdx ? item : {
      ...item, parsed: { ...item.parsed, invoice: { ...item.parsed.invoice, [field]: value } },
    }));
  };

  const handleSaveCurrent = async () => {
    const item = queue[currentIdx];
    const { parsed } = item;
    setSavingIdx(currentIdx);
    setLoadingMsg('Saving...');

    let vendorId;
    const vendorName = parsed.vendor.name;

    // Re-check against latest vendors right before saving to prevent race-condition duplicates
    const latestVendors = await base44.entities.Vendor.list();
    const liveMatch = findVendorMatch(vendorName, latestVendors);
    if (liveMatch && !parsed.vendor._existing) {
      // Update the parsed state to use this existing vendor
      parsed.vendor._existing = liveMatch;
    }

    if (parsed.vendor._existing) {
      vendorId = parsed.vendor._existing.id;
      await base44.entities.Vendor.update(vendorId, {
        total_spend: (parsed.vendor._existing.total_spend || 0) + (parsed.invoice.total_amount || 0),
        invoice_count: (parsed.vendor._existing.invoice_count || 0) + 1,
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

    await base44.entities.InvoiceImport.update(invoiceImport.id, { transaction_id: txn.id });

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

    // Mark as saved
    setQueue(prev => prev.map((it, i) => i === currentIdx ? { ...it, status: 'saved' } : it));
    setSavingIdx(null);
    setLoadingMsg('');

    // Advance or finish
    const nextPending = queue.findIndex((it, i) => i > currentIdx && it.status === 'pending');
    if (nextPending !== -1) {
      setCurrentIdx(nextPending);
    } else {
      // Check if all saved
      const allDone = queue.every((it, i) => i === currentIdx || it.status === 'saved');
      if (allDone) {
        qc.invalidateQueries({ queryKey: ['finance-transactions'] });
        qc.invalidateQueries({ queryKey: ['vendors'] });
        qc.invalidateQueries({ queryKey: ['invoice-imports'] });
        qc.invalidateQueries({ queryKey: ['vendor-products'] });
        setStep('done');
      }
    }
  };

  const savedCount = queue.filter(it => it.status === 'saved').length;
  const currentItem = queue[currentIdx];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Import Invoices from PDF
            {queue.length > 0 && (
              <Badge className="bg-indigo-100 text-indigo-700 border-0 ml-2">
                {savedCount}/{queue.length} saved
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <div className="space-y-5 py-2">
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                Click or drag PDF invoices here
              </p>
              <p className="text-sm text-gray-400 mt-1">Select multiple files — each will be scanned individually</p>
              <input ref={fileRef} type="file" accept="application/pdf" multiple className="hidden" onChange={handleFilesChange} />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 rounded-lg">
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 truncate">{f.name}</p>
                      <p className="text-xs text-indigo-500">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(i)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={files.length === 0} onClick={handleProcessAll}>
                Scan {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''}` : ''} with AI
              </Button>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-14 h-14 mx-auto text-indigo-500 animate-spin" />
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{loadingMsg}</p>
            <p className="text-sm text-gray-400">AI is reading each PDF and extracting vendor info, totals, and line items</p>
            <div className="flex gap-1.5 justify-center mt-2">
              {files.map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all ${
                  i < (processingIdx ?? 0) ? 'bg-emerald-500' :
                  i === processingIdx ? 'bg-indigo-500 animate-pulse' :
                  'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>
        )}

        {/* REVIEWING STEP */}
        {step === 'reviewing' && currentItem && (
          <div className="space-y-4 py-2">
            {/* File navigator */}
            {queue.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                {queue.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      i === currentIdx
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : item.status === 'saved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {item.status === 'saved' ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {item.file.name.length > 20 ? item.file.name.slice(0, 20) + '…' : item.file.name}
                  </button>
                ))}
              </div>
            )}

            {currentItem.status === 'saved' ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <p className="font-semibold text-gray-800 dark:text-white">This invoice has been saved.</p>
                {queue.some(it => it.status === 'pending') && (
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCurrentIdx(queue.findIndex(it => it.status === 'pending'))}>
                    Review Next Invoice
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Vendor */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Vendor / Contractor</span>
                    {currentItem.parsed.vendor._existing ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs ml-auto">Existing vendor matched</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs ml-auto">New vendor will be created</Badge>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input value={currentItem.parsed.vendor.name || ''} onChange={e => updateVendor('name', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={currentItem.parsed.vendor.type || 'vendor'} onValueChange={v => updateVendor('type', v)}>
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
                      <Input value={currentItem.parsed.vendor.email || ''} onChange={e => updateVendor('email', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Input value={currentItem.parsed.vendor.category || ''} onChange={e => updateVendor('category', e.target.value)} className="h-8 text-sm" placeholder="e.g. Software, Services" />
                    </div>
                  </div>
                </div>

                {/* Invoice */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Invoice Details</span>
                    <span className="ml-auto text-sm font-bold text-gray-900 dark:text-white">Total: {fmt(currentItem.parsed.invoice.total_amount)}</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Invoice #</Label>
                      <Input value={currentItem.parsed.invoice.invoice_number || ''} onChange={e => updateInvoice('invoice_number', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Invoice Date</Label>
                      <Input type="date" value={currentItem.parsed.invoice.invoice_date || ''} onChange={e => updateInvoice('invoice_date', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Due Date</Label>
                      <Input type="date" value={currentItem.parsed.invoice.due_date || ''} onChange={e => updateInvoice('due_date', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Total Amount ($) *</Label>
                      <Input type="number" value={currentItem.parsed.invoice.total_amount || ''} onChange={e => updateInvoice('total_amount', parseFloat(e.target.value))} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Line items */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                    <Package className="w-4 h-4 text-violet-600" />
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Line Items / Products</span>
                    <Badge className="bg-violet-100 text-violet-700 border-0 text-xs ml-auto">
                      {currentItem.parsed.lineItems.filter(li => li._include).length} of {currentItem.parsed.lineItems.length} selected
                    </Badge>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {currentItem.parsed.lineItems.length === 0 && (
                      <p className="text-center py-6 text-sm text-gray-400">No line items detected</p>
                    )}
                    {currentItem.parsed.lineItems.map(li => (
                      <div key={li._key} className={`p-4 ${!li._include ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" className="mt-1 rounded" checked={li._include} onChange={e => updateLineItem('_include', e.target.checked, li._key)} />
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <Label className="text-xs">Product / Service Name</Label>
                              <Input value={li.name || ''} onChange={e => updateLineItem('name', e.target.value, li._key)} className="h-8 text-sm" disabled={!li._include} />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select value={li.product_type || 'other'} onValueChange={v => updateLineItem('product_type', v, li._key)} disabled={!li._include}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Total Amount ($)</Label>
                              <Input type="number" value={li.total_amount || ''} onChange={e => updateLineItem('total_amount', parseFloat(e.target.value), li._key)} className="h-8 text-sm" disabled={!li._include} />
                            </div>
                            {['software','subscription','license','contract','service'].includes(li.product_type) && (
                              <>
                                <div>
                                  <Label className="text-xs text-indigo-600">Start Date</Label>
                                  <Input type="date" value={li.start_date || ''} onChange={e => updateLineItem('start_date', e.target.value, li._key)} className="h-8 text-sm border-indigo-200" disabled={!li._include} />
                                </div>
                                <div>
                                  <Label className="text-xs text-amber-600">Expiration Date ⚠️</Label>
                                  <Input type="date" value={li.expiration_date || ''} onChange={e => updateLineItem('expiration_date', e.target.value, li._key)} className="h-8 text-sm border-amber-200" disabled={!li._include} />
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
                  <Button variant="outline" className="flex-1" onClick={reset}>← Start Over</Button>
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSaveCurrent}
                    disabled={savingIdx !== null || !currentItem.parsed.vendor.name || !currentItem.parsed.invoice.total_amount}
                  >
                    {savingIdx === currentIdx ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingMsg}</>
                    ) : (
                      <>Save Invoice {queue.length > 1 ? `(${currentIdx + 1}/${queue.length})` : ''}</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {queue.length} Invoice{queue.length > 1 ? 's' : ''} Imported!
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              All vendors, invoice records, finance transactions, and product line items have been created.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={reset}>Import More</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}