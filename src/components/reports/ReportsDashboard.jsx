import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon,
  TrendingUp,
  Users,
  Target,
  Link2,
  Share2,
  Eye,
  BarChart2,
  Radar,
  Grid3X3,
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import TrafficTrendsChart from './charts/TrafficTrendsChart';
import KeywordRankingsChart from './charts/KeywordRankingsChart';
import SocialEngagementChart from './charts/SocialEngagementChart';
import BacklinksGrowthChart from './charts/BacklinksGrowthChart';
import ConversionFunnelChart from './charts/ConversionFunnelChart';
import TopPagesChart from './charts/TopPagesChart';
import DraggableDashboard from '@/components/dashboard/DraggableDashboard';
import ScatterPlotChart from '@/components/charts/ScatterPlotChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import RadarComparisonChart from '@/components/charts/RadarComparisonChart';

const AVAILABLE_WIDGETS = [
  {
    id: 'traffic',
    name: 'Website Traffic',
    icon: Eye,
    component: TrafficTrendsChart,
    description: 'Traffic trends over time',
  },
  {
    id: 'keywords',
    name: 'Keyword Rankings',
    icon: Target,
    component: KeywordRankingsChart,
    description: 'Keyword position tracking',
  },
  {
    id: 'social',
    name: 'Social Engagement',
    icon: Share2,
    component: SocialEngagementChart,
    description: 'Social media metrics',
  },
  {
    id: 'backlinks',
    name: 'Backlinks Growth',
    icon: Link2,
    component: BacklinksGrowthChart,
    description: 'Backlink acquisition',
  },
  {
    id: 'conversions',
    name: 'Conversion Funnel',
    icon: TrendingUp,
    component: ConversionFunnelChart,
    description: 'Conversion analysis',
  },
  {
    id: 'pages',
    name: 'Top Pages',
    icon: Users,
    component: TopPagesChart,
    description: 'Best performing pages',
  },
  {
    id: 'scatter',
    name: 'Traffic vs Rankings',
    icon: BarChart2,
    component: 'scatter',
    description: 'Scatter plot analysis',
  },
  {
    id: 'heatmap',
    name: 'Activity Heatmap',
    icon: Grid3X3,
    component: 'heatmap',
    description: 'Activity by day/hour',
  },
  {
    id: 'radar',
    name: 'SEO Comparison',
    icon: Radar,
    component: 'radar',
    description: 'Multi-metric comparison',
  },
];

const DATE_RANGES = [
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: 'Last 3 months',
    value: '3m',
    getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: 'Last 6 months',
    value: '6m',
    getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: 'Last year',
    value: '1y',
    getRange: () => ({ from: subMonths(new Date(), 12), to: new Date() }),
  },
  { label: 'Custom', value: 'custom', getRange: () => null },
];

export default function ReportsDashboard({
  websites = [],
  keywords = [],
  mentions = [],
  backlinks = [],
}) {
  const [dateRange, setDateRange] = useState('30d');
  const [customRange, setCustomRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [reportType, setReportType] = useState('all');
  const [activeWidgets, setActiveWidgets] = useState([
    'traffic',
    'keywords',
    'social',
    'backlinks',
  ]);
  const [widgetSizes, setWidgetSizes] = useState({});

  const getDateRange = () => {
    if (dateRange === 'custom') {
      return customRange;
    }
    const range = DATE_RANGES.find((r) => r.value === dateRange);
    return range?.getRange() || { from: subDays(new Date(), 30), to: new Date() };
  };

  const currentRange = getDateRange();

  const handleWidgetsReorder = (newOrder) => {
    setActiveWidgets(newOrder);
  };

  const handleWidgetRemove = (widgetId) => {
    setActiveWidgets((prev) => prev.filter((id) => id !== widgetId));
  };

  const handleWidgetAdd = (widgetId) => {
    if (!activeWidgets.includes(widgetId)) {
      setActiveWidgets((prev) => [...prev, widgetId]);
    }
  };

  const handleWidgetResize = (widgetId, size) => {
    setWidgetSizes((prev) => ({ ...prev, [widgetId]: size }));
  };

  // Generate sample data for new chart types
  const scatterData = keywords.slice(0, 20).map((k) => ({
    x: k.search_volume || Math.random() * 10000,
    y: k.current_position || Math.random() * 50,
    z: k.difficulty || Math.random() * 100,
    name: k.keyword,
    category: k.difficulty > 50 ? 'High Competition' : 'Low Competition',
  }));

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['9am', '12pm', '3pm', '6pm', '9pm'];
  const heatmapData = [];
  days.forEach((day) => {
    hours.forEach((hour) => {
      heatmapData.push({ y: day, x: hour, value: Math.floor(Math.random() * 500) });
    });
  });

  const radarData = [
    { subject: 'Traffic', current: 85, previous: 70 },
    { subject: 'Rankings', current: 72, previous: 65 },
    { subject: 'Backlinks', current: 90, previous: 80 },
    { subject: 'Content', current: 60, previous: 55 },
    { subject: 'Technical', current: 78, previous: 72 },
    { subject: 'Social', current: 65, previous: 50 },
  ];

  const renderWidget = (widget, { isExpanded }) => {
    const props = {
      dateRange: currentRange,
      websites,
      keywords,
      mentions,
      backlinks,
      reportType,
    };

    if (widget.component === 'scatter') {
      return (
        <ScatterPlotChart
          data={scatterData}
          xKey="x"
          yKey="y"
          zKey="z"
          xLabel="Search Volume"
          yLabel="Position"
          groupKey="category"
        />
      );
    }

    if (widget.component === 'heatmap') {
      return (
        <HeatmapChart
          data={heatmapData}
          xLabels={hours}
          yLabels={days}
          colorScheme="violet"
          showValues={true}
        />
      );
    }

    if (widget.component === 'radar') {
      return (
        <RadarComparisonChart
          data={radarData}
          dataKeys={['current', 'previous']}
          nameKey="subject"
          height={isExpanded ? 350 : 220}
        />
      );
    }

    const WidgetComponent = widget.component;
    return <WidgetComponent {...props} />;
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
                  {DATE_RANGES.map((range) => (
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
                          {format(customRange.from, 'MMM d')} -{' '}
                          {format(customRange.to, 'MMM d, yyyy')}
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
          </div>
        </CardContent>
      </Card>

      {/* Draggable Widgets Dashboard */}
      <DraggableDashboard
        widgets={AVAILABLE_WIDGETS}
        availableWidgets={AVAILABLE_WIDGETS}
        activeWidgetIds={activeWidgets}
        widgetSizes={widgetSizes}
        onWidgetsReorder={handleWidgetsReorder}
        onWidgetRemove={handleWidgetRemove}
        onWidgetAdd={handleWidgetAdd}
        onWidgetResize={handleWidgetResize}
        renderWidget={renderWidget}
      />
    </div>
  );
}
