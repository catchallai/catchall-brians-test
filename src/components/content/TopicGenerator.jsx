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
import {
  Lightbulb,
  Loader2,
  TrendingUp,
  Users,
  Sparkles,
  BarChart2,
  Zap,
  BookOpen,
} from 'lucide-react';

export default function TopicGenerator({ keywords, competitors, contentInsights, onSelectTopic }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [topics, setTopics] = useState(null);
  const [focusArea, setFocusArea] = useState('');
  const [contentGoal, setContentGoal] = useState('traffic');

  const generateTopics = async () => {
    setIsGenerating(true);

    const keywordList = keywords
      .slice(0, 15)
      .map((k) => k.keyword)
      .join(', ');
    const competitorList = competitors
      .slice(0, 5)
      .map((c) => `${c.name}: ${c.top_content?.join(', ') || 'unknown content'}`)
      .join('; ');
    const trendingTopics = contentInsights
      .flatMap((i) => i.trending_topics || [])
      .slice(0, 10)
      .join(', ');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate compelling content topic ideas for a business.
      ${focusArea ? `Focus area: ${focusArea}` : ''}
      Content goal: ${contentGoal}
      Current keywords: ${keywordList || 'general topics'}
      Competitor content: ${competitorList || 'unknown'}
      Trending in industry: ${trendingTopics || 'various topics'}
      
      Generate topics in these categories:
      
      1. TRENDING TOPICS (5 topics):
         - Based on current industry news and trends
         - Timely and relevant content opportunities
         - Include why it's trending now
      
      2. EVERGREEN CONTENT (5 topics):
         - Long-lasting value content
         - Comprehensive guides and resources
         - Topics that will drive traffic over time
      
      3. COMPETITOR-INSPIRED (5 topics):
         - Topics competitors are ranking for
         - Ways to create better content than competitors
         - Untapped angles on popular topics
      
      4. DATA-DRIVEN CONTENT (3 topics):
         - Original research opportunities
         - Survey or study ideas
         - Industry report concepts
      
      5. INTERACTIVE/TOOL CONTENT (3 topics):
         - Calculator or tool ideas
         - Quiz or assessment concepts
         - Template or checklist ideas
      
      For each topic provide:
      - Title/headline
      - Brief description
      - Content type (blog, guide, video, infographic, tool)
      - Estimated effort (low/medium/high)
      - Traffic potential (low/medium/high)
      - Primary keyword to target
      - Unique angle or hook`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          trending: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content_type: { type: 'string' },
                effort: { type: 'string' },
                traffic_potential: { type: 'string' },
                keyword: { type: 'string' },
                hook: { type: 'string' },
                why_trending: { type: 'string' },
              },
            },
          },
          evergreen: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content_type: { type: 'string' },
                effort: { type: 'string' },
                traffic_potential: { type: 'string' },
                keyword: { type: 'string' },
                hook: { type: 'string' },
              },
            },
          },
          competitor_inspired: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content_type: { type: 'string' },
                effort: { type: 'string' },
                traffic_potential: { type: 'string' },
                keyword: { type: 'string' },
                hook: { type: 'string' },
                competitor_reference: { type: 'string' },
              },
            },
          },
          data_driven: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content_type: { type: 'string' },
                effort: { type: 'string' },
                traffic_potential: { type: 'string' },
                keyword: { type: 'string' },
                hook: { type: 'string' },
              },
            },
          },
          interactive: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content_type: { type: 'string' },
                effort: { type: 'string' },
                traffic_potential: { type: 'string' },
                keyword: { type: 'string' },
                hook: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setTopics(result);
    setIsGenerating(false);
  };

  const effortColors = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };

  const trafficColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-violet-100 text-violet-700',
  };

  const categoryConfig = {
    trending: { icon: TrendingUp, color: 'text-red-500', label: 'Trending Topics' },
    evergreen: { icon: BookOpen, color: 'text-emerald-500', label: 'Evergreen Content' },
    competitor_inspired: { icon: Users, color: 'text-blue-500', label: 'Competitor-Inspired' },
    data_driven: { icon: BarChart2, color: 'text-purple-500', label: 'Data-Driven' },
    interactive: { icon: Zap, color: 'text-amber-500', label: 'Interactive Content' },
  };

  const renderTopicCard = (topic, _category) => (
    <div
      className="p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all cursor-pointer"
      onClick={() =>
        onSelectTopic?.({
          topic: topic.title,
          content_type: topic.content_type,
          keyword: topic.keyword,
        })
      }
    >
      <h4 className="font-medium text-gray-900">{topic.title}</h4>
      <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant="outline">{topic.content_type}</Badge>
        <Badge className={effortColors[topic.effort?.toLowerCase()] || effortColors.medium}>
          {topic.effort} effort
        </Badge>
        <Badge
          className={trafficColors[topic.traffic_potential?.toLowerCase()] || trafficColors.medium}
        >
          {topic.traffic_potential} traffic
        </Badge>
      </div>
      {topic.keyword && (
        <div className="mt-2 text-xs text-gray-500">
          Target keyword: <span className="font-medium">{topic.keyword}</span>
        </div>
      )}
      {topic.hook && (
        <div className="mt-2 p-2 bg-violet-50 rounded text-sm text-violet-700">💡 {topic.hook}</div>
      )}
    </div>
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Topic Idea Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder="Focus area (e.g., product features, industry trends)"
            className="flex-1 min-w-[200px]"
          />
          <Select value={contentGoal} onValueChange={setContentGoal}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="traffic">Drive Traffic</SelectItem>
              <SelectItem value="leads">Generate Leads</SelectItem>
              <SelectItem value="authority">Build Authority</SelectItem>
              <SelectItem value="engagement">Boost Engagement</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={generateTopics}
            disabled={isGenerating}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Ideas
          </Button>
        </div>

        {isGenerating && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Generating topic ideas...</p>
                <p className="text-sm text-violet-600">
                  Analyzing trends, competitors, and opportunities
                </p>
              </div>
            </div>
          </div>
        )}

        {topics && (
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const categoryTopics = topics[key];
                if (!categoryTopics?.length) {
                  return null;
                }
                const Icon = config.icon;

                return (
                  <div key={key}>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      {config.label}
                      <Badge variant="outline">{categoryTopics.length}</Badge>
                    </h3>
                    <div className="grid gap-3">
                      {categoryTopics.map((topic, idx) => (
                        <div key={idx}>{renderTopicCard(topic, key)}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
