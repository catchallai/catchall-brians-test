import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const AVAILABLE_METRICS = [
  { id: 'organic_traffic', label: 'Organic Traffic', category: 'seo' },
  { id: 'keyword_rankings', label: 'Keyword Rankings', category: 'seo' },
  { id: 'backlinks', label: 'Backlinks Overview', category: 'seo' },
  { id: 'domain_authority', label: 'Domain Authority', category: 'seo' },
  { id: 'technical_issues', label: 'Technical Issues', category: 'seo' },
  { id: 'top_pages', label: 'Top Pages', category: 'content' },
  { id: 'content_traffic', label: 'Content Traffic', category: 'content' },
  { id: 'engagement_metrics', label: 'Engagement Metrics', category: 'content' },
  { id: 'deals_by_stage', label: 'Deals by Stage', category: 'crm' },
  { id: 'conversion_rates', label: 'Conversion Rates', category: 'crm' },
  { id: 'revenue', label: 'Revenue', category: 'crm' },
  { id: 'followers', label: 'Followers', category: 'social' },
  { id: 'engagement_rate', label: 'Engagement Rate', category: 'social' },
  { id: 'mentions', label: 'Mentions', category: 'social' },
  { id: 'sentiment', label: 'Sentiment Analysis', category: 'social' },
  { id: 'emails_sent', label: 'Emails Sent', category: 'marketing' },
  { id: 'open_rate', label: 'Open Rate', category: 'marketing' },
  { id: 'click_rate', label: 'Click Rate', category: 'marketing' },
  { id: 'local_rankings', label: 'Local Rankings', category: 'local' },
  { id: 'reviews', label: 'Reviews Summary', category: 'local' },
];

const CATEGORIES = [
  { value: 'seo', label: 'SEO' },
  { value: 'crm', label: 'CRM' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'social', label: 'Social Media' },
  { value: 'content', label: 'Content' },
  { value: 'local', label: 'Local SEO' },
  { value: 'custom', label: 'Custom' },
];

const ICONS = [
  { value: 'Search', label: 'Search' },
  { value: 'Target', label: 'Target' },
  { value: 'TrendingUp', label: 'Trending Up' },
  { value: 'BarChart2', label: 'Bar Chart' },
  { value: 'PieChart', label: 'Pie Chart' },
  { value: 'Users', label: 'Users' },
  { value: 'Mail', label: 'Mail' },
  { value: 'Share2', label: 'Share' },
  { value: 'FileText', label: 'Document' },
  { value: 'MapPin', label: 'Location' },
];

export default function CreateTemplateModal({ open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    icon: 'FileText',
    metrics: [],
  });

  const handleMetricToggle = (metricId) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const handleSubmit = () => {
    if (!formData.name) return;
    onSave(formData);
    setFormData({ name: '', description: '', category: 'custom', icon: 'FileText', metrics: [] });
  };

  const groupedMetrics = AVAILABLE_METRICS.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div>
            <Label>Template Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Custom Template"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this template is for..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map(icon => (
                    <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Select Metrics</Label>
            <div className="space-y-4 max-h-48 overflow-y-auto border rounded-lg p-3">
              {Object.entries(groupedMetrics).map(([category, metrics]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {CATEGORIES.find(c => c.value === category)?.label || category}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.map(metric => (
                      <div key={metric.id} className="flex items-center gap-2">
                        <Checkbox
                          id={metric.id}
                          checked={formData.metrics.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <label htmlFor={metric.id} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          {metric.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{formData.metrics.length} metrics selected</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}