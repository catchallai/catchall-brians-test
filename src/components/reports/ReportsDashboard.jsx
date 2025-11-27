import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CalendarIcon, Settings2, GripVertical, X, Plus,
  TrendingUp, Users, Target, Link2, Share2, Eye
} from "lucide-react";
import { format, subDays, subMonths } from 'date-fns';
import TrafficTrendsChart from './charts/TrafficTrendsChart';
import KeywordRankingsChart from './charts/KeywordRankingsChart';
import SocialEngagementChart from './charts/SocialEngagementChart';
import BacklinksGrowthChart from './charts/BacklinksGrowthChart';
import ConversionFunnelChart from './charts/ConversionFunnelChart';
import TopPagesChart from './charts/TopPagesChart';

const AVAILABLE_WIDGETS = [
  { id: 'traffic', name: 'Website Traffic', icon: Eye, component: TrafficTrendsChart },
  { id: 'keywords', name: 'Keyword Rankings', icon: Target, component: KeywordRankingsChart },
  { id: 'social', name: 'Social Engagement', icon: Share2, component: SocialEngagementChart },
  { id: 'backlinks', name: 'Backlinks Growth', icon: Link2, component: BacklinksGrowthChart },
  { id: 'conversions', name: 'Conversion Funnel', icon: TrendingUp, component: ConversionFunnelChart },
  { id: 'pages', name: 'Top Pages', icon: Users, component: TopPagesChart },
];

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', value: '30d', getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Last 3 months', value: '3m', getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: 'Last 6 months', value: '6m', getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: 'Last year', value: '1y', getRange: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  { label: 'Custom', value: 'custom', getRange: () => null },
];

export default function ReportsDashboard({ websites = [], keywords = [], mentions = [], backlinks = [] }) {
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [reportType, setReportType] = useState('all');
  const [activeWidgets, setActiveWidgets] = useState(['traffic', 'keywords', 'social', 'backlinks']);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  const getDateRange = () => {
    if (dateRange === 'custom') return customRange;
    const range = DATE_RANGES.find(r => r.value === dateRange);
    return range?.getRange() || { from: subDays(new Date(), 30), to: new Date() };
  };

  const currentRange = getDateRange();

  const toggleWidget = (widgetId) => {
    setActiveWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const removeWidget = (widgetId) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Selector */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 dark:bg-gray-700 dark:border-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Date Picker */}
              {dateRange === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="dark:bg-gray-700 dark:border-gray-600">
                      {customRange.from && customRange.to ? (
                        <>
                          {format(customRange.from, 'MMM d')} - {format(customRange.to, 'MMM d, yyyy')}
                        </>
                      ) : (
                        'Select dates'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={(range) => range && setCustomRange(range)}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Report Type Filter */}
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-36 dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                </SelectContent>
              </Select>

              {/* Active Filters */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="dark:bg-gray-700">
                  {format(currentRange.from, 'MMM d')} - {format(currentRange.to, 'MMM d')}
                </Badge>
              </div>
            </div>

            {/* Widget Customization */}
            <Popover open={showWidgetSelector} onOpenChange={setShowWidgetSelector}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 dark:bg-gray-700 dark:border-gray-600">
                  <Settings2 className="w-4 h-4" />
                  Customize Widgets
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Choose Widgets</h4>
                <div className="space-y-2">
                  {AVAILABLE_WIDGETS.map(widget => (
                    <label 
                      key={widget.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <Checkbox 
                        checked={activeWidgets.includes(widget.id)}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                      <widget.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{widget.name}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeWidgets.map(widgetId => {
          const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
          if (!widget) return null;
          const WidgetComponent = widget.component;

          return (
            <Card key={widgetId} className="border-0 shadow-sm bg-white dark:bg-gray-800 relative group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab" />
                  <widget.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <CardTitle className="text-base font-medium text-gray-900 dark:text-white">
                    {widget.name}
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => removeWidget(widgetId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <WidgetComponent 
                  dateRange={currentRange}
                  websites={websites}
                  keywords={keywords}
                  mentions={mentions}
                  backlinks={backlinks}
                  reportType={reportType}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Widget Button */}
      {activeWidgets.length < AVAILABLE_WIDGETS.length && (
        <Card 
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent hover:border-violet-300 dark:hover:border-violet-600 cursor-pointer transition-colors"
          onClick={() => setShowWidgetSelector(true)}
        >
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Add Widget</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}