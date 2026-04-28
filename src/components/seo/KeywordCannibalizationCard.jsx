import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileWarning } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function KeywordCannibalizationCard({ keywords }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cannibalization, setCannibalization] = useState(null);

  const analyzeCannibalization = async () => {
    setIsAnalyzing(true);

    const keywordData = keywords.map((k) => ({
      keyword: k.keyword,
      targetUrl: k.target_url,
      position: k.current_position,
    }));

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these keywords for potential keyword cannibalization issues.
      
KEYWORDS: ${JSON.stringify(keywordData)}

Identify:
1. Keywords that may be competing against each other (similar intent)
2. URLs that might be cannibalizing each other for the same keywords
3. Provide recommendations to fix each issue

Return issues sorted by severity (high, medium, low).`,
      response_json_schema: {
        type: 'object',
        properties: {
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
                type: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                urls: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
                recommendation: { type: 'string' },
              },
            },
          },
          summary: {
            type: 'object',
            properties: {
              total_issues: { type: 'number' },
              high_priority: { type: 'number' },
              medium_priority: { type: 'number' },
              low_priority: { type: 'number' },
            },
          },
        },
      },
    });

    setCannibalization(analysis);
    setIsAnalyzing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Keyword Cannibalization</CardTitle>
              <p className="text-xs text-gray-500">Detect competing pages</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={analyzeCannibalization}
            disabled={isAnalyzing || keywords.length === 0}
            className="gap-1 bg-amber-600 hover:bg-amber-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!cannibalization ? (
          <div className="text-center py-6 text-gray-500">
            <FileWarning className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Click analyze to detect issues</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold">{cannibalization.summary?.total_issues || 0}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">
                  {cannibalization.summary?.high_priority || 0}
                </p>
                <p className="text-xs text-gray-500">High</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600">
                  {cannibalization.summary?.medium_priority || 0}
                </p>
                <p className="text-xs text-gray-500">Medium</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">
                  {cannibalization.summary?.low_priority || 0}
                </p>
                <p className="text-xs text-gray-500">Low</p>
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cannibalization.issues?.map((issue, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                    <span className="text-xs text-gray-400">{issue.type}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {issue.keywords?.map((kw, i) => (
                      <span key={i} className="text-xs bg-white px-2 py-0.5 rounded border">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-emerald-600">💡 {issue.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
