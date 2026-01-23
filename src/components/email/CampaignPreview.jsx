import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

export default function CampaignPreview({ open, onClose, template, sampleContact }) {
  if (!template) return null;

  const renderWithVariables = (text, contact) => {
    if (!text) return '';
    let result = text;
    
    const variables = {
      first_name: contact?.first_name || '[First Name]',
      last_name: contact?.last_name || '[Last Name]',
      email: contact?.email || '[Email]',
      company_name: contact?.company_name || '[Company]',
      job_title: contact?.job_title || '[Job Title]',
      sender_name: 'Your Name',
      unsubscribe_link: '#unsubscribe',
    };

    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return result;
  };

  const previewSubject = renderWithVariables(template.subject, sampleContact);
  const previewBody = renderWithVariables(template.body, sampleContact);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-gray-50 dark:bg-gray-800 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">From:</span>
                <span className="text-sm text-gray-900 dark:text-white">you@company.com</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">To:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {sampleContact?.email || 'recipient@example.com'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500">Subject:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 text-right">
                  {previewSubject}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-500 ml-2">Email Body</span>
            </div>
            <div className="p-6 min-h-[300px]">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: previewBody }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline">Preview Mode</Badge>
            <span>Using sample data: {sampleContact?.first_name || 'John'} {sampleContact?.last_name || 'Doe'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}