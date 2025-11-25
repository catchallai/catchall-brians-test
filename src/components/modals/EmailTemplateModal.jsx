import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function EmailTemplateModal({ open, onClose, template, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'other',
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        category: template.category || 'other',
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: 'other',
      });
    }
  }, [template, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Email Template'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Welcome to {{company_name}}!"
              required
            />
            <p className="text-xs text-gray-400">Use {"{{first_name}}"}, {"{{company_name}}"} for personalization</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={10}
              placeholder="Write your email content here..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}