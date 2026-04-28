import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, Sparkles, Clock, Image, Video, FileText, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

export default function AIContentCalendarCard({ socialAccounts = [], posts = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [calendar, setCalendar] = useState(null);
  const weekOffset = 0;
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const generateCalendar = async () => {
    setIsGenerating(true);
    try {
      const accountData = socialAccounts.map((a) => ({
        platform: a.platform,
        handle: a.handle,
        followers: a.followers,
        engagement_rate: a.engagement_rate,
        best_posting_times: a.best_posting_times,
      }));

      const historicalPerformance = posts.slice(0, 30).map((p) => ({
        platform: p.platform,
        type: p.post_type,
        topic: p.topics?.[0],
        day: format(new Date(p.post_date || new Date()), 'EEEE'),
        hour: format(new Date(p.post_date || new Date()), 'HH:00'),
        engagement: p.engagement_rate,
        likes: p.likes,
        comments: p.comments,
      }));

      const startDate = startOfWeek(addWeeks(new Date(), weekOffset + 1), { weekStartsOn: 1 });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media content strategist AI. Create an optimized content calendar for the next 2 weeks.

Account Data: ${JSON.stringify(accountData)}
Historical Performance: ${JSON.stringify(historicalPerformance)}
Calendar Start Date: ${format(startDate, 'yyyy-MM-dd')}
Industry: Business/Professional

Generate a comprehensive content calendar that:
1. Optimizes posting times based on historical engagement
2. Balances content types (video, image, text, carousel)
3. Maintains consistent posting frequency per platform
4. Includes trending topics and hashtag suggestions
5. Mixes promotional, educational, and engagement content
6. Accounts for best days for each content type

Create 3-4 posts per platform per week.`,
        response_json_schema: {
          type: 'object',
          properties: {
            calendar_posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day_offset: { type: 'number' },
                  platform: { type: 'string' },
                  time: { type: 'string' },
                  content_type: { type: 'string' },
                  content_theme: { type: 'string' },
                  suggested_caption: { type: 'string' },
                  hashtags: { type: 'array', items: { type: 'string' } },
                  media_suggestion: { type: 'string' },
                  expected_engagement: { type: 'string' },
                  reasoning: { type: 'string' },
                },
              },
            },
            weekly_themes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  week: { type: 'number' },
                  theme: { type: 'string' },
                  goals: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            content_mix: {
              type: 'object',
              properties: {
                promotional: { type: 'number' },
                educational: { type: 'number' },
                engagement: { type: 'number' },
                entertainment: { type: 'number' },
              },
            },
            optimization_tips: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      });

      setCalendar(result);
    } catch (error) {
      console.error('Failed to generate calendar:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video':
      case 'reel':
        return <Video className="w-3 h-3" />;
      case 'image':
      case 'photo':
        return <Image className="w-3 h-3" />;
      case 'carousel':
        return <FileText className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
      case 'twitter':
      case 'x':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'linkedin':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      case 'facebook':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const startDate = startOfWeek(addWeeks(new Date(), weekOffset + 1), { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

  const filteredPosts =
    calendar?.calendar_posts?.filter(
      (p) => selectedPlatform === 'all' || p.platform?.toLowerCase() === selectedPlatform
    ) || [];

  const getPostsForDay = (dayOffset) => {
    return filteredPosts.filter((p) => p.day_offset === dayOffset);
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI Content Calendar Generator
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateCalendar} disabled={isGenerating} size="sm" className="gap-2">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Calendar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!calendar ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Generate an AI-optimized content calendar</p>
            <p className="text-sm mt-1">Based on your audience engagement patterns</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Themes */}
            {calendar.weekly_themes?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calendar.weekly_themes.map((week, idx) => (
                  <div key={idx} className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Week {week.week}: {week.theme}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {week.goals?.map((goal, gIdx) => (
                        <Badge key={gIdx} variant="outline" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Content Mix */}
            {calendar.content_mix && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Content Mix:</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {calendar.content_mix.promotional}% Promo
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {calendar.content_mix.educational}% Edu
                </Badge>
                <Badge className="bg-amber-100 text-amber-700">
                  {calendar.content_mix.engagement}% Engage
                </Badge>
                <Badge className="bg-pink-100 text-pink-700">
                  {calendar.content_mix.entertainment}% Fun
                </Badge>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {/* Day Headers */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}

                {/* Week 1 */}
                {days.slice(0, 7).map((date, idx) => {
                  const dayPosts = getPostsForDay(idx);
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-h-[120px]"
                    >
                      <p className="text-xs text-gray-500 mb-2">{format(date, 'MMM d')}</p>
                      <div className="space-y-1.5">
                        {dayPosts.map((post, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            title={post.suggested_caption}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Badge
                                className={`text-xs px-1.5 py-0 ${getPlatformColor(post.platform)}`}
                              >
                                {post.platform?.slice(0, 2).toUpperCase()}
                              </Badge>
                              {getContentTypeIcon(post.content_type)}
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                              {post.content_theme}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {post.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Week 2 */}
                {days.slice(7, 14).map((date, idx) => {
                  const dayPosts = getPostsForDay(idx + 7);
                  return (
                    <div
                      key={idx + 7}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-h-[120px]"
                    >
                      <p className="text-xs text-gray-500 mb-2">{format(date, 'MMM d')}</p>
                      <div className="space-y-1.5">
                        {dayPosts.map((post, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            title={post.suggested_caption}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Badge
                                className={`text-xs px-1.5 py-0 ${getPlatformColor(post.platform)}`}
                              >
                                {post.platform?.slice(0, 2).toUpperCase()}
                              </Badge>
                              {getContentTypeIcon(post.content_type)}
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                              {post.content_theme}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {post.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optimization Tips */}
            {calendar.optimization_tips?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optimization Tips
                </h4>
                <div className="space-y-1">
                  {calendar.optimization_tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post Details (expandable) */}
            {filteredPosts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Post Details
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredPosts.slice(0, 10).map((post, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPlatformColor(post.platform)}>{post.platform}</Badge>
                          <span className="text-xs text-gray-500">
                            {format(addDays(startDate, post.day_offset), 'EEE, MMM d')} at{' '}
                            {post.time}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {post.content_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {post.suggested_caption}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags?.slice(0, 5).map((tag, tIdx) => (
                          <span key={tIdx} className="text-xs text-violet-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">📷 {post.media_suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
