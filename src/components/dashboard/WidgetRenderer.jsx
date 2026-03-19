import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WIDGET_TYPES } from './WidgetLibrary';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function WidgetRenderer({ widgetId, data, isLoading }) {
  const widget = Object.values(WIDGET_TYPES).find((w) => w.id === widgetId);

  if (!widget) return null;

  const Icon = widget.icon;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const renderWidget = () => {
    switch (widgetId) {
      case 'contacts_count':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data?.contacts?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {data?.contacts?.filter((c) => c.status === 'lead').length || 0} leads
              </p>
            </div>
            <Icon className="w-12 h-12 text-violet-500" />
          </div>
        );

      case 'deals_value':
        const pipelineValue =
          data?.deals
            ?.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
            .reduce((sum, d) => sum + (d.value || 0), 0) || 0;
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(pipelineValue / 1000).toFixed(0)}k
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {data?.deals?.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
                  .length || 0}{' '}
                active deals
              </p>
            </div>
            <Icon className="w-12 h-12 text-green-500" />
          </div>
        );

      case 'conversion_rate':
        const leads = data?.contacts?.filter((c) => c.status === 'lead').length || 0;
        const customers = data?.contacts?.filter((c) => c.status === 'customer').length || 0;
        const rate = leads > 0 ? ((customers / (leads + customers)) * 100).toFixed(1) : 0;
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{rate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Conversion rate</p>
            </div>
            <Icon className="w-12 h-12 text-blue-500" />
          </div>
        );

      case 'revenue_chart':
        const revenueData =
          data?.deals
            ?.filter((d) => d.stage === 'closed_won' && d.created_date)
            .reduce((acc, deal) => {
              const month = new Date(deal.created_date).toLocaleDateString('en-US', {
                month: 'short',
              });
              const existing = acc.find((item) => item.month === month);
              if (existing) {
                existing.revenue += deal.value || 0;
              } else {
                acc.push({ month, revenue: deal.value || 0 });
              }
              return acc;
            }, []) || [];

        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'deals_by_stage':
        const stageData =
          data?.deals?.reduce((acc, deal) => {
            const stage = deal.stage || 'unknown';
            const existing = acc.find((item) => item.name === stage);
            if (existing) {
              existing.value += 1;
            } else {
              acc.push({ name: stage.replace('_', ' '), value: 1 });
            }
            return acc;
          }, []) || [];

        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'keyword_rankings':
        const topKeywords =
          data?.keywords?.filter((k) => k.current_position <= 10).slice(0, 5) || [];
        return (
          <div className="space-y-2">
            {topKeywords.map((keyword, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <span className="text-sm truncate flex-1">{keyword.keyword}</span>
                <Badge variant="secondary">#{keyword.current_position}</Badge>
              </div>
            ))}
            {topKeywords.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No top rankings yet</p>
            )}
          </div>
        );

      case 'backlinks_count':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data?.backlinks?.filter((b) => b.status === 'active').length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active backlinks</p>
            </div>
            <Icon className="w-12 h-12 text-emerald-500" />
          </div>
        );

      case 'seo_score':
        const avgScore =
          data?.websites?.length > 0
            ? (
                data.websites.reduce((sum, w) => sum + (w.seo_score || 0), 0) / data.websites.length
              ).toFixed(0)
            : 0;
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgScore}/100</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Average SEO score</p>
            </div>
            <Icon className="w-12 h-12 text-amber-500" />
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Icon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{widget.name}</p>
          </div>
        );
    }
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{widget.name}</h3>
          <Badge variant="outline" className="text-xs">
            {widget.category}
          </Badge>
        </div>
        {renderWidget()}
      </CardContent>
    </Card>
  );
}
