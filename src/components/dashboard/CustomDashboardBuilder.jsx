import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Save,
  Layout,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Link2,
  Share2,
  Mail,
  PieChart,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AVAILABLE_WIDGETS = [
  { id: 'seo_score', name: 'SEO Score', icon: TrendingUp, category: 'seo' },
  { id: 'keyword_rankings', name: 'Keyword Rankings', icon: Target, category: 'seo' },
  { id: 'backlink_overview', name: 'Backlink Overview', icon: Link2, category: 'seo' },
  { id: 'traffic_chart', name: 'Traffic Trends', icon: BarChart3, category: 'analytics' },
  { id: 'social_engagement', name: 'Social Engagement', icon: Share2, category: 'social' },
  {
    id: 'competitor_comparison',
    name: 'Competitor Comparison',
    icon: Users,
    category: 'competitive',
  },
  { id: 'deal_pipeline', name: 'Deal Pipeline', icon: PieChart, category: 'crm' },
  { id: 'email_stats', name: 'Email Campaign Stats', icon: Mail, category: 'marketing' },
  { id: 'recent_activity', name: 'Recent Activity', icon: BarChart3, category: 'general' },
  { id: 'quick_actions', name: 'Quick Actions', icon: Plus, category: 'general' },
];

export default function CustomDashboardBuilder({ open, onClose, dashboard, onSave, isLoading }) {
  const [name, setName] = useState(dashboard?.name || 'My Dashboard');
  const [selectedWidgets, setSelectedWidgets] = useState(
    dashboard?.widgets?.map((w) => w.type) || [
      'seo_score',
      'keyword_rankings',
      'traffic_chart',
      'deal_pipeline',
    ]
  );
  const [layout, setLayout] = useState(dashboard?.layout || 'grid');

  const toggleWidget = (widgetId) => {
    setSelectedWidgets((prev) =>
      prev.includes(widgetId) ? prev.filter((id) => id !== widgetId) : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    onSave({
      name,
      layout,
      widgets: selectedWidgets.map((type, idx) => ({
        id: `widget-${idx}`,
        type,
        position: idx,
        size: 'medium',
        config: {},
      })),
      is_default: !dashboard,
    });
  };

  const categories = [...new Set(AVAILABLE_WIDGETS.map((w) => w.category))];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            {dashboard ? 'Edit Dashboard' : 'Create Custom Dashboard'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dashboard Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Dashboard"
              className="mt-1"
            />
          </div>

          {/* Layout */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Layout
            </label>
            <div className="flex gap-2">
              {['grid', 'list', 'compact'].map((l) => (
                <Button
                  key={l}
                  variant={layout === l ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLayout(l)}
                  className="capitalize"
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>

          {/* Widget Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Select Widgets ({selectedWidgets.length} selected)
            </label>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <div key={category}>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">{category}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_WIDGETS.filter((w) => w.category === category).map((widget) => (
                      <label
                        key={widget.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedWidgets.includes(widget.id)
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Checkbox
                          checked={selectedWidgets.includes(widget.id)}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <widget.icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {widget.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Preview
            </label>
            <div
              className={`grid gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${
                layout === 'grid'
                  ? 'grid-cols-3'
                  : layout === 'list'
                    ? 'grid-cols-1'
                    : 'grid-cols-4'
              }`}
            >
              {selectedWidgets.slice(0, 6).map((widgetId, idx) => {
                const widget = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
                return (
                  <div
                    key={idx}
                    className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-center"
                  >
                    {widget && <widget.icon className="w-4 h-4 mx-auto text-gray-400" />}
                    <p className="text-xs text-gray-500 mt-1 truncate">{widget?.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !name || selectedWidgets.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
