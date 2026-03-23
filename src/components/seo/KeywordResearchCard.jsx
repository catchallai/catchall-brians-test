import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Loader2,
  TrendingUp,
  Target,
  ArrowRight,
  Plus,
  Sparkles,
  BarChart2,
  Zap,
} from 'lucide-react';

const difficultyColors = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

export default function KeywordResearchCard({ onAddKeyword }) {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState(null);

  const researchKeywords = async () => {
    if (!seedKeyword.trim()) {
      return;
    }

    setIsResearching(true);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Perform comprehensive keyword research for: "${seedKeyword}"
      
      Analyze this topic/keyword and provide:
      
      1. PRIMARY KEYWORD ANALYSIS:
         - Estimated monthly search volume
         - Keyword difficulty score (0-100)
         - CPC estimate
         - Search intent (informational, transactional, navigational, commercial)
         - Competition level
      
      2. RELATED KEYWORDS (10-15 keywords):
         For each provide: keyword, search volume, difficulty, CPC, relevance score
         Include:
         - Long-tail variations
         - Question-based keywords
         - LSI (Latent Semantic Indexing) keywords
         - Competitor keywords
      
      3. CONTENT OPPORTUNITIES:
         - Top 5 content ideas based on these keywords
         - Recommended content types (blog, guide, video, etc.)
      
      4. SERP FEATURES:
         - What SERP features appear for this keyword
         - Featured snippet opportunity
         - People Also Ask questions
      
      5. TRENDING INSIGHTS:
         - Is this keyword trending up or down
         - Seasonal patterns
         - Related trending topics`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          primary_keyword: {
            type: 'object',
            properties: {
              keyword: { type: 'string' },
              search_volume: { type: 'number' },
              difficulty: { type: 'number' },
              cpc: { type: 'number' },
              intent: { type: 'string' },
              competition: { type: 'string' },
            },
          },
          related_keywords: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                search_volume: { type: 'number' },
                difficulty: { type: 'number' },
                cpc: { type: 'number' },
                relevance: { type: 'number' },
                type: { type: 'string' },
              },
            },
          },
          content_opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content_type: { type: 'string' },
                target_keywords: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          serp_features: {
            type: 'object',
            properties: {
              featured_snippet: { type: 'boolean' },
              people_also_ask: { type: 'array', items: { type: 'string' } },
              features_present: { type: 'array', items: { type: 'string' } },
            },
          },
          trending: {
            type: 'object',
            properties: {
              direction: { type: 'string' },
              seasonality: { type: 'string' },
              related_trends: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    });

    setResults(analysis);
    setIsResearching(false);
  };

  const getDifficultyLevel = (score) => {
    if (score <= 30) {
      return 'easy';
    }
    if (score <= 60) {
      return 'medium';
    }
    return 'hard';
  };

  const formatVolume = (vol) => {
    if (vol >= 1000000) {
      return `${(vol / 1000000).toFixed(1)}M`;
    }
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}K`;
    }
    return vol;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5 text-violet-500" />
          Keyword Research Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            value={seedKeyword}
            onChange={(e) => setSeedKeyword(e.target.value)}
            placeholder="Enter a seed keyword or topic..."
            onKeyDown={(e) => e.key === 'Enter' && researchKeywords()}
            className="flex-1"
          />
          <Button
            onClick={researchKeywords}
            disabled={isResearching || !seedKeyword.trim()}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isResearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Research
          </Button>
        </div>

        {isResearching && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Researching keywords...</p>
                <p className="text-sm text-violet-600">
                  Analyzing search volume, difficulty, and opportunities
                </p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Primary Keyword */}
            {results.primary_keyword && (
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {results.primary_keyword.keyword}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {results.primary_keyword.intent} intent
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddKeyword?.(results.primary_keyword)}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Track
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Search Volume</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatVolume(results.primary_keyword.search_volume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Difficulty</p>
                    <div className="flex items-center gap-2">
                      <Progress value={results.primary_keyword.difficulty} className="h-2 flex-1" />
                      <span className="text-sm font-medium">
                        {results.primary_keyword.difficulty}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CPC</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${results.primary_keyword.cpc?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Competition</p>
                    <Badge
                      className={
                        difficultyColors[getDifficultyLevel(results.primary_keyword.difficulty)]
                      }
                    >
                      {results.primary_keyword.competition}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Related Keywords */}
            {results.related_keywords?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" />
                  Related Keywords ({results.related_keywords.length})
                </h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {results.related_keywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{kw.keyword}</span>
                            <Badge variant="outline" className="text-xs">
                              {kw.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              {formatVolume(kw.search_volume)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {kw.difficulty}/100
                            </span>
                            <span>${kw.cpc?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={difficultyColors[getDifficultyLevel(kw.difficulty)]}>
                            {getDifficultyLevel(kw.difficulty)}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onAddKeyword?.(kw)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Content Opportunities */}
            {results.content_opportunities?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Content Opportunities
                </h4>
                <div className="grid gap-2">
                  {results.content_opportunities.map((opp, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-blue-100 text-blue-700">{opp.content_type}</Badge>
                        <span className="font-medium text-gray-900">{opp.title}</span>
                      </div>
                      {opp.target_keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opp.target_keywords.map((tk, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tk}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People Also Ask */}
            {results.serp_features?.people_also_ask?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">People Also Ask</h4>
                <div className="space-y-2">
                  {results.serp_features.people_also_ask.map((q, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded-lg flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-amber-600" />
                      <span className="text-gray-700">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Insights */}
            {results.trending && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Trending Insights
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Trend Direction</p>
                    <Badge
                      className={
                        results.trending.direction === 'up'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {results.trending.direction}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seasonality</p>
                    <p className="text-sm font-medium">{results.trending.seasonality}</p>
                  </div>
                </div>
                {results.trending.related_trends?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Related Trends</p>
                    <div className="flex flex-wrap gap-1">
                      {results.trending.related_trends.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
