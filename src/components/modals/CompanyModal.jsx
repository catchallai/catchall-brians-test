import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganizationContext } from '@/components/hooks/useOrganizationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CompanyModal({ company, open, onClose }) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const queryClient = useQueryClient();
  const { organizationId } = useOrganizationContext();

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setWebsite(company.website || '');
      setIndustry(company.industry || '');
      setSize(company.size || '');
      setDescription(company.description || '');
      setPhone(company.phone || '');
      setAddress(company.address || '');
    } else {
      resetForm();
    }
  }, [company, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (company) {
        return base44.entities.Company.update(company.id, data);
      }
      return base44.entities.Company.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setName('');
    setWebsite('');
    setIndustry('');
    setSize('');
    setDescription('');
    setPhone('');
    setAddress('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      name,
      organization_id: organizationId,
      website,
      industry,
      size,
      description,
      phone,
      address,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Company' : 'Create Company'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Industry</Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Technology"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Company Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the company..."
              rows={3}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name || saveMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saveMutation.isPending ? 'Saving...' : company ? 'Update' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}