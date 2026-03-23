import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Eye, Code, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LAYOUTS = [
  { id: 'minimal', label: 'Minimal', preview: 'Clean, text-focused design' },
  { id: 'branded', label: 'Branded', preview: 'Logo header with brand colors' },
  { id: 'newsletter', label: 'Newsletter', preview: 'Multi-section with images' },
  { id: 'promotional', label: 'Promotional', preview: 'Bold CTA-focused design' },
];

const VARIABLES = [
  { tag: '{{first_name}}', label: 'First Name' },
  { tag: '{{last_name}}', label: 'Last Name' },
  { tag: '{{email}}', label: 'Email' },
  { tag: '{{company_name}}', label: 'Company' },
  { tag: '{{job_title}}', label: 'Job Title' },
];

const SAMPLE_DATA = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john@example.com',
  company_name: 'Acme Corp',
  job_title: 'Marketing Manager',
};

export default function EmailTemplateModal({ open, onClose, template, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'other',
    layout: 'minimal',
  });
  const [activeTab, setActiveTab] = useState('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        category: template.category || 'other',
        layout: template.layout || 'minimal',
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: 'other',
        layout: 'minimal',
      });
    }
    setActiveTab('edit');
  }, [template, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const copyVariable = (tag) => {
    navigator.clipboard.writeText(tag);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      return;
    }
    setIsGenerating(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate professional email content for: ${generatePrompt}
      
      Category: ${formData.category}
      Layout style: ${formData.layout}
      
      Use personalization variables like {{first_name}}, {{company_name}} where appropriate.
      Make it engaging and action-oriented.`,
      response_json_schema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
          suggested_name: { type: 'string' },
        },
      },
    });

    setFormData((prev) => ({
      ...prev,
      name: prev.name || result.suggested_name || '',
      subject: result.subject || prev.subject,
      body: result.body || prev.body,
    }));
    setIsGenerating(false);
    setGeneratePrompt('');
  };

  const getPreviewContent = (text) => {
    let result = text || '';
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const renderPreview = () => {
    const previewSubject = getPreviewContent(formData.subject);
    const previewBody = getPreviewContent(formData.body);

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-gray-500 ml-2">Email Preview</span>
        </div>
        <div className="p-6 bg-gray-100 min-h-[400px] overflow-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            <div className="mb-4 pb-4 border-b">
              <p className="text-xs text-gray-500 mb-1">Subject:</p>
              <p className="font-semibold text-gray-900">{previewSubject || 'Subject Line'}</p>
            </div>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: previewBody || '<p>Your email content will appear here...</p>',
              }}
            />
          </div>
        </div>
        <div className="bg-gray-100 px-4 py-2 border-t">
          <p className="text-xs text-gray-500">
            Preview uses sample data: {SAMPLE_DATA.first_name} {SAMPLE_DATA.last_name} from{' '}
            {SAMPLE_DATA.company_name}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Email Template'}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="edit" className="gap-1">
              <Code className="w-4 h-4" /> Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1">
              <Eye className="w-4 h-4" /> Preview
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1">
              <Sparkles className="w-4 h-4" /> AI Generate
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="edit" className="m-0 space-y-4">
              <div className="grid grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select
                    value={formData.layout}
                    onValueChange={(value) => setFormData({ ...formData, layout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUTS.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          <div>
                            <span>{l.label}</span>
                            <span className="text-xs text-gray-400 ml-2">{l.preview}</span>
                          </div>
                        </SelectItem>
                      ))}
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
                  placeholder="e.g., Welcome to our team, {{first_name}}!"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Email Body *</Label>
                  <div className="flex gap-1">
                    {VARIABLES.map((v) => (
                      <Badge
                        key={v.tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-violet-50 text-xs"
                        onClick={() => copyVariable(v.tag)}
                      >
                        {copied === v.tag ? <Check className="w-3 h-3 mr-1" /> : null}
                        {v.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={12}
                  placeholder="Write your email content here..."
                  required
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="m-0">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="ai" className="m-0 space-y-4">
              <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">AI Email Generator</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Describe what you want your email to accomplish and let AI create the content.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label>What should this email do?</Label>
                <Textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g., Welcome new users to our SaaS platform and encourage them to complete their profile setup..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <Select
                    value={formData.layout}
                    onValueChange={(value) => setFormData({ ...formData, layout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUTS.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !generatePrompt.trim()}
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Email Content
              </Button>

              {formData.body && (
                <div className="p-4 bg-white rounded-lg border mt-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Generated content (switch to Edit tab to modify):
                  </p>
                  <p className="font-medium text-gray-900 mb-1">{formData.subject}</p>
                  <p className="text-sm text-gray-600 line-clamp-4">{formData.body}</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name || !formData.subject || !formData.body}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
