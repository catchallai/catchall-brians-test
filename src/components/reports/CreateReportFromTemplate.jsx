import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, Users, Mail } from 'lucide-react';

const METRIC_LABELS = {
  // SEO
  organic_traffic: 'Organic Traffic',
  keyword_rankings: 'Keyword Rankings',
  backlinks: 'Backlinks Overview',
  domain_authority: 'Domain Authority',
  technical_issues: 'Technical Issues',
  keyword_positions: 'Keyword Positions',
  ranking_changes: 'Ranking Changes',
  search_volume: 'Search Volume',
  keyword_difficulty: 'Keyword Difficulty',
  serp_features: 'SERP Features',
  total_backlinks: 'Total Backlinks',
  referring_domains: 'Referring Domains',
  anchor_text: 'Anchor Text Distribution',
  link_quality: 'Link Quality Score',
  new_lost_links: 'New & Lost Links',
  // Local
  local_rankings: 'Local Rankings',
  gbp_insights: 'GBP Insights',
  citations: 'Citations',
  reviews: 'Reviews Summary',
  local_competitors: 'Local Competitors',
  // Competitive
  competitor_traffic: 'Competitor Traffic',
  keyword_gap: 'Keyword Gap',
  backlink_gap: 'Backlink Gap',
  content_gap: 'Content Gap',
  share_of_voice: 'Share of Voice',
  // Content
  top_pages: 'Top Pages',
  content_traffic: 'Content Traffic',
  engagement_metrics: 'Engagement Metrics',
  conversion_rate: 'Conversion Rate',
  content_decay: 'Content Decay',
  // CRM
  deals_by_stage: 'Deals by Stage',
  conversion_rates: 'Conversion Rates',
  revenue: 'Revenue',
  avg_deal_size: 'Average Deal Size',
  sales_velocity: 'Sales Velocity',
  // Marketing
  campaign_leads: 'Campaign Leads',
  cost_per_lead: 'Cost per Lead',
  revenue_attributed: 'Revenue Attributed',
  roi: 'ROI',
  // Social
  followers: 'Followers',
  engagement_rate: 'Engagement Rate',
  post_performance: 'Post Performance',
  mentions: 'Mentions',
  sentiment: 'Sentiment Analysis',
  // Email
  emails_sent: 'Emails Sent',
  open_rate: 'Open Rate',
  click_rate: 'Click Rate',
  unsubscribes: 'Unsubscribes',
  conversions: 'Conversions',
  // Summary
  traffic_summary: 'Traffic Summary',
  new_leads: 'New Leads',
  alerts: 'Alerts & Notifications',
};

export default function CreateReportFromTemplate({
  open,
  onClose,
  template,
  websites = [],
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: template?.name ? `${template.name} - ${new Date().toLocaleDateString()}` : '',
    website_id: '',
    schedule: 'manual',
    recipients: '',
    selectedMetrics: template?.metrics || [],
    include_traffic: true,
    include_rankings: true,
    include_backlinks: true,
    include_trends: true,
  });

  const handleMetricToggle = (metric) => {
    setFormData((prev) => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metric)
        ? prev.selectedMetrics.filter((m) => m !== metric)
        : [...prev.selectedMetrics, metric],
    }));
  };

  const handleSubmit = () => {
    const recipients = formData.recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    onSave({
      name: formData.name,
      website_id: formData.website_id,
      schedule: formData.schedule,
      recipients,
      template_id: template?.id,
      template_metrics: formData.selectedMetrics,
      include_traffic: formData.include_traffic,
      include_rankings: formData.include_rankings,
      include_backlinks: formData.include_backlinks,
      include_trends: formData.include_trends,
      next_run:
        formData.schedule !== 'manual'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
    });
  };

  if (!template) return null;

  const Icon = template.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.iconBg}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span>Create {template.name}</span>
              <p className="text-sm font-normal text-gray-500">{template.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Report Name */}
          <div>
            <Label>Report Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My SEO Report"
            />
          </div>

          {/* Website Selection */}
          <div>
            <Label>Website</Label>
            <Select
              value={formData.website_id}
              onValueChange={(v) => setFormData({ ...formData, website_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a website" />
              </SelectTrigger>
              <SelectContent>
                {websites.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} - {w.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metrics Selection */}
          {template.metrics?.length > 0 && (
            <div>
              <Label className="mb-2 block">Included Metrics</Label>
              <div className="grid grid-cols-2 gap-2">
                {template.metrics.map((metric) => (
                  <div key={metric} className="flex items-center gap-2">
                    <Checkbox
                      id={metric}
                      checked={formData.selectedMetrics.includes(metric)}
                      onCheckedChange={() => handleMetricToggle(metric)}
                    />
                    <label htmlFor={metric} className="text-sm text-gray-700 cursor-pointer">
                      {METRIC_LABELS[metric] || metric}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </Label>
            <Select
              value={formData.schedule}
              onValueChange={(v) => setFormData({ ...formData, schedule: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (Run on demand)</SelectItem>
                <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
                <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div>
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Recipients (optional)
            </Label>
            <Textarea
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.website_id || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
