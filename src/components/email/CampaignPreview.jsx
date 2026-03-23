import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Code, Eye, Copy, CheckCircle } from 'lucide-react';

export default function CampaignPreview({ open, onClose, template, sampleContact }) {
  const [showHtml, setShowHtml] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!template) {
    return null;
  }

  const renderWithVariables = (text, contact) => {
    if (!text) {
      return '';
    }
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

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(previewBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Preview
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant={showHtml ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHtml(!showHtml)}
                className="gap-2"
              >
                {showHtml ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    HTML
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
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

          {showHtml ? (
            <div className="border rounded-lg overflow-hidden bg-gray-950 dark:bg-gray-950">
              <div className="bg-gray-900 dark:bg-gray-900 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 font-mono">HTML Code</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyHtml}
                  className="gap-2 text-xs"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy HTML
                    </>
                  )}
                </Button>
              </div>
              <div className="p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">{previewBody}</pre>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500 ml-2">Email Body Preview</span>
              </div>
              <div className="p-6 min-h-[400px]">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline">Preview Mode</Badge>
            <span>
              Using sample data: {sampleContact?.first_name || 'John'}{' '}
              {sampleContact?.last_name || 'Doe'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
