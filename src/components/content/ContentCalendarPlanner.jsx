import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, Sparkles, Clock, Target } from 'lucide-react';

export default function ContentCalendarPlanner({ keywords, selectedTopic }) {
  const [isPlanning, setIsPlanning] = useState(false);
  const [calendar, setCalendar] = useState(null);
  const [duration, setDuration] = useState('month');
  const [postsPerWeek, setPostsPerWeek] = useState('3');
  const [focusKeyword, setFocusKeyword] = useState(selectedTopic?.keyword || '');

  const generateCalendar = async () => {
    setIsPlanning(true);

    const keywordList = keywords
      .slice(0, 20)
      .map((k) => k.keyword)
      .join(', ');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create an optimized content calendar for the next ${duration}.
      Posts per week: ${postsPerWeek}
      ${focusKeyword ? `Focus keyword/topic: ${focusKeyword}` : ''}
      Available keywords: ${keywordList || 'general topics'}
      ${selectedTopic ? `Priority topic: ${selectedTopic.topic}` : ''}
      
      Create a strategic content calendar that:
      1. Balances content types (blog posts, guides, videos, etc.)
      2. Targets different funnel stages (awareness, consideration, decision)
      3. Includes seasonal or timely content where relevant
      4. Builds topical clusters for SEO
      5. Maintains consistent publishing rhythm
      
      For each content piece provide:
      - Suggested publish date (use real dates starting from today)
      - Title
      - Content type
      - Target keyword
      - Funnel stage
      - Estimated time to create (hours)
      - Priority level
      - Related content to link to
      
      Also provide:
      - Overall strategy summary
      - Key themes for the period
      - Important dates/events to leverage`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          strategy_summary: { type: 'string' },
          key_themes: { type: 'array', items: { type: 'string' } },
          important_dates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                event: { type: 'string' },
                content_opportunity: { type: 'string' },
              },
            },
          },
          content_pieces: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                publish_date: { type: 'string' },
                title: { type: 'string' },
                content_type: { type: 'string' },
                keyword: { type: 'string' },
                funnel_stage: { type: 'string' },
                hours_to_create: { type: 'number' },
                priority: { type: 'string' },
                related_content: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    });

    setCalendar(result);
    setIsPlanning(false);
  };

  const funnelColors = {
    awareness: 'bg-blue-100 text-blue-700',
    consideration: 'bg-amber-100 text-amber-700',
    decision: 'bg-emerald-100 text-emerald-700',
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-700',
  };

  const groupByWeek = (items) => {
    const weeks = {};
    items?.forEach((item) => {
      const date = new Date(item.publish_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(item);
    });
    return weeks;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-500" />
          Content Calendar Planner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            placeholder="Focus keyword or topic"
            className="flex-1 min-w-[200px]"
          />
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1 Week</SelectItem>
              <SelectItem value="2weeks">2 Weeks</SelectItem>
              <SelectItem value="month">1 Month</SelectItem>
              <SelectItem value="quarter">3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={postsPerWeek} onValueChange={setPostsPerWeek}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 post/week</SelectItem>
              <SelectItem value="2">2 posts/week</SelectItem>
              <SelectItem value="3">3 posts/week</SelectItem>
              <SelectItem value="5">5 posts/week</SelectItem>
              <SelectItem value="7">Daily</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={generateCalendar}
            disabled={isPlanning}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isPlanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Calendar
          </Button>
        </div>

        {isPlanning && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Planning your content calendar...</p>
                <p className="text-sm text-violet-600">Creating an optimized publishing schedule</p>
              </div>
            </div>
          </div>
        )}

        {calendar && (
          <div className="space-y-6">
            {/* Strategy Summary */}
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2">Strategy Summary</h4>
              <p className="text-sm text-gray-700">{calendar.strategy_summary}</p>
              {calendar.key_themes?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Key Themes:</p>
                  <div className="flex flex-wrap gap-1">
                    {calendar.key_themes.map((theme, idx) => (
                      <Badge key={idx} className="bg-violet-100 text-violet-700">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Important Dates */}
            {calendar.important_dates?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Important Dates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {calendar.important_dates.map((date, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-gray-900">{date.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{date.event}</p>
                      <p className="text-xs text-amber-700 mt-1">💡 {date.content_opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar View */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Content Schedule</h4>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {Object.entries(groupByWeek(calendar.content_pieces)).map(
                    ([weekStart, items]) => (
                      <div key={weekStart}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-gray-200" />
                          <span className="text-sm font-medium text-gray-500">
                            Week of{' '}
                            {new Date(weekStart).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.publish_date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                  <h5 className="font-medium text-gray-900">{item.title}</h5>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge variant="outline">{item.content_type}</Badge>
                                    <Badge
                                      className={
                                        funnelColors[item.funnel_stage?.toLowerCase()] ||
                                        funnelColors.awareness
                                      }
                                    >
                                      {item.funnel_stage}
                                    </Badge>
                                    <Badge
                                      className={
                                        priorityColors[item.priority?.toLowerCase()] ||
                                        priorityColors.medium
                                      }
                                    >
                                      {item.priority}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {item.hours_to_create}h
                                    </span>
                                  </div>
                                  {item.keyword && (
                                    <div className="mt-2 text-xs text-gray-500">
                                      <Target className="w-3 h-3 inline mr-1" />
                                      {item.keyword}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {calendar.content_pieces?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Total Pieces</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {calendar.content_pieces?.reduce((sum, p) => sum + (p.hours_to_create || 0), 0) ||
                    0}
                  h
                </p>
                <p className="text-sm text-gray-500">Total Effort</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {calendar.content_pieces?.filter((p) => p.priority === 'high').length || 0}
                </p>
                <p className="text-sm text-gray-500">High Priority</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
