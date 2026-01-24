import React, { useState, useEffect } from 'react';
import { validateForm, sanitizeObject } from '@/components/utils/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X } from "lucide-react";

export default function ContactModal({ open, onClose, contact, companies, onSave, isLoading, allowMultipleCompanies = false }) {
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
    company_ids: [],
    job_title: '',
    linkedin_url: '',
    status: 'lead',
    source: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (contact) {
      setFormData({
        company_name: contact.company_name || '',
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company_id: contact.company_id || '',
        company_ids: contact.company_ids || [],
        job_title: contact.job_title || '',
        linkedin_url: contact.linkedin_url || '',
        status: contact.status || 'lead',
        source: contact.source || '',
        notes: contact.notes || '',
      });
    } else {
      setFormData({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: '',
        company_ids: [],
        job_title: '',
        linkedin_url: '',
        status: 'lead',
        source: '',
        notes: '',
      });
    }
  }, [contact, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData, {
      first_name: { required: true, message: 'First name is required' },
      email: { required: true, email: true },
      phone: { phone: true },
    });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setErrors({});
    const sanitizedData = sanitizeObject(formData);
    onSave(sanitizedData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Firm</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Company/Firm name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title">Title</Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone 1</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className={`${allowMultipleCompanies ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
            <div className="space-y-2">
              <Label>Company {allowMultipleCompanies ? '(Primary)' : ''}</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {allowMultipleCompanies && (
            <div className="space-y-2">
              <Label>Link to Additional Companies</Label>
              <div className="grid grid-cols-2 gap-2">
                {companies?.map((company) => (
                  <label key={company.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                    <input
                      type="checkbox"
                      checked={formData.company_ids?.includes(company.id) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            company_ids: [...(formData.company_ids || []), company.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            company_ids: (formData.company_ids || []).filter(id => id !== company.id)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{company.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="How did they find you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}