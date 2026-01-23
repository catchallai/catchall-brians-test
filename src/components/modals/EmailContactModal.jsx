import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Bold, Italic, List, Send, Loader2, Check, FileText } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SAMPLE_DATA = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john@example.com',
  company_name: 'Acme Corp',
  job_title: 'Marketing Manager',
};

export default function EmailContactModal({ open, onClose, contact, businessId }) {
  const [formData, setFormData] = useState({
    from_account: '',
    to_email: contact?.email || '',
    subject: '',
    body: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: emailAccounts = [] } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      // For now, just return the current user's email as an option
      const userData = await base44.auth.me();
      return [{ id: userData.email, name: userData.full_name, email: userData.email }];
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      // Call backend function to send email
      const response = await base44.functions.invoke('sendContactEmail', {
        to: data.to_email,
        subject: data.subject,
        body: data.body,
        from_email: data.from_account,
      });
      return response.data;
    },
    onSuccess: async () => {
      // Log as activity
      await base44.entities.Activity.create({
        entity_type: 'contact',
        entity_id: contact.id,
        activity_type: 'email_sent',
        title: `Sent email to ${contact.first_name} ${contact.last_name}`,
        description: formData.body,
        performed_by: user?.email,
        performed_by_name: user?.full_name,
        metadata: {
          subject: formData.subject,
          to: formData.to_email,
          from: formData.from_account,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setFormData({
          from_account: '',
          to_email: contact?.email || '',
          subject: '',
          body: '',
        });
      }, 2000);
    },
  });

  const handleSendEmail = () => {
    if (!formData.from_account || !formData.to_email || !formData.subject || !formData.body.trim()) {
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to {contact?.first_name} {contact?.last_name}</DialogTitle>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center">Your email has been sent successfully and added to the activity feed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* From Account */}
            <div>
              <label className="text-sm font-medium">From Account *</label>
              <Select value={formData.from_account} onValueChange={(v) => setFormData({ ...formData, from_account: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select email account" />
                </SelectTrigger>
                <SelectContent>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.email}>
                      {account.name} ({account.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Email */}
            <div>
              <label className="text-sm font-medium">To *</label>
              <Input
                value={formData.to_email}
                onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                type="email"
                className="mt-1"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>

            {/* Message Body with Rich Editor */}
            <div>
              <label className="text-sm font-medium mb-2 block">Message *</label>
              <style>{`
                .email-editor .ql-toolbar {
                  background: #f9fafb !important;
                  border: 1px solid #e5e7eb !important;
                }
                .dark .email-editor .ql-toolbar {
                  background: #374151 !important;
                  border: 1px solid #4b5563 !important;
                }
                .email-editor .ql-toolbar button {
                  color: #374151 !important;
                }
                .dark .email-editor .ql-toolbar button {
                  color: #f3f4f6 !important;
                }
                .email-editor .ql-toolbar button:hover,
                .email-editor .ql-toolbar button.ql-active {
                  color: #7c3aed !important;
                }
                .dark .email-editor .ql-toolbar button:hover,
                .dark .email-editor .ql-toolbar button.ql-active {
                  color: #a78bfa !important;
                }
              `}</style>
              <div className="email-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <ReactQuill
                  value={formData.body}
                  onChange={(content) => setFormData({ ...formData, body: content })}
                  theme="snow"
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      ['list', 'bullet'],
                      ['link'],
                      ['clean'],
                    ],
                  }}
                  className="bg-white dark:bg-gray-800"
                  style={{ height: '200px' }}
                />
              </div>
            </div>
          </div>
        )}

        {!showSuccess && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={
                !formData.from_account ||
                !formData.to_email ||
                !formData.subject ||
                !formData.body.trim() ||
                sendEmailMutation.isPending
              }
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}