import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, Search, RefreshCw, Building2, Users, DollarSign, 
  TrendingUp, Globe, Loader2, Plus, ExternalLink, Target,
  Briefcase, Zap, ChevronDown, ChevronUp, AlertTriangle, Activity
} from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';

export default function AerospaceScanner() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['aerospace-companies'],
    queryFn: () => base44.entities.AerospaceCompany.list('-last_scanned', 100),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data) => base44.entities.AerospaceCompany.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-companies'] });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AerospaceCompany.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-companies'] });
    },
  });

  const scanPublicAerospaceCompanies = async () => {
    setIsScanning(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Find all major publicly traded aerospace companies. For each company provide:
- company_name
- ticker_symbol
- exchange (NYSE, NASDAQ, etc.)
- headquarters
- founded_year
- ceo
- employee_count (number)
- market_cap
- annual_revenue
- description
- business_segments (array of strings)
- key_products (array of top 3-5 products/services)
- competitors (array of main competitor names)
- financial_highlights (object with revenue_growth, profit_margin, debt_to_equity, pe_ratio)
- growth_metrics (object with revenue_growth_3yr, revenue_growth_5yr, employee_growth_rate, market_cap_growth, backlog_growth, expansion_markets array)
- negative_pr (array of recent negative press with title, date, source, summary, severity, impact, url)
- incidents (array of safety incidents/accidents with title, date, type, description, casualties, investigation_status, findings, regulatory_action)
- strategic_initiatives (array of current strategic focuses)
- rd_focus (array of R&D focus areas)

Focus on companies like Boeing, Lockheed Martin, Northrop Grumman, Raytheon, SpaceX (if public info available), Blue Origin, Virgin Galactic, etc. Include defense contractors with significant aerospace divisions.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            companies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  ticker_symbol: { type: "string" },
                  exchange: { type: "string" },
                  headquarters: { type: "string" },
                  founded_year: { type: "string" },
                  ceo: { type: "string" },
                  employee_count: { type: "number" },
                  market_cap: { type: "string" },
                  annual_revenue: { type: "string" },
                  description: { type: "string" },
                  business_segments: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  key_products: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  competitors: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  financial_highlights: {
                    type: "object",
                    properties: {
                      revenue_growth: { type: "string" },
                      profit_margin: { type: "string" },
                      debt_to_equity: { type: "string" },
                      pe_ratio: { type: "string" }
                    }
                  },
                  growth_metrics: {
                    type: "object",
                    properties: {
                      revenue_growth_3yr: { type: "string" },
                      revenue_growth_5yr: { type: "string" },
                      employee_growth_rate: { type: "string" },
                      market_cap_growth: { type: "string" },
                      backlog_growth: { type: "string" },
                      expansion_markets: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  },
                  negative_pr: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        date: { type: "string" },
                        source: { type: "string" },
                        summary: { type: "string" },
                        severity: { type: "string" },
                        impact: { type: "string" },
                        url: { type: "string" }
                      }
                    }
                  },
                  incidents: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        date: { type: "string" },
                        type: { type: "string" },
                        description: { type: "string" },
                        casualties: { type: "string" },
                        investigation_status: { type: "string" },
                        findings: { type: "string" },
                        regulatory_action: { type: "string" }
                      }
                    }
                  },
                  strategic_initiatives: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  rd_focus: { 
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      // Save all companies
      for (const company of response.companies) {
        await createCompanyMutation.mutateAsync({
          ...company,
          last_scanned: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Scanning failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const rescanCompany = async (company) => {
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Get the latest detailed information about ${company.company_name} (${company.ticker_symbol}). Provide:
- Current employee_count (number)
- market_cap
- annual_revenue
- ceo
- description
- business_segments (array)
- key_products (array)
- competitors (array)
- recent_contracts (array with title, value, date, description)
- financial_highlights (revenue_growth, profit_margin, debt_to_equity, pe_ratio)
- growth_metrics (revenue_growth_3yr, revenue_growth_5yr, employee_growth_rate, market_cap_growth, backlog_growth, expansion_markets array)
- negative_pr (array of recent negative press with title, date, source, summary, severity high/medium/low, impact, url)
- incidents (array of safety incidents/accidents with title, date, type, description, casualties, investigation_status, findings, regulatory_action)
- strategic_initiatives (array)
- rd_focus (array)
- partnerships (array with partner and description)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            employee_count: { type: "number" },
            market_cap: { type: "string" },
            annual_revenue: { type: "string" },
            ceo: { type: "string" },
            description: { type: "string" },
            business_segments: { 
              type: "array",
              items: { type: "string" }
            },
            key_products: { 
              type: "array",
              items: { type: "string" }
            },
            competitors: { 
              type: "array",
              items: { type: "string" }
            },
            recent_contracts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  value: { type: "string" },
                  date: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            financial_highlights: {
              type: "object",
              properties: {
                revenue_growth: { type: "string" },
                profit_margin: { type: "string" },
                debt_to_equity: { type: "string" },
                pe_ratio: { type: "string" }
              }
            },
            strategic_initiatives: { 
              type: "array",
              items: { type: "string" }
            },
            rd_focus: { 
              type: "array",
              items: { type: "string" }
            },
            growth_metrics: {
              type: "object",
              properties: {
                revenue_growth_3yr: { type: "string" },
                revenue_growth_5yr: { type: "string" },
                employee_growth_rate: { type: "string" },
                market_cap_growth: { type: "string" },
                backlog_growth: { type: "string" },
                expansion_markets: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            negative_pr: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  date: { type: "string" },
                  source: { type: "string" },
                  summary: { type: "string" },
                  severity: { type: "string" },
                  impact: { type: "string" },
                  url: { type: "string" }
                }
              }
            },
            incidents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  date: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  casualties: { type: "string" },
                  investigation_status: { type: "string" },
                  findings: { type: "string" },
                  regulatory_action: { type: "string" }
                }
              }
            },
            partnerships: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  partner: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      await updateCompanyMutation.mutateAsync({
        id: company.id,
        data: {
          ...response,
          last_scanned: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Rescan failed:', error);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ticker_symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Aerospace Company Intelligence
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Scan and analyze public trading aerospace companies
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Companies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {companies.reduce((sum, c) => sum + (c.employee_count || 0), 0).toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Public Companies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {companies.filter(c => c.ticker_symbol).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Last Scanned</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {companies[0]?.last_scanned ? new Date(companies[0].last_scanned).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search companies or ticker symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={scanPublicAerospaceCompanies}
            disabled={isScanning}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
          >
            {isScanning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
            ) : (
              <><Plus className="w-4 h-4" /> Scan All Companies</>
            )}
          </Button>
        </div>

        {/* Companies List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No aerospace companies yet"
            description="Click 'Scan All Companies' to discover public trading aerospace companies"
            actionLabel="Scan Now"
            onAction={scanPublicAerospaceCompanies}
          />
        ) : (
          <div className="space-y-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{company.company_name}</CardTitle>
                        {company.ticker_symbol && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {company.ticker_symbol}
                          </Badge>
                        )}
                        {company.exchange && (
                          <Badge variant="outline" className="text-xs">
                            {company.exchange}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.description}
                      </p>
                      {company.website && (
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                        >
                          {company.website.replace(/https?:\/\//, '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rescanCompany(company)}
                        className="gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Rescan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                      >
                        {expandedCompany === company.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    {company.headquarters && (
                      <div>
                        <p className="text-xs text-gray-500">Headquarters</p>
                        <p className="text-sm font-medium">{company.headquarters}</p>
                      </div>
                    )}
                    {company.ceo && (
                      <div>
                        <p className="text-xs text-gray-500">CEO</p>
                        <p className="text-sm font-medium">{company.ceo}</p>
                      </div>
                    )}
                    {company.employee_count && (
                      <div>
                        <p className="text-xs text-gray-500">Employees</p>
                        <p className="text-sm font-medium">{company.employee_count.toLocaleString()}</p>
                      </div>
                    )}
                    {company.market_cap && (
                      <div>
                        <p className="text-xs text-gray-500">Market Cap</p>
                        <p className="text-sm font-medium">{company.market_cap}</p>
                      </div>
                    )}
                    {company.annual_revenue && (
                      <div>
                        <p className="text-xs text-gray-500">Annual Revenue</p>
                        <p className="text-sm font-medium">{company.annual_revenue}</p>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedCompany === company.id && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Business Segments */}
                      {company.business_segments?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            <h4 className="font-semibold text-sm">Business Segments</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {company.business_segments.map((seg, i) => (
                              <Badge key={i} variant="outline">{seg}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Products */}
                      {company.key_products?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-emerald-500" />
                            <h4 className="font-semibold text-sm">Key Products</h4>
                          </div>
                          <ul className="space-y-1">
                            {company.key_products.map((prod, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                {prod}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Financial Highlights */}
                      {company.financial_highlights && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-violet-500" />
                            <h4 className="font-semibold text-sm">Financial Highlights</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {company.financial_highlights.revenue_growth && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500">Revenue Growth</p>
                                <p className="text-sm font-medium">{company.financial_highlights.revenue_growth}</p>
                              </div>
                            )}
                            {company.financial_highlights.profit_margin && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500">Profit Margin</p>
                                <p className="text-sm font-medium">{company.financial_highlights.profit_margin}</p>
                              </div>
                            )}
                            {company.financial_highlights.debt_to_equity && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500">Debt to Equity</p>
                                <p className="text-sm font-medium">{company.financial_highlights.debt_to_equity}</p>
                              </div>
                            )}
                            {company.financial_highlights.pe_ratio && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500">P/E Ratio</p>
                                <p className="text-sm font-medium">{company.financial_highlights.pe_ratio}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Strategic Initiatives */}
                      {company.strategic_initiatives?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <h4 className="font-semibold text-sm">Strategic Initiatives</h4>
                          </div>
                          <ul className="space-y-1">
                            {company.strategic_initiatives.map((init, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {init}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* R&D Focus */}
                      {company.rd_focus?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">R&D Focus Areas</h4>
                          <div className="flex flex-wrap gap-2">
                            {company.rd_focus.map((focus, i) => (
                              <Badge key={i} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                {focus}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Contracts */}
                      {company.recent_contracts?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Recent Major Contracts</h4>
                          <div className="space-y-2">
                            {company.recent_contracts.map((contract, i) => (
                              <div key={i} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium text-sm">{contract.title}</p>
                                  <Badge className="bg-blue-600 text-white">{contract.value}</Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{contract.date}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{contract.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Growth Metrics */}
                      {company.growth_metrics && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <h4 className="font-semibold text-sm">Growth Metrics</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {company.growth_metrics.revenue_growth_3yr && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <p className="text-xs text-gray-500">3-Year Revenue Growth</p>
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">{company.growth_metrics.revenue_growth_3yr}</p>
                              </div>
                            )}
                            {company.growth_metrics.revenue_growth_5yr && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <p className="text-xs text-gray-500">5-Year Revenue Growth</p>
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">{company.growth_metrics.revenue_growth_5yr}</p>
                              </div>
                            )}
                            {company.growth_metrics.employee_growth_rate && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <p className="text-xs text-gray-500">Employee Growth</p>
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">{company.growth_metrics.employee_growth_rate}</p>
                              </div>
                            )}
                            {company.growth_metrics.market_cap_growth && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <p className="text-xs text-gray-500">Market Cap Growth</p>
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">{company.growth_metrics.market_cap_growth}</p>
                              </div>
                            )}
                            {company.growth_metrics.backlog_growth && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <p className="text-xs text-gray-500">Backlog Growth</p>
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">{company.growth_metrics.backlog_growth}</p>
                              </div>
                            )}
                          </div>
                          {company.growth_metrics.expansion_markets?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Expansion Markets</p>
                              <div className="flex flex-wrap gap-1">
                                {company.growth_metrics.expansion_markets.map((market, i) => (
                                  <Badge key={i} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{market}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Negative PR */}
                      {company.negative_pr?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h4 className="font-semibold text-sm">Negative Press & Controversies</h4>
                          </div>
                          <div className="space-y-2">
                            {company.negative_pr.map((pr, i) => (
                              <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                pr.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                                pr.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                                'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                              }`}>
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium text-sm">{pr.title}</p>
                                  <Badge className={
                                    pr.severity === 'high' ? 'bg-red-600 text-white' :
                                    pr.severity === 'medium' ? 'bg-amber-600 text-white' :
                                    'bg-yellow-600 text-white'
                                  }>{pr.severity}</Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{pr.date} • {pr.source}</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">{pr.summary}</p>
                                {pr.impact && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">Impact: {pr.impact}</p>
                                )}
                                {pr.url && (
                                  <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1">
                                    Read more <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety Incidents */}
                      {company.incidents?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <h4 className="font-semibold text-sm">Safety Incidents & Investigations</h4>
                          </div>
                          <div className="space-y-3">
                            {company.incidents.map((incident, i) => (
                              <div key={i} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-sm">{incident.title}</p>
                                    <p className="text-xs text-gray-500">{incident.date} • {incident.type}</p>
                                  </div>
                                  {incident.investigation_status && (
                                    <Badge variant="outline" className="text-xs">{incident.investigation_status}</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{incident.description}</p>
                                {incident.casualties && (
                                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Casualties: {incident.casualties}</p>
                                )}
                                {incident.findings && (
                                  <div className="bg-white dark:bg-gray-800 p-2 rounded mt-2">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Findings:</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{incident.findings}</p>
                                  </div>
                                )}
                                {incident.regulatory_action && (
                                  <div className="bg-white dark:bg-gray-800 p-2 rounded mt-2">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Regulatory Action:</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{incident.regulatory_action}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Competitors */}
                      {company.competitors?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Main Competitors</h4>
                          <div className="flex flex-wrap gap-2">
                            {company.competitors.map((comp, i) => (
                              <Badge key={i} variant="outline">{comp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}