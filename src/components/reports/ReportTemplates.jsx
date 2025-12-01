import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, BarChart2, TrendingUp, Users, Target, Link2, Globe, MapPin, Search,
  Mail, Share2, FileText, PieChart, Activity, Zap, Trash2
} from "lucide-react";

const ICON_MAP = {
  Search, Target, Link2, MapPin, Users, FileText, PieChart, TrendingUp, Share2, Mail, Activity, BarChart2
};

export const REPORT_TEMPLATES = [
  { 
    id: 'scratch', 
    name: 'Start from scratch', 
    description: 'Build a custom report with the metrics you need.',
    icon: Plus, 
    color: 'bg-emerald-500 text-white',
    iconBg: 'bg-white/20',
    category: 'custom',
    metrics: []
  },
  { 
    id: 'seo_overview', 
    name: 'SEO Overview', 
    description: 'Complete SEO health check including rankings, traffic, and technical issues.',
    icon: Search, 
    color: 'bg-white',
    iconBg: 'bg-blue-100 text-blue-600',
    category: 'seo',
    metrics: ['organic_traffic', 'keyword_rankings', 'backlinks', 'domain_authority', 'technical_issues']
  },
  { 
    id: 'keyword_performance', 
    name: 'Keyword Performance', 
    description: 'Track keyword rankings, search volume, and position changes over time.',
    icon: Target, 
    color: 'bg-white',
    iconBg: 'bg-violet-100 text-violet-600',
    category: 'seo',
    metrics: ['keyword_positions', 'ranking_changes', 'search_volume', 'keyword_difficulty', 'serp_features']
  },
  { 
    id: 'backlink_audit', 
    name: 'Backlink Audit', 
    description: 'Analyze your backlink profile, find toxic links, and discover opportunities.',
    icon: Link2, 
    color: 'bg-white',
    iconBg: 'bg-green-100 text-green-600',
    category: 'seo',
    metrics: ['total_backlinks', 'referring_domains', 'anchor_text', 'link_quality', 'new_lost_links']
  },
  { 
    id: 'local_seo', 
    name: 'Local SEO Report', 
    description: 'Track local rankings, GBP performance, and citation consistency.',
    icon: MapPin, 
    color: 'bg-white',
    iconBg: 'bg-red-100 text-red-600',
    category: 'local',
    metrics: ['local_rankings', 'gbp_insights', 'citations', 'reviews', 'local_competitors']
  },
  { 
    id: 'competitor_analysis', 
    name: 'Competitor Analysis', 
    description: 'Compare your performance against competitors across key metrics.',
    icon: Users, 
    color: 'bg-white',
    iconBg: 'bg-orange-100 text-orange-600',
    category: 'competitive',
    metrics: ['competitor_traffic', 'keyword_gap', 'backlink_gap', 'content_gap', 'share_of_voice']
  },
  { 
    id: 'content_performance', 
    name: 'Content Performance', 
    description: 'Analyze which content drives traffic, engagement, and conversions.',
    icon: FileText, 
    color: 'bg-white',
    iconBg: 'bg-amber-100 text-amber-600',
    category: 'content',
    metrics: ['top_pages', 'content_traffic', 'engagement_metrics', 'conversion_rate', 'content_decay']
  },
  { 
    id: 'crm_pipeline', 
    name: 'CRM Pipeline Report', 
    description: 'Track deals, conversion rates, and revenue across your sales pipeline.',
    icon: PieChart, 
    color: 'bg-white',
    iconBg: 'bg-indigo-100 text-indigo-600',
    category: 'crm',
    metrics: ['deals_by_stage', 'conversion_rates', 'revenue', 'avg_deal_size', 'sales_velocity']
  },
  { 
    id: 'campaign_roi', 
    name: 'Campaign ROI', 
    description: 'Measure campaign performance, leads generated, and return on investment.',
    icon: TrendingUp, 
    color: 'bg-white',
    iconBg: 'bg-teal-100 text-teal-600',
    category: 'marketing',
    metrics: ['campaign_leads', 'cost_per_lead', 'conversion_rate', 'revenue_attributed', 'roi']
  },
  { 
    id: 'social_media', 
    name: 'Social Media Report', 
    description: 'Track social engagement, follower growth, and content performance.',
    icon: Share2, 
    color: 'bg-white',
    iconBg: 'bg-pink-100 text-pink-600',
    category: 'social',
    metrics: ['followers', 'engagement_rate', 'post_performance', 'mentions', 'sentiment']
  },
  { 
    id: 'email_marketing', 
    name: 'Email Marketing', 
    description: 'Analyze email campaign performance, open rates, and subscriber growth.',
    icon: Mail, 
    color: 'bg-white',
    iconBg: 'bg-cyan-100 text-cyan-600',
    category: 'marketing',
    metrics: ['emails_sent', 'open_rate', 'click_rate', 'unsubscribes', 'conversions']
  },
  { 
    id: 'weekly_digest', 
    name: 'Weekly Digest', 
    description: 'Automated weekly summary of all key metrics and notable changes.',
    icon: Activity, 
    color: 'bg-white',
    iconBg: 'bg-purple-100 text-purple-600',
    category: 'summary',
    metrics: ['traffic_summary', 'ranking_changes', 'new_leads', 'revenue', 'alerts']
  }
];

const categoryLabels = {
  custom: 'Custom',
  seo: 'SEO',
  local: 'Local',
  competitive: 'Competitive',
  content: 'Content',
  crm: 'CRM',
  marketing: 'Marketing',
  social: 'Social',
  summary: 'Summary'
};

export default function ReportTemplates({ onSelect, selectedCategory = 'all', customTemplates = [], onDeleteTemplate, onCreateTemplate }) {
  const allTemplates = [
    ...REPORT_TEMPLATES,
    ...customTemplates.map(t => ({
      ...t,
      icon: ICON_MAP[t.icon] || FileText,
      color: 'bg-white',
      iconBg: 'bg-gray-100 text-gray-600',
      isCustomTemplate: true
    }))
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.category === selectedCategory || t.id === 'scratch');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ready-to-use templates</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['all', 'seo', 'crm', 'marketing', 'social'].map(cat => (
              <Badge 
                key={cat} 
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
              >
                {cat === 'all' ? 'All' : categoryLabels[cat]}
              </Badge>
            ))}
          </div>
          {onCreateTemplate && (
            <Button size="sm" onClick={onCreateTemplate} className="gap-1">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const isCustom = template.id === 'scratch';
          const isUserTemplate = template.isCustomTemplate;
          return (
            <Card 
              key={template.id}
              onClick={() => onSelect(template)}
              className={`cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative group ${isCustom ? template.color : 'bg-white dark:bg-gray-800'}`}
            >
              <CardContent className="p-4">
                {isUserTemplate && onDeleteTemplate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${template.iconBg}`}>
                  <Icon className={`w-5 h-5 ${isCustom ? 'text-white' : ''}`} />
                </div>
                <h3 className={`font-medium text-sm mb-1 ${isCustom ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {template.name}
                </h3>
                <p className={`text-xs line-clamp-2 ${isCustom ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {template.description}
                </p>
                {template.metrics?.length > 0 && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                      {template.metrics.length} metrics
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}