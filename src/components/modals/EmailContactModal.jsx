import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Send, Loader } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export default function EmailContactModal({ open, onClose, contact, businessId }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return await base44.entities.EmailTemplate.filter({ business_id: businessId }, '-created_date', 50);
    },
    enabled: !!businessId && open,
  });

  // Extract unique sender emails from templates
  const senderEmails = React.useMemo(() => {
    const emails = new Set();
    templates.forEach(t => {
      if (t.sender_email) emails.add(t.sender_email);
    });
    if (user?.email) emails.add(user.email);
    return Array.from(emails);
  }, [templates, user?.email]);

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      // Send via Resend integration
      await base44.integrations.Core.SendEmail({
        to: contact.email,
        subject: data.subject,
        body: data.message,
        from_name: 'Contact Team',
      });

      // Log the email
      await base44.entities.EmailLog.create({
        contact_id: contact.id,
        recipient_email: contact.email,
        subject: data.subject,
        message_preview: data.message.substring(0, 100),
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-logs', contact.id] });
      toast.success('Email sent successfully');
      handleClose();
    },
    onError: (error) => {
      toast.error('Failed to send email: ' + error.message);
    },
  });

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setMessage(template.body);
    }
  };

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }
    sendEmailMutation.mutate({ subject, message });
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setSelectedTemplate('');
    setSenderEmail('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Email to {contact?.first_name} {contact?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Recipient */}
          <div>
            <Label className="text-sm font-medium">To</Label>
            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
              {contact?.email}
            </div>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <Label htmlFor="template" className="text-sm font-medium">Email Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger id="template" className="mt-1">
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Template</SelectItem>
                  {templatesLoading ? (
                    <div className="p-2 text-xs text-gray-500">Loading templates...</div>
                  ) : (
                    templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* From Email */}
          <div>
            <Label htmlFor="sender" className="text-sm font-medium">From</Label>
            {senderEmails.length > 1 ? (
              <Select value={senderEmail} onValueChange={setSenderEmail}>
                <SelectTrigger id="sender" className="mt-1">
                  <SelectValue placeholder="Select sender email" />
                </SelectTrigger>
                <SelectContent>
                  {senderEmails.map((email) => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                {senderEmail || user?.email || 'Your email'}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 min-h-[200px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSend}
            disabled={sendEmailMutation.isPending || !subject.trim() || !message.trim()}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
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
      </DialogContent>
    </Dialog>
  );
}