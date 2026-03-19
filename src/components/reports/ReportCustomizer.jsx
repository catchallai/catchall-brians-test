import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Calendar,
  Mail,
  BarChart2,
  LineChart,
  PieChart,
  TrendingUp,
  Save,
  FileText,
  Target,
  Link2,
  Globe,
  Users,
} from 'lucide-react';

const AVAILABLE_METRICS = {
  seo: [
    { id: 'organic_traffic', label: 'Organic Traffic', icon: TrendingUp },
    { id: 'keyword_rankings', label: 'Keyword Rankings', icon: Target },
    { id: 'backlinks', label: 'Backlinks Overview', icon: Link2 },
    { id: 'domain_authority', label: 'Domain Authority', icon: Globe },
    { id: 'technical_issues', label: 'Technical Issues', icon: FileText },
    { id: 'keyword_positions', label: 'Keyword Positions', icon: Target },
    { id: 'ranking_changes', label: 'Ranking Changes', icon: TrendingUp },
    { id: 'search_volume', label: 'Search Volume', icon: BarChart2 },
  ],
  content: [
    { id: 'top_pages', label: 'Top Pages', icon: FileText },
    { id: 'content_traffic', label: 'Content Traffic', icon: TrendingUp },
    { id: 'engagement_metrics', label: 'Engagement Metrics', icon: Users },
    { id: 'conversion_rate', label: 'Conversion Rate', icon: Target },
    { id: 'bounce_rate', label: 'Bounce Rate', icon: BarChart2 },
  ],
  social: [
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'engagement_rate', label: 'Engagement Rate', icon: TrendingUp },
    { id: 'mentions', label: 'Mentions', icon: Globe },
    { id: 'sentiment', label: 'Sentiment Analysis', icon: BarChart2 },
  ],
  crm: [
    { id: 'deals_by_stage', label: 'Deals by Stage', icon: PieChart },
    { id: 'conversion_rates', label: 'Conversion Rates', icon: Target },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'avg_deal_size', label: 'Average Deal Size', icon: BarChart2 },
  ],
};

const AVAILABLE_CHARTS = [
  { id: 'traffic_trend', label: 'Traffic Trend', icon: LineChart },
  { id: 'keyword_distribution', label: 'Keyword Distribution', icon: PieChart },
  { id: 'backlink_growth', label: 'Backlink Growth', icon: BarChart2 },
  { id: 'ranking_changes', label: 'Ranking Changes', icon: TrendingUp },
  { id: 'top_pages', label: 'Top Pages Chart', icon: BarChart2 },
  { id: 'conversion_funnel', label: 'Conversion Funnel', icon: TrendingUp },
  { id: 'sentiment_breakdown', label: 'Sentiment Breakdown', icon: PieChart },
  { id: 'competitor_comparison', label: 'Competitor Comparison', icon: BarChart2 },
];

const DATE_RANGES = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function ReportCustomizer({
  open,
  onClose,
  template,
  websites = [],
  onSave,
  onSaveAsTemplate,
  isLoading,
}) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [formData, setFormData] = useState({
    name: '',
    website_id: '',
    schedule: 'manual',
    recipients: '',
    selected_metrics: [],
    selected_charts: [],
    date_range_type: 'last_30_days',
    custom_start_date: '',
    custom_end_date: '',
    custom_notes: '',
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name ? `${template.name} - ${new Date().toLocaleDateString()}` : '',
        website_id: '',
        schedule: 'manual',
        recipients: '',
        selected_metrics: template.metrics || [],
        selected_charts: ['traffic_trend', 'keyword_distribution'],
        date_range_type: 'last_30_days',
        custom_start_date: '',
        custom_end_date: '',
        custom_notes: '',
      });
    }
  }, [template]);

  const toggleMetric = (metricId) => {
    setFormData((prev) => ({
      ...prev,
      selected_metrics: prev.selected_metrics.includes(metricId)
        ? prev.selected_metrics.filter((m) => m !== metricId)
        : [...prev.selected_metrics, metricId],
    }));
  };

  const toggleChart = (chartId) => {
    setFormData((prev) => ({
      ...prev,
      selected_charts: prev.selected_charts.includes(chartId)
        ? prev.selected_charts.filter((c) => c !== chartId)
        : [...prev.selected_charts, chartId],
    }));
  };

  const handleSubmit = () => {
    const recipients = formData.recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    onSave({
      ...formData,
      recipients,
      template_id: template?.id,
      next_run:
        formData.schedule !== 'manual'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
    });
  };

  const handleSaveAsTemplate = () => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate({
        name:
          formData.name.replace(/\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}/, '').trim() || 'Custom Template',
        description: 'Custom report template',
        metrics: formData.selected_metrics,
        category: 'custom',
        icon: 'FileText',
      });
    }
  };

  if (!template) return null;

  const Icon = template.icon || FileText;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.iconBg || 'bg-blue-100 text-blue-600'}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span>Customize Report</span>
              <p className="text-sm font-normal text-gray-500">{template.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4 m-0">
              <div className="space-y-4">
                <div>
                  <Label>Report Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Custom Report"
                  />
                </div>

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
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {Object.entries(AVAILABLE_METRICS).map(([category, metrics]) => (
                  <div key={category}>
                    <Label className="capitalize mb-2 block">{category} Metrics</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {metrics.map((metric) => (
                        <Card
                          key={metric.id}
                          className={`cursor-pointer transition-all ${
                            formData.selected_metrics.includes(metric.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:border-gray-300'
                          }`}
                          onClick={() => toggleMetric(metric.id)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <Checkbox
                              checked={formData.selected_metrics.includes(metric.id)}
                              onCheckedChange={() => toggleMetric(metric.id)}
                            />
                            <metric.icon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{metric.label}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="secondary">
                    {formData.selected_metrics.length} metrics selected
                  </Badge>
                </div>
              </div>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-4 m-0">
              <Label>Select Charts to Include</Label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_CHARTS.map((chart) => (
                  <Card
                    key={chart.id}
                    className={`cursor-pointer transition-all ${
                      formData.selected_charts.includes(chart.id)
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleChart(chart.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Checkbox
                        checked={formData.selected_charts.includes(chart.id)}
                        onCheckedChange={() => toggleChart(chart.id)}
                      />
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <chart.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="font-medium text-sm">{chart.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary">{formData.selected_charts.length} charts selected</Badge>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 m-0">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </Label>
                <Select
                  value={formData.date_range_type}
                  onValueChange={(v) => setFormData({ ...formData, date_range_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.date_range_type === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.custom_start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, custom_start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.custom_end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, custom_end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

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
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4 m-0">
              <div>
                <Label>Custom Notes & Recommendations</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Add your own notes, insights, or recommendations to include in the generated
                  report.
                </p>
                <Textarea
                  value={formData.custom_notes}
                  onChange={(e) => setFormData({ ...formData, custom_notes: e.target.value })}
                  placeholder="Enter any custom notes, insights, or recommendations you want to include in this report..."
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Tip:</strong> Your notes will appear in a dedicated section of the
                  generated report. Use this to add context, highlight key findings, or include
                  action items for your team.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={handleSaveAsTemplate}
            disabled={formData.selected_metrics.length === 0}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Template
          </Button>
          <div className="flex gap-2">
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
