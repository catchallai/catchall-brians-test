import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Sparkles,
  Loader2,
  X,
  Target,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CompanyComparison({ companies, onClose }) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const companiesData = companies.map((c) => ({
        name: c.company_name,
        revenue: c.annual_revenue,
        employees: c.employee_count,
        market_cap: c.market_cap,
        growth: c.financial_highlights?.revenue_growth,
        segments: c.business_segments,
        products: c.key_products,
        contracts: [...(c.dod_contracts || []), ...(c.public_sector_contracts || [])].length,
        rd_focus: c.rd_focus,
        incidents: c.incidents?.length || 0,
        negative_pr: c.negative_pr?.length || 0,
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a detailed competitive analysis comparing these aerospace companies:

${JSON.stringify(companiesData, null, 2)}

Provide:
1. competitive_strengths (object with company_name as key, array of strengths as value)
2. competitive_weaknesses (object with company_name as key, array of weaknesses as value)
3. market_positioning (array of objects with company_name, position_description, market_share_estimate)
4. key_differentiators (object with company_name as key, array of differentiators as value)
5. recommendations (object with company_name as key, strategic recommendations as value)
6. overall_winner (object with company_name, reasoning)
7. collaboration_opportunities (array of potential partnership opportunities between companies)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            competitive_strengths: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            competitive_weaknesses: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            market_positioning: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company_name: { type: 'string' },
                  position_description: { type: 'string' },
                  market_share_estimate: { type: 'string' },
                },
              },
            },
            key_differentiators: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            recommendations: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            overall_winner: {
              type: 'object',
              properties: {
                company_name: { type: 'string' },
                reasoning: { type: 'string' },
              },
            },
            collaboration_opportunities: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      });

      setAiAnalysis(response);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare chart data
  const employeeData = companies.map((c) => ({
    name: c.company_name.length > 15 ? c.company_name.substring(0, 15) + '...' : c.company_name,
    employees: c.employee_count || 0,
  }));

  const contractData = companies.map((c) => ({
    name: c.company_name.length > 15 ? c.company_name.substring(0, 15) + '...' : c.company_name,
    DoD: (c.dod_contracts || []).length,
    Public: (c.public_sector_contracts || []).length,
  }));

  const radarData =
    companies[0]?.business_segments?.map((segment) => {
      const dataPoint = { segment };
      companies.forEach((c) => {
        dataPoint[c.company_name] = c.business_segments?.includes(segment) ? 100 : 0;
      });
      return dataPoint;
    }) || [];

  const parseNumber = (str) => {
    if (!str) {
      return 0;
    }
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900">
        <CardHeader className="border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                Company Comparison
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Comparing {companies.length} aerospace companies
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateAIAnalysis}
                disabled={isAnalyzing}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Analysis
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="charts">Visual Comparison</TabsTrigger>
              <TabsTrigger value="financials">Financial Analysis</TabsTrigger>
              <TabsTrigger value="ai">AI Insights</TabsTrigger>
            </TabsList>

            {/* Key Metrics Table */}
            <TabsContent value="metrics" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                        Metric
                      </th>
                      {companies.map((c, idx) => (
                        <th
                          key={idx}
                          className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            {c.logo_url && (
                              <img
                                src={c.logo_url}
                                alt={c.company_name}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            {c.company_name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">Type</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3">
                          <Badge
                            className={
                              c.company_type === 'public'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }
                          >
                            {c.company_type}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">Headquarters</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm">
                          {c.headquarters || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">CEO</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm">
                          {c.ceo || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/20">
                      <td className="p-3 font-medium">Employees</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm font-semibold">
                          {c.employee_count ? c.employee_count.toLocaleString() : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/20">
                      <td className="p-3 font-medium">Annual Revenue</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm font-semibold">
                          {c.annual_revenue || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-violet-50/50 dark:bg-violet-900/20">
                      <td className="p-3 font-medium">Market Cap / Valuation</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm font-semibold">
                          {c.market_cap || 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">Revenue Growth</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm">
                          {c.financial_highlights?.revenue_growth ? (
                            <div className="flex items-center gap-1">
                              {parseNumber(c.financial_highlights.revenue_growth) > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              {c.financial_highlights.revenue_growth}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">DoD Contracts</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm">
                          {(c.dod_contracts || []).length}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">Public Sector Contracts</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm">
                          {(c.public_sector_contracts || []).length}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-3 font-medium">R&D Focus Areas</td>
                      {companies.map((c, idx) => (
                        <td key={idx} className="p-3 text-sm">
                          {(c.rd_focus || []).length}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/20">
                      <td className="p-3 font-medium">Safety Incidents</td>
                      {companies.map((c, idx) => (
                        <td
                          key={idx}
                          className="p-3 text-sm font-semibold text-red-600 dark:text-red-400"
                        >
                          {(c.incidents || []).length}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-900/20">
                      <td className="p-3 font-medium">Negative PR Items</td>
                      {companies.map((c, idx) => (
                        <td
                          key={idx}
                          className="p-3 text-sm font-semibold text-amber-600 dark:text-amber-400"
                        >
                          {(c.negative_pr || []).length}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Visual Charts */}
            <TabsContent value="charts" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employee Count Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={employeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="employees" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contract Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contractData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="DoD" fill="#2563eb" name="DoD Contracts" />
                      <Bar dataKey="Public" fill="#7c3aed" name="Public Sector" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {radarData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Segment Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="segment" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        {companies.map((c, idx) => (
                          <Radar
                            key={idx}
                            name={c.company_name}
                            dataKey={c.company_name}
                            stroke={
                              ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]
                            }
                            fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]}
                            fillOpacity={0.3}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Financial Analysis */}
            <TabsContent value="financials" className="mt-6 space-y-4">
              {companies.map((company, idx) => (
                <Card
                  key={idx}
                  className="border-l-4"
                  style={{ borderLeftColor: ['#3b82f6', '#10b981', '#f59e0b'][idx % 3] }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {company.logo_url && (
                        <img
                          src={company.logo_url}
                          alt={company.company_name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      {company.company_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {company.financial_highlights?.revenue_growth && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-500">Revenue Growth</p>
                          <p className="text-lg font-bold text-green-600">
                            {company.financial_highlights.revenue_growth}
                          </p>
                        </div>
                      )}
                      {company.financial_highlights?.profit_margin && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-500">Profit Margin</p>
                          <p className="text-lg font-bold">
                            {company.financial_highlights.profit_margin}
                          </p>
                        </div>
                      )}
                      {company.financial_highlights?.debt_to_equity && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-500">Debt to Equity</p>
                          <p className="text-lg font-bold">
                            {company.financial_highlights.debt_to_equity}
                          </p>
                        </div>
                      )}
                      {company.financial_highlights?.pe_ratio && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-500">P/E Ratio</p>
                          <p className="text-lg font-bold">
                            {company.financial_highlights.pe_ratio}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* AI Insights */}
            <TabsContent value="ai" className="mt-6 space-y-6">
              {!aiAnalysis ? (
                <Card className="p-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Competitive Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Click "AI Analysis" to generate detailed competitive insights
                  </p>
                </Card>
              ) : (
                <>
                  {/* Overall Winner */}
                  {aiAnalysis.overall_winner && (
                    <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-400">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          Overall Market Leader
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold mb-2">
                          {aiAnalysis.overall_winner.company_name}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {aiAnalysis.overall_winner.reasoning}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Competitive Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="w-5 h-5" />
                          Competitive Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(aiAnalysis.competitive_strengths || {}).map(
                          ([company, strengths], idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold mb-2">{company}</h4>
                              <ul className="space-y-1">
                                {strengths.map((strength, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                  >
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <TrendingDown className="w-5 h-5" />
                          Competitive Weaknesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(aiAnalysis.competitive_weaknesses || {}).map(
                          ([company, weaknesses], idx) => (
                            <div key={idx}>
                              <h4 className="font-semibold mb-2">{company}</h4>
                              <ul className="space-y-1">
                                {weaknesses.map((weakness, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                  >
                                    <span className="text-red-500 mt-0.5">✗</span>
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Market Positioning */}
                  {aiAnalysis.market_positioning && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          Market Positioning
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {aiAnalysis.market_positioning.map((pos, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{pos.company_name}</h4>
                              <Badge>{pos.market_share_estimate}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {pos.position_description}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Differentiators */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        Key Differentiators
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(aiAnalysis.key_differentiators || {}).map(
                        ([company, differentiators], idx) => (
                          <div key={idx}>
                            <h4 className="font-semibold mb-2">{company}</h4>
                            <div className="flex flex-wrap gap-2">
                              {differentiators.map((diff, i) => (
                                <Badge
                                  key={i}
                                  className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                >
                                  {diff}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>

                  {/* Strategic Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Strategic Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(aiAnalysis.recommendations || {}).map(
                        ([company, recommendation], idx) => (
                          <div
                            key={idx}
                            className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-600"
                          >
                            <h4 className="font-semibold mb-2">{company}</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {recommendation}
                            </p>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>

                  {/* Collaboration Opportunities */}
                  {aiAnalysis.collaboration_opportunities?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-emerald-600" />
                          Collaboration Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {aiAnalysis.collaboration_opportunities.map((opp, idx) => (
                            <li
                              key={idx}
                              className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                            >
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
