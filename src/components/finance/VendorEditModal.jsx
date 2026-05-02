import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2 } from 'lucide-react';

const FIELDS = [
  { key: 'name', label: 'Company Name *', type: 'text', required: true, col: 2 },
  { key: 'type', label: 'Type', type: 'select', options: ['vendor','contractor','customer','supplier','partner'], col: 1 },
  { key: 'status', label: 'Status', type: 'select', options: ['active','inactive','on_hold'], col: 1 },
  { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Software, Services, Hardware', col: 1 },
  { key: 'payment_terms', label: 'Payment Terms', type: 'text', placeholder: 'e.g. Net 30, Net 60', col: 1 },
  { key: 'email', label: 'Email', type: 'email', col: 1 },
  { key: 'phone', label: 'Phone', type: 'text', col: 1 },
  { key: 'website', label: 'Website', type: 'url', placeholder: 'https://', col: 1 },
  { key: 'tax_id', label: 'Tax ID / EIN', type: 'text', col: 1 },
  { key: 'address', label: 'Address', type: 'text', col: 2 },
  { key: 'notes', label: 'Notes', type: 'textarea', col: 2 },
];

export default function VendorEditModal({ vendor, open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (vendor) setForm({ ...vendor });
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.update(vendor.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['vendor', vendor.id] });
      onClose();
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Edit Vendor Profile
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {FIELDS.map(f => (
            <div key={f.key} className={f.col === 2 ? 'col-span-2' : 'col-span-1'}>
              <Label className="text-xs mb-1 block">{f.label}</Label>
              {f.type === 'select' ? (
                <Select value={form[f.key] || ''} onValueChange={v => set(f.key, v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {f.options.map(o => (
                      <SelectItem key={o} value={o}>{o.replace('_', ' ').charAt(0).toUpperCase() + o.replace('_', ' ').slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === 'textarea' ? (
                <Textarea
                  value={form[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  rows={3}
                  placeholder={f.placeholder}
                />
              ) : (
                <Input
                  type={f.type}
                  value={form[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.name}
          >
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}