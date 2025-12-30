import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Loader2, Sparkles, Target, Users, TrendingUp
} from "lucide-react";
import CompetitorCard from '@/components/social/CompetitorCard';
import CompetitorDetailModal from '@/components/social/CompetitorDetailModal';
import CompetitorReportModal from '@/components/modals/CompetitorReportModal';
import CompetitorNetworkMap from '@/components/social/CompetitorNetworkMap';
import EmptyState from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CompetitorAnalysis() {
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', website: '', tier: 'tier_3' });
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(null);
  const [isDiscoveringCompetitors, setIsDiscoveringCompetitors] = useState(false);
  const [scanningNewsFor, setScanningNewsFor] = useState(null);
  const [deepAnalyzingFor, setDeepAnalyzingFor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const queryClient = useQueryClient();

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ['competitors'],
    queryFn: () => base44.entities.Competitor.list('-created_date', 50),
  });

  const { data: competitorReports = [] } = useQuery({
    queryKey: ['competitor-reports'],
    queryFn: () => base44.entities.CompetitorReport.list('-created_date', 100),
  });

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 50),
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: () => base44.entities.ScheduledPost.list('-created_date', 100),
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => base44.entities.SocialPost.list('-created_date', 500),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 50),
  });

  const createCompetitorMutation = useMutation({
    mutationFn: (data) => base44.entities.Competitor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setShowCompetitorModal(false);
      setNewCompetitor({ name: '', website: '', tier: 'tier_3' });
    },
  });

  const discoverCompetitorsMutation = useMutation({
    mutationFn: async () => {
      setIsDiscoveringCompetitors(true);
      const companyInfo = companies.length > 0 
        ? companies.map(c => `${c.name} (${c.industry || 'general'}, ${c.website || 'no website'})`).join(', ')
        : 'General business';
      
      const existingCompetitorNames = competitors.map(c => c.name.toLowerCase());

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these company profiles: ${companyInfo}
        
        Find 5 real competitors in their industry/market. For each competitor provide:
        1. Company name
        2. Website URL
        3. Brief description of why they're a competitor
        
        Focus on actual, real companies that compete in the same space.
        ${existingCompetitorNames.length > 0 ? `Exclude these already tracked competitors: ${existingCompetitorNames.join(', ')}` : ''}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  website: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      let added = 0;
      for (const comp of analysis.competitors || []) {
        if (!existingCompetitorNames.includes(comp.name.toLowerCase())) {
          await base44.entities.Competitor.create({
            name: comp.name,
            website: comp.website
          });
          added++;
        }
      }
      
      return { added, total: analysis.competitors?.length || 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setIsDiscoveringCompetitors(false);
    },
    onError: () => setIsDiscoveringCompetitors(false)
  });

  const analyzeCompetitorMutation = useMutation({
    mutationFn: async (competitor) => {
      setAnalyzingCompetitor(competitor.id);
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze competitor social media presence for: ${competitor.name}
        Website: ${competitor.website || 'N/A'}
        
        Provide comprehensive analysis including:
        1. Estimated social media accounts and follower counts with engagement rates
        2. Top 3 strengths in their social strategy
        3. Top 3 weaknesses or opportunities
        4. Their best performing content themes
        5. Strategy evolution over the last 3 periods
        6. Top 3 successful campaigns they've run
        7. Content frequency analysis`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            social_accounts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  handle: { type: "string" },
                  followers: { type: "number" },
                  engagement_rate: { type: "number" }
                }
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            top_content: { type: "array", items: { type: "string" } },
            strategy_evolution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  focus: { type: "string" },
                  performance: { type: "string" }
                }
              }
            },
            successful_campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  estimated_reach: { type: "number" },
                  key_elements: { type: "array", items: { type: "string" } }
                }
              }
            },
            content_frequency: {
              type: "object",
              properties: {
                posts_per_week: { type: "number" },
                best_days: { type: "array", items: { type: "string" } },
                content_mix: { type: "object" }
              }
            }
          }
        }
      });

      await base44.entities.Competitor.update(competitor.id, {
        ...analysis,
        last_analyzed: new Date().toISOString()
      });
      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setAnalyzingCompetitor(null);
    },
    onError: () => setAnalyzingCompetitor(null),
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ competitor, reportType }) => {
      setGeneratingReport(competitor.id);
      const today = new Date();
      const periodStart = new Date(today);
      if (reportType === 'weekly') {
        periodStart.setDate(today.getDate() - 7);
      } else if (reportType === 'comparative') {
        periodStart.setDate(today.getDate() - 30);
      } else {
        periodStart.setDate(today.getDate() - 1);
      }

      const yourBrandData = reportType === 'comparative' ? {
        followers: socialAccounts.reduce((sum, a) => sum + (a.followers_count || 0), 0),
        engagement_rate: socialAccounts.length > 0 
          ? socialAccounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / socialAccounts.length 
          : 0,
        posts_per_week: scheduledPosts.length > 0 ? Math.round(scheduledPosts.length / 4) : 5,
        avg_likes: socialPosts.length > 0 
          ? Math.round(socialPosts.reduce((sum, p) => sum + (p.likes || 0), 0) / socialPosts.length) 
          : 0
      } : null;

      const promptBase = reportType === 'comparative'
        ? `Generate a comparative analysis report between our brand and ${competitor.name}:
          
Our brand metrics:
- Total followers: ${yourBrandData.followers}
- Avg engagement rate: ${yourBrandData.engagement_rate.toFixed(2)}%
- Posts per week: ${yourBrandData.posts_per_week}
- Avg likes: ${yourBrandData.avg_likes}

Competitor: ${competitor.name}
Website: ${competitor.website || 'N/A'}
Social accounts: ${JSON.stringify(competitor.social_accounts || [])}

Generate detailed comparison with side-by-side metrics, areas we lead/need to improve, and strategic opportunities.`
        : `Generate a ${reportType} competitor analysis report for: ${competitor.name}
        Website: ${competitor.website || 'N/A'}
        Social accounts: ${JSON.stringify(competitor.social_accounts || [])}
        
        Generate comprehensive report with metrics, content trends, sentiment analysis, alerts, top posts, and recommendations.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: promptBase,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            metrics: {
              type: "object",
              properties: {
                follower_change: { type: "number" },
                follower_change_percent: { type: "number" },
                engagement_change: { type: "number" },
                posts_count: { type: "number" },
                avg_likes: { type: "number" },
                avg_comments: { type: "number" },
                avg_shares: { type: "number" }
              }
            },
            content_trends: { type: "array", items: { type: "object" } },
            sentiment_analysis: { type: "object" },
            alerts: { type: "array", items: { type: "object" } },
            top_posts: { type: "array", items: { type: "object" } },
            recommendations: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            comparative_data: { type: "object" }
          }
        }
      });

      const report = await base44.entities.CompetitorReport.create({
        competitor_id: competitor.id,
        report_type: reportType,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: today.toISOString().split('T')[0],
        ...analysis
      });

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-reports'] });
      setGeneratingReport(null);
    },
    onError: () => setGeneratingReport(null),
  });

  const scanNewsMutation = useMutation({
    mutationFn: async (competitor) => {
      setScanningNewsFor(competitor.id);
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the latest news, press releases, and media coverage about ${competitor.name} (${competitor.website || 'company'}).
        
Find recent news articles and press releases with title, source, date, summary, sentiment.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news_mentions: { type: "array", items: { type: "object" } },
            press_releases: { type: "array", items: { type: "object" } }
          }
        }
      });

      await base44.entities.Competitor.update(competitor.id, {
        news_mentions: analysis.news_mentions || [],
        press_releases: analysis.press_releases || [],
        last_news_scan: new Date().toISOString()
      });

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setScanningNewsFor(null);
    },
    onError: () => setScanningNewsFor(null),
  });

  const deepAnalyzeMutation = useMutation({
    mutationFn: async (competitor) => {
      setDeepAnalyzingFor(competitor.id);
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform deep strategic analysis of ${competitor.name} social media presence.
        
Analyze: content strategy, predicted campaigns, industry benchmarks.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            content_strategy: { type: "object" },
            predicted_campaigns: { type: "array", items: { type: "object" } },
            industry_benchmark: { type: "object" }
          }
        }
      });

      await base44.entities.Competitor.update(competitor.id, {
        content_strategy: analysis.content_strategy,
        predicted_campaigns: analysis.predicted_campaigns,
        industry_benchmark: analysis.industry_benchmark,
        last_analyzed: new Date().toISOString()
      });

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setDeepAnalyzingFor(null);
    },
    onError: () => setDeepAnalyzingFor(null),
  });

  const filteredCompetitors = competitors.filter(c => {
    const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || c.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const tierCounts = {
    tier_1: competitors.filter(c => c.tier === 'tier_1').length,
    tier_2: competitors.filter(c => c.tier === 'tier_2').length,
    tier_3: competitors.filter(c => c.tier === 'tier_3').length,
  };

  const totalFollowers = competitors.reduce((sum, c) => {
    const accounts = c.social_accounts || [];
    return sum + accounts.reduce((acc, a) => acc + (a.followers || 0), 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Competitor Analysis</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track and analyze your competitors' social media presence</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => discoverCompetitorsMutation.mutate()}
            disabled={isDiscoveringCompetitors}
            className="gap-2"
          >
            {isDiscoveringCompetitors ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isDiscoveringCompetitors ? 'Discovering...' : 'Auto-Discover'}
          </Button>
          <Button 
            onClick={() => setShowCompetitorModal(true)}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{competitors.length}</p>
            <p className="text-sm text-gray-500">Competitors Tracked</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalFollowers >= 1000000 ? `${(totalFollowers/1000000).toFixed(1)}M` : 
               totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(0)}K` : totalFollowers}
            </p>
            <p className="text-sm text-gray-500">Combined Followers</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{competitorReports.length}</p>
            <p className="text-sm text-gray-500">Reports Generated</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {competitors.filter(c => c.last_analyzed).length}
            </p>
            <p className="text-sm text-gray-500">Analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search competitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedTier} onValueChange={setSelectedTier} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">
              All ({competitors.length})
            </TabsTrigger>
            <TabsTrigger value="tier_1">
              Tier 1 ({tierCounts.tier_1})
            </TabsTrigger>
            <TabsTrigger value="tier_2">
              Tier 2 ({tierCounts.tier_2})
            </TabsTrigger>
            <TabsTrigger value="tier_3">
              Tier 3 ({tierCounts.tier_3})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {competitors.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No competitors tracked"
          description="Add competitors to benchmark your social media performance and get strategic insights."
          actionLabel="Add Competitor"
          onAction={() => setShowCompetitorModal(true)}
        />
      ) : (
        <>
          <CompetitorNetworkMap 
            competitors={filteredCompetitors} 
            onSelectCompetitor={(comp) => setSelectedCompetitor(comp)}
            socialAccounts={socialAccounts}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCompetitors.map((competitor) => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                onAnalyze={() => analyzeCompetitorMutation.mutate(competitor)}
                isAnalyzing={analyzingCompetitor === competitor.id}
                onView={() => setSelectedCompetitor(competitor)}
              />
            ))}
          </div>
        </>
      )}

      {/* Add Competitor Modal */}
      <Dialog open={showCompetitorModal} onOpenChange={setShowCompetitorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Competitor Name</Label>
              <Input
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                placeholder="e.g., Competitor Inc"
              />
            </div>
            <div className="space-y-2">
              <Label>Website (optional)</Label>
              <Input
                value={newCompetitor.website}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, website: e.target.value })}
                placeholder="https://competitor.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Tier Classification</Label>
              <Select value={newCompetitor.tier} onValueChange={(v) => setNewCompetitor({ ...newCompetitor, tier: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier_1">Tier 1 - Direct Competitor</SelectItem>
                  <SelectItem value="tier_2">Tier 2 - Indirect Competitor</SelectItem>
                  <SelectItem value="tier_3">Tier 3 - Potential Threat</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {newCompetitor.tier === 'tier_1' && 'Direct competitors with similar products/services'}
                {newCompetitor.tier === 'tier_2' && 'Indirect competitors in adjacent markets'}
                {newCompetitor.tier === 'tier_3' && 'Emerging or potential competitors'}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCompetitorModal(false)}>Cancel</Button>
              <Button 
                onClick={() => createCompetitorMutation.mutate(newCompetitor)}
                disabled={!newCompetitor.name || createCompetitorMutation.isPending}
              >
                {createCompetitorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Competitor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Competitor Detail Modal */}
      <CompetitorDetailModal
        open={!!selectedCompetitor}
        onClose={() => setSelectedCompetitor(null)}
        competitor={selectedCompetitor}
        reports={competitorReports.filter(r => r.competitor_id === selectedCompetitor?.id)}
        onGenerateReport={(type) => generateReportMutation.mutate({ competitor: selectedCompetitor, reportType: type })}
        isGenerating={generatingReport === selectedCompetitor?.id}
        onViewReport={(report) => { setSelectedCompetitor(null); setSelectedReport(report); }}
        onScanNews={() => scanNewsMutation.mutate(selectedCompetitor)}
        isScanningNews={scanningNewsFor === selectedCompetitor?.id}
        onDeepAnalyze={() => deepAnalyzeMutation.mutate(selectedCompetitor)}
        isDeepAnalyzing={deepAnalyzingFor === selectedCompetitor?.id}
        yourBrandName={companies[0]?.name || 'Your Brand'}
      />

      {/* Competitor Report Modal */}
      <CompetitorReportModal
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        competitorName={competitors.find(c => c.id === selectedReport?.competitor_id)?.name || 'Competitor'}
      />
    </div>
  );
}