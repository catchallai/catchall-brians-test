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
  Briefcase, Zap, ChevronDown, ChevronUp, AlertTriangle, Activity, FileText, Shield, Lock, Unlock,
  Sparkles, TrendingDown, Minus, Package
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from '@/components/ui/EmptyState';
import FinancialTrendsChart from '@/components/aerospace/FinancialTrendsChart';
import CompanyMap from '@/components/aerospace/CompanyMap';
import NetworkGraph from '@/components/aerospace/NetworkGraph';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AerospaceScanner() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [companyTypeFilter, setCompanyTypeFilter] = useState('all');
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
        prompt: `Find comprehensive data on aerospace companies including BOTH publicly traded AND major private companies in the aerospace sector.
        
Include:
- Large public companies (Boeing, Lockheed Martin, Northrop Grumman, Raytheon, General Dynamics, etc.)
- Smaller/emerging publicly traded aerospace companies
- Major private aerospace companies (SpaceX, Blue Origin, Sierra Nevada Corporation, etc.)
- Well-funded private aerospace startups with significant operations

For each company provide:
- company_name
- company_type ("public" or "private")
- ticker_symbol (if public)
- exchange (NYSE, NASDAQ, etc., if public)
- headquarters
- investors (array of key investor names, especially for private companies)
- funding_rounds (array of funding rounds with round type, amount, date, investors - for private companies)
- founded_year
- ceo
- employee_count (number)
- market_cap (for public companies or valuation for private companies)
- annual_revenue
- funding_total (especially for private companies)
- description
- business_segments (array of strings)
- key_products (array of top 3-5 products/services)
- competitors (array of main competitor names)
- dod_contracts (array of DoD contracts with title, contract_number, value, date, agency, description, status)
- public_sector_contracts (array of NASA/FAA/other public contracts with title, contract_number, value, date, agency, description, status)
- financial_highlights (object with revenue_growth, profit_margin, debt_to_equity, pe_ratio)
- growth_metrics (object with revenue_growth_3yr, revenue_growth_5yr, employee_growth_rate, market_cap_growth, backlog_growth, expansion_markets array)
- negative_pr (array of recent negative press with title, date, source, summary, severity, impact, url)
- incidents (array of safety incidents/accidents with title, date, type, description, casualties, investigation_status, findings, regulatory_action)
- strategic_initiatives (array of current strategic focuses)
- rd_focus (array of R&D focus areas)

Include all major public and private aerospace companies. For private companies, research available funding, investor, and valuation data from sources like Crunchbase, industry news, etc.`,
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
                  company_type: { type: "string", enum: ["public", "private"] },
                  ticker_symbol: { type: "string" },
                  exchange: { type: "string" },
                  investors: { type: "array", items: { type: "string" } },
                  funding_rounds: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        round: { type: "string" },
                        amount: { type: "string" },
                        date: { type: "string" },
                        investors: { type: "array", items: { type: "string" } }
                      }
                    }
                  },
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
                  dod_contracts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        contract_number: { type: "string" },
                        value: { type: "string" },
                        date: { type: "string" },
                        agency: { type: "string" },
                        description: { type: "string" },
                        status: { type: "string" }
                      }
                    }
                  },
                  public_sector_contracts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        contract_number: { type: "string" },
                        value: { type: "string" },
                        date: { type: "string" },
                        agency: { type: "string" },
                        description: { type: "string" },
                        status: { type: "string" }
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

  const enrichCompany = async (company) => {
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform AI-driven data enrichment for ${company.company_name}. Provide:

1. Financial ratios (if not already complete):
   - debt_to_equity ratio
   - pe_ratio (P/E ratio)
   - profit_margin
   - revenue_growth

2. News sentiment analysis:
   - overall_sentiment ("positive", "neutral", or "negative")
   - sentiment_score (0-100 scale)
   - recent_headlines (array of 5-10 recent news with title, sentiment, date, source, summary)

3. Major projects/product lifecycle:
   - Array of major projects with name, description, lifecycle_stage (concept/development/testing/production/operational/retired), status, expected_completion, customer

4. Supply chain integration:
   - key_suppliers (array with name and supplies)
   - strategic_partners (array with name and partnership_type)
   - vertical_integration_level (description)

Use current internet data to provide the most accurate and recent information.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            financial_highlights: {
              type: "object",
              properties: {
                revenue_growth: { type: "string" },
                profit_margin: { type: "string" },
                debt_to_equity: { type: "string" },
                pe_ratio: { type: "string" }
              }
            },
            news_sentiment: {
              type: "object",
              properties: {
                overall_sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                sentiment_score: { type: "number" },
                recent_headlines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      sentiment: { type: "string" },
                      date: { type: "string" },
                      source: { type: "string" },
                      summary: { type: "string" }
                    }
                  }
                },
                last_analyzed: { type: "string" }
              }
            },
            major_projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  lifecycle_stage: { type: "string", enum: ["concept", "development", "testing", "production", "operational", "retired"] },
                  status: { type: "string" },
                  expected_completion: { type: "string" },
                  customer: { type: "string" }
                }
              }
            },
            supply_chain: {
              type: "object",
              properties: {
                key_suppliers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      supplies: { type: "string" }
                    }
                  }
                },
                strategic_partners: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      partnership_type: { type: "string" }
                    }
                  }
                },
                vertical_integration_level: { type: "string" }
              }
            }
          }
        }
      });

      await updateCompanyMutation.mutateAsync({
        id: company.id,
        data: {
          ...response,
          last_enriched: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Enrichment failed:', error);
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
- dod_contracts (array of DoD contracts with title, contract_number, value, date, agency, description, status)
- public_sector_contracts (array of NASA/FAA/other public contracts with title, contract_number, value, date, agency, description, status)
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
            dod_contracts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  contract_number: { type: "string" },
                  value: { type: "string" },
                  date: { type: "string" },
                  agency: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string" }
                }
              }
            },
            public_sector_contracts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  contract_number: { type: "string" },
                  value: { type: "string" },
                  date: { type: "string" },
                  agency: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string" }
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

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ticker_symbol?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = companyTypeFilter === 'all' || c.company_type === companyTypeFilter;
    return matchesSearch && matchesType;
  });

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
                Scan and analyze public and private aerospace companies
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
                  <p className="text-sm text-gray-500">Public / Private</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {companies.filter(c => c.company_type === 'public').length} / {companies.filter(c => c.company_type === 'private').length}
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
          <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
            <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
            </SelectContent>
          </Select>
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

        {/* Visualizations */}
        {!isLoading && filteredCompanies.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <Tabs defaultValue="charts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="charts">Financial Charts</TabsTrigger>
                  <TabsTrigger value="map">Geographic Map</TabsTrigger>
                  <TabsTrigger value="network">Network Graph</TabsTrigger>
                </TabsList>
                
                <TabsContent value="charts" className="mt-6">
                  <FinancialTrendsChart companies={filteredCompanies} />
                </TabsContent>
                
                <TabsContent value="map" className="mt-6">
                  <CompanyMap companies={filteredCompanies} />
                </TabsContent>
                
                <TabsContent value="network" className="mt-6">
                  <NetworkGraph companies={filteredCompanies} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Companies List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No aerospace companies yet"
            description="Click 'Scan All Companies' to discover public and private aerospace companies"
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
                        {company.company_type === 'private' ? (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Unlock className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        {company.ticker_symbol && (
                          <Badge className="bg-blue-600 text-white">
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
                        onClick={() => enrichCompany(company)}
                        className="gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Enrich
                      </Button>
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

                      {/* Investors & Funding (for private companies) */}
                      {company.company_type === 'private' && company.investors?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Key Investors</h4>
                          <div className="flex flex-wrap gap-2">
                            {company.investors.map((investor, i) => (
                              <Badge key={i} variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700">
                                {investor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {company.company_type === 'private' && company.funding_rounds?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Funding Rounds</h4>
                          <div className="space-y-2">
                            {company.funding_rounds.map((round, i) => (
                              <div key={i} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium text-sm">{round.round}</p>
                                  <Badge className="bg-purple-600 text-white">{round.amount}</Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{round.date}</p>
                                {round.investors?.length > 0 && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Investors: {round.investors.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* DoD Contracts */}
                      {company.dod_contracts?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-sm">Department of Defense Contracts</h4>
                          </div>
                          <div className="space-y-2">
                            {company.dod_contracts.map((contract, i) => (
                              <div key={i} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <p className="font-medium text-sm">{contract.title}</p>
                                    {contract.contract_number && (
                                      <p className="text-xs text-gray-500">Contract #: {contract.contract_number}</p>
                                    )}
                                  </div>
                                  <Badge className="bg-blue-600 text-white">{contract.value}</Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{contract.date} • {contract.agency}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{contract.description}</p>
                                {contract.status && (
                                  <Badge variant="outline" className="text-xs">{contract.status}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Public Sector Contracts */}
                      {company.public_sector_contracts?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-semibold text-sm">Public Sector Contracts (NASA, FAA, etc.)</h4>
                          </div>
                          <div className="space-y-2">
                            {company.public_sector_contracts.map((contract, i) => (
                              <div key={i} className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <p className="font-medium text-sm">{contract.title}</p>
                                    {contract.contract_number && (
                                      <p className="text-xs text-gray-500">Contract #: {contract.contract_number}</p>
                                    )}
                                  </div>
                                  <Badge className="bg-indigo-600 text-white">{contract.value}</Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{contract.date} • {contract.agency}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{contract.description}</p>
                                {contract.status && (
                                  <Badge variant="outline" className="text-xs">{contract.status}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Contracts */}
                      {company.recent_contracts?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Other Recent Major Contracts</h4>
                          <div className="space-y-2">
                            {company.recent_contracts.map((contract, i) => (
                              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium text-sm">{contract.title}</p>
                                  <Badge variant="outline">{contract.value}</Badge>
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

                      {/* News Sentiment */}
                      {company.news_sentiment && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <h4 className="font-semibold text-sm">News Sentiment Analysis</h4>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {company.news_sentiment.overall_sentiment === 'positive' && (
                                  <TrendingUp className="w-5 h-5 text-green-500" />
                                )}
                                {company.news_sentiment.overall_sentiment === 'neutral' && (
                                  <Minus className="w-5 h-5 text-gray-500" />
                                )}
                                {company.news_sentiment.overall_sentiment === 'negative' && (
                                  <TrendingDown className="w-5 h-5 text-red-500" />
                                )}
                                <span className={`font-medium text-sm capitalize ${
                                  company.news_sentiment.overall_sentiment === 'positive' ? 'text-green-700 dark:text-green-300' :
                                  company.news_sentiment.overall_sentiment === 'negative' ? 'text-red-700 dark:text-red-300' :
                                  'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {company.news_sentiment.overall_sentiment} Sentiment
                                </span>
                              </div>
                              <Badge variant="outline">
                                Score: {company.news_sentiment.sentiment_score}/100
                              </Badge>
                            </div>
                            {company.news_sentiment.recent_headlines?.length > 0 && (
                              <div className="space-y-2 mt-3">
                                {company.news_sentiment.recent_headlines.slice(0, 3).map((headline, i) => (
                                  <div key={i} className="bg-white dark:bg-gray-900 p-2 rounded text-xs">
                                    <p className="font-medium mb-1">{headline.title}</p>
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <span>{headline.source}</span>
                                      <span>•</span>
                                      <span>{headline.date}</span>
                                      <Badge className={`ml-auto ${
                                        headline.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                        headline.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>{headline.sentiment}</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Major Projects */}
                      {company.major_projects?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-indigo-500" />
                            <h4 className="font-semibold text-sm">Major Projects & Products</h4>
                          </div>
                          <div className="space-y-2">
                            {company.major_projects.map((project, i) => (
                              <div key={i} className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium text-sm">{project.name}</p>
                                  <Badge className={`${
                                    project.lifecycle_stage === 'operational' ? 'bg-green-600' :
                                    project.lifecycle_stage === 'production' ? 'bg-blue-600' :
                                    project.lifecycle_stage === 'testing' ? 'bg-amber-600' :
                                    project.lifecycle_stage === 'development' ? 'bg-purple-600' :
                                    'bg-gray-600'
                                  } text-white text-xs`}>
                                    {project.lifecycle_stage}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{project.description}</p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                  {project.customer && <span>Customer: {project.customer}</span>}
                                  {project.expected_completion && (
                                    <span className="ml-auto">ETC: {project.expected_completion}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supply Chain */}
                      {company.supply_chain && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-purple-500" />
                            <h4 className="font-semibold text-sm">Supply Chain Integration</h4>
                          </div>
                          <div className="space-y-3">
                            {company.supply_chain.vertical_integration_level && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Vertical Integration
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {company.supply_chain.vertical_integration_level}
                                </p>
                              </div>
                            )}
                            {company.supply_chain.key_suppliers?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Key Suppliers
                                </p>
                                <div className="space-y-1">
                                  {company.supply_chain.key_suppliers.map((supplier, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 p-2 rounded text-xs">
                                      <span className="font-medium">{supplier.name}</span>
                                      {supplier.supplies && (
                                        <span className="text-gray-500"> - {supplier.supplies}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {company.supply_chain.strategic_partners?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Strategic Partners
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {company.supply_chain.strategic_partners.map((partner, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {partner.name} ({partner.partnership_type})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
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