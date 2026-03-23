import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Rocket,
  Loader2,
  TrendingUp,
  Flame,
  Sparkles,
  ArrowUpRight,
  Clock,
  Target,
  Plus,
  Zap,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'health', label: 'Health & Fitness' },
  { id: 'finance', label: 'Finance' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'ai', label: 'AI & Machine Learning' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

const TIMEFRAMES = [
  { id: '1m', label: 'Past Month' },
  { id: '3m', label: 'Past 3 Months' },
  { id: '6m', label: 'Past 6 Months' },
  { id: '1y', label: 'Past Year' },
];

export default function ExplodingTopicsCard({ onAddKeyword }) {
  const [category, setCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('3m');
  const [customNiche, setCustomNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState(null);

  const discoverTopics = async () => {
    setLoading(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify EXPLODING topics and trends that are rapidly growing but haven't peaked yet.
      
      ${category !== 'all' ? `Focus on: ${category}` : 'Cover all categories'}
      ${customNiche ? `Specific niche: ${customNiche}` : ''}
      Timeframe: ${TIMEFRAMES.find((t) => t.id === timeframe)?.label}
      
      For each topic, provide:
      1. Topic name
      2. Category
      3. Current status (exploding, growing, emerging, peaked)
      4. Growth rate percentage over the timeframe
      5. Search volume trend
      6. Why it's exploding (key drivers)
      7. Related keywords to target
      8. Content opportunities
      9. Best platforms to leverage this trend
      10. Estimated window of opportunity (how long before it peaks)
      
      Focus on topics that:
      - Have seen 50%+ growth recently
      - Haven't hit mainstream yet
      - Have clear content/SEO opportunity
      - Can be leveraged for early mover advantage
      
      Include a mix of:
      - Products/tools trending
      - Emerging concepts/terms
      - Rising consumer behaviors
      - New technologies
      - Trending questions people are asking`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              total_topics: { type: 'number' },
              hottest_category: { type: 'string' },
              avg_growth_rate: { type: 'number' },
            },
          },
          exploding_topics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                category: { type: 'string' },
                status: { type: 'string' },
                growth_rate: { type: 'number' },
                search_volume: { type: 'string' },
                why_exploding: { type: 'string' },
                related_keywords: { type: 'array', items: { type: 'string' } },
                content_opportunities: { type: 'array', items: { type: 'string' } },
                best_platforms: { type: 'array', items: { type: 'string' } },
                opportunity_window: { type: 'string' },
                competition_level: { type: 'string' },
              },
            },
          },
          emerging_patterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: { type: 'string' },
                description: { type: 'string' },
                related_topics: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          action_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                topic: { type: 'string' },
                urgency: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setTopics(result);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'exploding':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'growing':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'emerging':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'exploding':
        return 'bg-red-100 text-red-700';
      case 'growing':
        return 'bg-emerald-100 text-emerald-700';
      case 'emerging':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-violet-500" />
          Exploding Topics
          <Badge className="bg-violet-100 text-violet-700 ml-2">Trend Discovery</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf.id} value={tf.id}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={customNiche}
            onChange={(e) => setCustomNiche(e.target.value)}
            placeholder="Custom niche (optional)"
            className="flex-1"
          />
          <Button
            onClick={discoverTopics}
            disabled={loading}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            Discover Trends
          </Button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500 mb-3" />
            <p className="text-gray-600">Discovering exploding topics...</p>
            <p className="text-sm text-gray-400">Analyzing trends across the web</p>
          </div>
        )}

        {topics && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                <Flame className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-violet-600">
                  {topics.summary?.total_topics || 0}
                </p>
                <p className="text-xs text-gray-500">Hot Topics Found</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">
                  {topics.summary?.avg_growth_rate || 0}%
                </p>
                <p className="text-xs text-gray-500">Avg Growth Rate</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                <Target className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-amber-600">
                  {topics.summary?.hottest_category}
                </p>
                <p className="text-xs text-gray-500">Hottest Category</p>
              </div>
            </div>

            {/* Exploding Topics List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Exploding Topics
              </h3>
              {topics.exploding_topics?.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(topic.status)}
                      <h4 className="font-semibold text-gray-900">{topic.topic}</h4>
                      <Badge className={getStatusColor(topic.status)}>{topic.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                          <ArrowUpRight className="w-4 h-4" />
                          {topic.growth_rate}%
                        </p>
                        <p className="text-xs text-gray-400">growth</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{topic.why_exploding}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Search Volume</p>
                      <p className="font-medium">{topic.search_volume}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Opportunity Window</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {topic.opportunity_window}
                      </p>
                    </div>
                  </div>

                  {/* Related Keywords */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Related Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {topic.related_keywords?.slice(0, 5).map((kw, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-violet-50"
                          onClick={() => onAddKeyword?.({ keyword: kw })}
                        >
                          {kw}
                          <Plus className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Content Opportunities */}
                  <div className="p-3 bg-violet-50 rounded-lg">
                    <p className="text-xs font-medium text-violet-700 mb-1">
                      Content Opportunities:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {topic.content_opportunities?.slice(0, 3).map((opp, i) => (
                        <li key={i}>• {opp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Best Platforms */}
                  <div className="flex items-center gap-2 mt-3">
                    <p className="text-xs text-gray-500">Best on:</p>
                    {topic.best_platforms?.map((platform, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                    <Badge
                      className={
                        topic.competition_level === 'low'
                          ? 'bg-emerald-100 text-emerald-700'
                          : topic.competition_level === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }
                    >
                      {topic.competition_level} competition
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Emerging Patterns */}
            {topics.emerging_patterns?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Emerging Patterns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topics.emerging_patterns.map((pattern, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-gray-900">{pattern.pattern}</p>
                      <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pattern.related_topics?.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {topics.action_items?.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-500" />
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {topics.action_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.action}</p>
                          <p className="text-xs text-gray-500">Topic: {item.topic}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          item.urgency === 'high'
                            ? 'bg-red-100 text-red-700'
                            : item.urgency === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {item.urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!topics && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Rocket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Discover trending topics before they explode</p>
            <p className="text-sm text-gray-400">Get early mover advantage with emerging trends</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
