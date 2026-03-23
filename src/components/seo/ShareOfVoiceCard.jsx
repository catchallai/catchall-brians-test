import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Volume2, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ShareOfVoiceCard({ website, keywords, onSaveSov }) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [sovData, setSovData] = useState(null);

  const calculateSov = async () => {
    setIsCalculating(true);

    const keywordData = keywords
      .filter((k) => k.website_id === website?.id)
      .map((k) => ({
        keyword: k.keyword,
        position: k.current_position,
        volume: k.search_volume,
      }));

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Calculate Share of Voice for this website based on keyword rankings.

WEBSITE: ${website?.name} (${website?.url})
KEYWORDS: ${JSON.stringify(keywordData)}

Calculate:
1. Overall Share of Voice percentage based on ranking positions and search volumes
2. Estimate competitor share of voice for top 5 competitors in this niche
3. Breakdown by ranking tiers (top 3, top 10, top 20)

Use CTR curve: Position 1 = 28%, Position 2 = 15%, Position 3 = 11%, etc.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          sov_percentage: { type: 'number' },
          estimated_traffic: { type: 'number' },
          keywords_in_top_3: { type: 'number' },
          keywords_in_top_10: { type: 'number' },
          keywords_in_top_20: { type: 'number' },
          competitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                domain: { type: 'string' },
                sov_percentage: { type: 'number' },
              },
            },
          },
          trend: { type: 'string' },
          insights: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    setSovData(analysis);

    if (onSaveSov && website?.id) {
      onSaveSov({
        website_id: website.id,
        date: new Date().toISOString().split('T')[0],
        sov_percentage: analysis.sov_percentage,
        total_keywords: keywordData.length,
        keywords_in_top_3: analysis.keywords_in_top_3,
        keywords_in_top_10: analysis.keywords_in_top_10,
        keywords_in_top_20: analysis.keywords_in_top_20,
        estimated_traffic: analysis.estimated_traffic,
        competitors: analysis.competitors,
      });
    }

    setIsCalculating(false);
  };

  const chartData = sovData
    ? [
        { name: website?.name || 'You', value: sovData.sov_percentage },
        ...(sovData.competitors?.slice(0, 5).map((c) => ({
          name: c.domain,
          value: c.sov_percentage,
        })) || []),
      ]
    : [];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Share of Voice</CardTitle>
              <p className="text-xs text-gray-500">Market visibility analysis</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={calculateSov}
            disabled={isCalculating || !website}
            className="gap-1 bg-purple-600 hover:bg-purple-700"
          >
            {isCalculating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Calculate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!sovData ? (
          <div className="text-center py-6 text-gray-500">
            <Volume2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Calculate your share of voice</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main SOV */}
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
              <p className="text-4xl font-bold text-purple-600">
                {sovData.sov_percentage?.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Your Share of Voice</p>
              <Badge
                className={`mt-2 ${
                  sovData.trend === 'up'
                    ? 'bg-emerald-100 text-emerald-700'
                    : sovData.trend === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {sovData.trend || 'Stable'}
              </Badge>
            </div>

            {/* Ranking Breakdown */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-emerald-50 rounded-lg">
                <p className="text-lg font-bold text-emerald-600">
                  {sovData.keywords_in_top_3 || 0}
                </p>
                <p className="text-xs text-gray-500">Top 3</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{sovData.keywords_in_top_10 || 0}</p>
                <p className="text-xs text-gray-500">Top 10</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600">
                  {sovData.keywords_in_top_20 || 0}
                </p>
                <p className="text-xs text-gray-500">Top 20</p>
              </div>
            </div>

            {/* Competitor Chart */}
            {chartData.length > 0 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Competitor List */}
            <div className="space-y-1">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>

            {/* Insights */}
            {sovData.insights?.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-gray-700 mb-2">Insights</p>
                <ul className="space-y-1">
                  {sovData.insights.slice(0, 3).map((insight, idx) => (
                    <li key={idx} className="text-xs text-gray-600">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
