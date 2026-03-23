import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  ExternalLink,
  Loader2,
  Target,
  TrendingUp,
  CheckCircle2,
  Star,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function LinkBuildingOpportunities({ backlinks, competitors, websites }) {
  const [opportunities, setOpportunities] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeOpportunities = async () => {
    setIsAnalyzing(true);

    try {
      const competitorNames =
        competitors
          ?.slice(0, 5)
          .map((c) => c.name)
          .join(', ') || 'industry competitors';
      const currentDomains = [...new Set(backlinks.map((b) => b.source_domain))].slice(0, 20);
      const websiteDomain = websites?.[0]?.domain || 'your website';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a link building expert. Analyze potential link building opportunities for a website: ${websiteDomain}

Current backlink sources (sample): ${currentDomains.join(', ')}
Competitors to analyze: ${competitorNames}

Based on competitor analysis and industry best practices, suggest 8-10 specific link building opportunities. For each opportunity, provide:
1. A specific website or type of site to target
2. The strategy to use (guest post, resource page, broken link, HARO, etc.)
3. Estimated difficulty (easy, medium, hard)
4. Potential DA gain
5. Priority score (1-10)
6. Specific action steps

Focus on actionable, realistic opportunities that could yield high-quality backlinks.`,
        response_json_schema: {
          type: 'object',
          properties: {
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  target: { type: 'string' },
                  target_url: { type: 'string' },
                  strategy: { type: 'string' },
                  difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                  estimated_da: { type: 'number' },
                  priority: { type: 'number' },
                  action_steps: { type: 'array', items: { type: 'string' } },
                  category: { type: 'string' },
                  potential_impact: { type: 'string' },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                total_potential_links: { type: 'number' },
                avg_da: { type: 'number' },
                quick_wins: { type: 'number' },
              },
            },
          },
        },
        add_context_from_internet: true,
      });

      if (result.opportunities) {
        setOpportunities(result.opportunities.sort((a, b) => b.priority - a.priority));
        setHasAnalyzed(true);
      }
    } catch (error) {
      console.error('Failed to analyze opportunities:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Link Building Opportunities
          </CardTitle>
          {!hasAnalyzed && (
            <Button
              size="sm"
              onClick={analyzeOpportunities}
              disabled={isAnalyzing}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  Find Opportunities
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnalyzed && !isAnalyzing && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Discover new link building opportunities
            </p>
            <p className="text-xs text-gray-400">
              AI-powered competitor analysis to find untapped sources
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyzing competitor backlinks and finding opportunities...
            </p>
          </div>
        )}

        {hasAnalyzed && opportunities.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {opportunities.map((opp, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {opp.target}
                      </h4>
                      {opp.priority >= 8 && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opp.strategy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${difficultyColors[opp.difficulty]}`}>
                      {opp.difficulty}
                    </Badge>
                    <span className="text-xs font-medium text-gray-500">DA {opp.estimated_da}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {opp.potential_impact || 'High potential'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {opp.category || 'General'}
                  </span>
                </div>

                {opp.action_steps && opp.action_steps.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-1">Next Steps:</p>
                    <ul className="space-y-1">
                      {opp.action_steps.slice(0, 2).map((step, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {opp.target_url && (
                  <a
                    href={opp.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 mt-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit Site
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
