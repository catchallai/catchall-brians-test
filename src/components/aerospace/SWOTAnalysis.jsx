import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SWOTAnalysis({ company }) {
  const queryClient = useQueryClient();

  const generateSWOTMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive SWOT analysis for ${company.company_name} based on the following data:

Company Type: ${company.company_type}
Industry: Aerospace & Defense
Headquarters: ${company.headquarters}
Employees: ${company.employee_count}
Market Cap/Valuation: ${company.market_cap}
Revenue: ${company.annual_revenue}

Business Segments: ${(company.business_segments || []).join(', ')}
Key Products: ${(company.key_products || []).join(', ')}
Competitors: ${(company.competitors || []).join(', ')}

Financial Highlights:
${JSON.stringify(company.financial_highlights || {}, null, 2)}

Growth Metrics:
${JSON.stringify(company.growth_metrics || {}, null, 2)}

Recent Contracts: ${(company.recent_contracts || []).length} major contracts
Strategic Initiatives: ${(company.strategic_initiatives || []).join(', ')}
R&D Focus: ${(company.rd_focus || []).join(', ')}

Provide a detailed SWOT analysis with 4-6 points for each category.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: {
              type: 'array',
              items: { type: 'string' },
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' },
            },
            opportunities: {
              type: 'array',
              items: { type: 'string' },
            },
            threats: {
              type: 'array',
              items: { type: 'string' },
            },
            summary: { type: 'string' },
          },
        },
      });

      await base44.entities.AerospaceCompany.update(company.id, {
        swot_analysis: response,
        last_enriched: new Date().toISOString(),
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-companies'] });
    },
  });

  const swot = company.swot_analysis || {};

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            SWOT Analysis
          </CardTitle>
          <Button
            size="sm"
            onClick={() => generateSWOTMutation.mutate()}
            disabled={generateSWOTMutation.isPending}
            className="gap-2"
          >
            {generateSWOTMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {swot.strengths ? 'Regenerate' : 'Generate'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!swot.strengths ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No SWOT analysis yet. Click Generate to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {swot.summary && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">{swot.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-green-800 dark:text-green-300">Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {(swot.strengths || []).map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-green-600 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">Weaknesses</h4>
                </div>
                <ul className="space-y-2">
                  {(swot.weaknesses || []).map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-amber-600 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">Opportunities</h4>
                </div>
                <ul className="space-y-2">
                  {(swot.opportunities || []).map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-blue-600 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Threats */}
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Threats</h4>
                </div>
                <ul className="space-y-2">
                  {(swot.threats || []).map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-red-600 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
