import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  Loader2,
  AlertTriangle,
  Smartphone,
  Zap,
  Palette,
  Layout,
  Type,
  Image,
  MousePointer,
  Eye,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';

const ISSUE_CATEGORIES = [
  {
    id: 'layout',
    name: 'Layout Issues',
    icon: Layout,
    color: 'bg-blue-100 text-blue-700',
    issues: [
      { id: 'layout_broken', label: 'Broken layout/alignment', severity: 'high' },
      { id: 'layout_overflow', label: 'Content overflow/clipping', severity: 'medium' },
      { id: 'layout_spacing', label: 'Inconsistent spacing/margins', severity: 'low' },
      { id: 'layout_grid', label: 'Grid system issues', severity: 'medium' },
      { id: 'layout_container', label: 'Container width problems', severity: 'medium' },
    ],
  },
  {
    id: 'responsive',
    name: 'Responsive Design',
    icon: Smartphone,
    color: 'bg-purple-100 text-purple-700',
    issues: [
      { id: 'resp_mobile', label: 'Mobile layout broken', severity: 'high' },
      { id: 'resp_tablet', label: 'Tablet view issues', severity: 'medium' },
      { id: 'resp_breakpoint', label: 'Breakpoint transition problems', severity: 'medium' },
      { id: 'resp_touch', label: 'Touch target too small', severity: 'high' },
      { id: 'resp_scroll', label: 'Horizontal scroll on mobile', severity: 'high' },
    ],
  },
  {
    id: 'typography',
    name: 'Typography',
    icon: Type,
    color: 'bg-amber-100 text-amber-700',
    issues: [
      { id: 'typo_font', label: 'Wrong font family', severity: 'medium' },
      { id: 'typo_size', label: 'Incorrect font sizes', severity: 'low' },
      { id: 'typo_weight', label: 'Font weight inconsistency', severity: 'low' },
      { id: 'typo_line', label: 'Line height/spacing issues', severity: 'low' },
      { id: 'typo_readability', label: 'Poor readability/contrast', severity: 'high' },
    ],
  },
  {
    id: 'visual',
    name: 'Visual Design',
    icon: Palette,
    color: 'bg-pink-100 text-pink-700',
    issues: [
      { id: 'visual_color', label: 'Wrong colors used', severity: 'medium' },
      { id: 'visual_brand', label: 'Brand inconsistency', severity: 'high' },
      { id: 'visual_icons', label: 'Missing/wrong icons', severity: 'low' },
      { id: 'visual_shadow', label: 'Shadow/depth issues', severity: 'low' },
      { id: 'visual_border', label: 'Border/radius inconsistency', severity: 'low' },
    ],
  },
  {
    id: 'images',
    name: 'Images & Media',
    icon: Image,
    color: 'bg-green-100 text-green-700',
    issues: [
      { id: 'img_broken', label: 'Broken/missing images', severity: 'high' },
      { id: 'img_quality', label: 'Low quality/blurry images', severity: 'medium' },
      { id: 'img_size', label: 'Wrong image dimensions', severity: 'medium' },
      { id: 'img_alt', label: 'Missing alt text', severity: 'medium' },
      { id: 'img_loading', label: 'Slow image loading', severity: 'medium' },
    ],
  },
  {
    id: 'interaction',
    name: 'Interactions',
    icon: MousePointer,
    color: 'bg-cyan-100 text-cyan-700',
    issues: [
      { id: 'int_hover', label: 'Hover states missing/broken', severity: 'low' },
      { id: 'int_click', label: 'Click/tap feedback missing', severity: 'medium' },
      { id: 'int_animation', label: 'Animation issues', severity: 'low' },
      { id: 'int_focus', label: 'Focus states missing', severity: 'high' },
      { id: 'int_transition', label: 'Transition problems', severity: 'low' },
    ],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    icon: Eye,
    color: 'bg-indigo-100 text-indigo-700',
    issues: [
      { id: 'a11y_contrast', label: 'Color contrast issues', severity: 'high' },
      { id: 'a11y_keyboard', label: 'Keyboard navigation broken', severity: 'high' },
      { id: 'a11y_screen', label: 'Screen reader issues', severity: 'high' },
      { id: 'a11y_labels', label: 'Missing ARIA labels', severity: 'medium' },
      { id: 'a11y_focus', label: 'Focus order problems', severity: 'medium' },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: Zap,
    color: 'bg-orange-100 text-orange-700',
    issues: [
      { id: 'perf_render', label: 'Slow rendering/paint', severity: 'high' },
      { id: 'perf_layout', label: 'Layout shift (CLS)', severity: 'high' },
      { id: 'perf_assets', label: 'Unoptimized assets', severity: 'medium' },
      { id: 'perf_fonts', label: 'Font loading issues', severity: 'medium' },
      { id: 'perf_css', label: 'CSS bloat/unused styles', severity: 'low' },
    ],
  },
];

const SEVERITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

export default function DesignIssuesReportModal({ open, onClose, websites = [] }) {
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [customIssues, setCustomIssues] = useState([]);
  const [newCustomIssue, setNewCustomIssue] = useState('');
  const [recipients, setRecipients] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [reportName, setReportName] = useState('Design Issues Report');
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [affectedPages, setAffectedPages] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleIssue = (issueId) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
    );
  };

  const addCustomIssue = () => {
    if (newCustomIssue.trim()) {
      setCustomIssues((prev) => [
        ...prev,
        { id: `custom_${Date.now()}`, label: newCustomIssue.trim(), severity: 'medium' },
      ]);
      setNewCustomIssue('');
    }
  };

  const removeCustomIssue = (id) => {
    setCustomIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const getSelectedIssueDetails = () => {
    const details = [];
    ISSUE_CATEGORIES.forEach((cat) => {
      cat.issues.forEach((issue) => {
        if (selectedIssues.includes(issue.id)) {
          details.push({ ...issue, category: cat.name });
        }
      });
    });
    customIssues.forEach((issue) => {
      details.push({ ...issue, category: 'Custom Issues' });
    });
    return details;
  };

  const handleSend = async () => {
    if (!recipients.trim()) {
      return;
    }

    setIsSending(true);

    const issueDetails = getSelectedIssueDetails();
    const website = websites.find((w) => w.id === selectedWebsite);

    const emailBody = `
<h2>Design Issues Report: ${reportName}</h2>
<p><strong>Website:</strong> ${website?.name || 'Not specified'} (${website?.url || 'N/A'})</p>
<p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
<p><strong>Affected Pages:</strong> ${affectedPages || 'Not specified'}</p>
<p><strong>Total Issues:</strong> ${issueDetails.length}</p>

<h3>Issues Identified:</h3>
<table style="border-collapse: collapse; width: 100%;">
  <tr style="background: #f3f4f6;">
    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Issue</th>
    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Category</th>
    <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Severity</th>
  </tr>
  ${issueDetails
    .map(
      (issue) => `
  <tr>
    <td style="border: 1px solid #e5e7eb; padding: 8px;">${issue.label}</td>
    <td style="border: 1px solid #e5e7eb; padding: 8px;">${issue.category}</td>
    <td style="border: 1px solid #e5e7eb; padding: 8px; color: ${issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#d97706' : '#16a34a'};">${issue.severity.toUpperCase()}</td>
  </tr>
  `
    )
    .join('')}
</table>

${additionalNotes ? `<h3>Additional Notes:</h3><p>${additionalNotes}</p>` : ''}

<p style="margin-top: 20px; color: #6b7280; font-size: 12px;">Generated by CatchAll Business Suite</p>
    `;

    const emailList = recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);

    for (const email of emailList) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `[Design Team] ${reportName} - ${issueDetails.length} Issues (${priority.toUpperCase()} Priority)`,
        body: emailBody,
      });
    }

    setIsSending(false);
    setSent(true);

    setTimeout(() => {
      setSent(false);
      onClose();
      setSelectedIssues([]);
      setCustomIssues([]);
      setRecipients('');
      setAdditionalNotes('');
      setAffectedPages('');
    }, 2000);
  };

  const selectedCount = selectedIssues.length + customIssues.length;
  const highCount = getSelectedIssueDetails().filter((i) => i.severity === 'high').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span>Design Issues Report</span>
              <p className="text-sm font-normal text-gray-500">
                Select issues to send to your design team
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="issues" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-0">
            <TabsTrigger value="issues">Select Issues</TabsTrigger>
            <TabsTrigger value="details">Report Details</TabsTrigger>
            <TabsTrigger value="preview">Preview & Send</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {ISSUE_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const categorySelected = category.issues.filter((i) =>
                    selectedIssues.includes(i.id)
                  ).length;

                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        {categorySelected > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {categorySelected} selected
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10">
                        {category.issues.map((issue) => (
                          <label
                            key={issue.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedIssues.includes(issue.id)
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Checkbox
                              checked={selectedIssues.includes(issue.id)}
                              onCheckedChange={() => toggleIssue(issue.id)}
                            />
                            <span className="flex-1 text-sm">{issue.label}</span>
                            <Badge className={`text-xs ${SEVERITY_COLORS[issue.severity]}`}>
                              {issue.severity}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Custom Issues */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Custom Issues</h3>
                  </div>
                  <div className="ml-10 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Describe a custom issue..."
                        value={newCustomIssue}
                        onChange={(e) => setNewCustomIssue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomIssue()}
                      />
                      <Button onClick={addCustomIssue} disabled={!newCustomIssue.trim()}>
                        Add
                      </Button>
                    </div>
                    {customIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="flex items-center gap-2 p-3 rounded-lg border border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                      >
                        <CheckCircle2 className="w-4 h-4 text-violet-600" />
                        <span className="flex-1 text-sm">{issue.label}</span>
                        <Badge className={SEVERITY_COLORS[issue.severity]}>{issue.severity}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeCustomIssue(issue.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="flex-1 overflow-auto mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Design Issues Report"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <select
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3"
              >
                <option value="">Select a website...</option>
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.url})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Affected Pages/URLs</Label>
              <Textarea
                value={affectedPages}
                onChange={(e) => setAffectedPages(e.target.value)}
                placeholder="List the specific pages or URLs where these issues occur..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional context, screenshots links, or instructions for the design team..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Recipients (comma-separated emails)</Label>
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="designer@company.com, dev@company.com"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{reportName}</h3>
                <Badge
                  className={
                    priority === 'urgent' || priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }
                >
                  {priority.toUpperCase()} Priority
                </Badge>
              </div>

              {selectedWebsite && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Website:</strong> {websites.find((w) => w.id === selectedWebsite)?.name}
                </p>
              )}

              {affectedPages && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Affected Pages:</strong> {affectedPages}
                </p>
              )}

              <div className="space-y-2">
                <p className="font-medium">
                  Issues ({selectedCount})
                  {highCount > 0 && (
                    <span className="text-red-600 ml-2">({highCount} high severity)</span>
                  )}
                </p>
                <div className="space-y-1">
                  {getSelectedIssueDetails().map((issue) => (
                    <div key={issue.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`w-2 h-2 rounded-full ${issue.severity === 'high' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}
                      />
                      <span>{issue.label}</span>
                      <span className="text-gray-400">({issue.category})</span>
                    </div>
                  ))}
                </div>
              </div>

              {additionalNotes && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <p className="font-medium mb-1">Notes:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{additionalNotes}</p>
                </div>
              )}

              <div className="pt-4 border-t dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Sending to:</strong> {recipients || 'No recipients specified'}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2 mr-auto">
            <Badge variant="outline">{selectedCount} issues selected</Badge>
            {highCount > 0 && (
              <Badge className="bg-red-100 text-red-700">{highCount} high severity</Badge>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedCount === 0 || !recipients.trim() || isSending || sent}
            className="gap-2"
          >
            {sent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Sent!
              </>
            ) : isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
