import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Sparkles, Loader2, TrendingUp, Building2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CompetitorLandscape({ company, allCompanies }) {
  const queryClient = useQueryClient();

  const analyzeLandscapeMutation = useMutation({
    mutationFn: async () => {
      const competitors = allCompanies.filter(
        (c) =>
          (company.competitors || []).includes(c.company_name) ||
          (c.competitors || []).includes(company.company_name)
      );

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the competitive landscape for ${company.company_name} in the aerospace industry.

Company Details:
- Type: ${company.company_type}
- Market Cap/Valuation: ${company.market_cap}
- Revenue: ${company.annual_revenue}
- Employees: ${company.employee_count}
- Key Products: ${(company.key_products || []).join(', ')}
- Business Segments: ${(company.business_segments || []).join(', ')}

Listed Competitors: ${(company.competitors || []).join(', ')}

Known Competitors Data:
${competitors
  .map(
    (c) => `
- ${c.company_name}: ${c.company_type}, Revenue: ${c.annual_revenue}, Employees: ${c.employee_count}
  Products: ${(c.key_products || []).slice(0, 3).join(', ')}
`
  )
  .join('\n')}

Provide:
1. Market positioning analysis
2. Competitive advantages
3. Areas where competitors are stronger
4. Market share estimation
5. Strategic recommendations`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            market_position: { type: 'string' },
            competitive_advantages: {
              type: 'array',
              items: { type: 'string' },
            },
            competitor_strengths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  competitor: { type: 'string' },
                  strength: { type: 'string' },
                },
              },
            },
            market_share_estimate: { type: 'string' },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      });

      await base44.entities.AerospaceCompany.update(company.id, {
        competitive_landscape: response,
        last_enriched: new Date().toISOString(),
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-companies'] });
    },
  });

  const landscape = company.competitive_landscape || {};

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Competitive Landscape
          </CardTitle>
          <Button
            size="sm"
            onClick={() => analyzeLandscapeMutation.mutate()}
            disabled={analyzeLandscapeMutation.isPending}
            className="gap-2"
          >
            {analyzeLandscapeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {landscape.market_position ? 'Refresh' : 'Analyze'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!landscape.market_position ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No competitive analysis yet. Click Analyze to generate insights.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Market Position */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">
                  Market Position
                </h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {landscape.market_position}
              </p>
              {landscape.market_share_estimate && (
                <div className="mt-2">
                  <Badge className="bg-indigo-600 text-white">
                    Est. Market Share: {landscape.market_share_estimate}
                  </Badge>
                </div>
              )}
            </div>

            {/* Competitive Advantages */}
            {landscape.competitive_advantages?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold">Competitive Advantages</h4>
                </div>
                <ul className="space-y-1">
                  {landscape.competitive_advantages.map((adv, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-green-600 mt-0.5">✓</span>
                      {adv}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitor Strengths */}
            {landscape.competitor_strengths?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Where Competitors Excel</h4>
                <div className="space-y-2">
                  {landscape.competitor_strengths.map((item, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.competitor}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">{item.strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Recommendations */}
            {landscape.recommendations?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-300">
                  Strategic Recommendations
                </h4>
                <ul className="space-y-1">
                  {landscape.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-blue-600 mt-0.5">→</span>
                      {rec}
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
