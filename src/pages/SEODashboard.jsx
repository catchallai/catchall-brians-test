import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import WebsiteModal from '@/components/modals/WebsiteModal';
import EmptyState from '@/components/ui/EmptyState';
import SEOOverviewStats from '@/components/seo/SEOOverviewStats';
import WebsiteCard from '@/components/seo/WebsiteCard';
import SentimentOverview from '@/components/seo/SentimentOverview';
import QuickActionsGrid from '@/components/seo/QuickActionsGrid';
import ShareOfVoiceCard from '@/components/seo/ShareOfVoiceCard';
import HistoricalDataCard from '@/components/seo/HistoricalDataCard';
import PredictiveAnalyticsCard from '@/components/seo/PredictiveAnalyticsCard';
import TechnicalAuditCard from '@/components/seo/TechnicalAuditCard';
import SEOHistoricalTracker from '@/components/seo/SEOHistoricalTracker';
import SEOAnomalyDetector from '@/components/seo/SEOAnomalyDetector';
import LiveDataIntegration from '@/components/seo/LiveDataIntegration';
import { useToast } from '@/components/ui/toast-provider';

export default function SEODashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: websites = [], isLoading: loadingWebsites } = useQuery({
    queryKey: ['websites'],
    queryFn: async () => {
      return await base44.entities.Website.list('-created_date', 50);
    },
    enabled: !!user,
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: async () => {
      return await base44.entities.Keyword.list('-created_date', 500);
    },
    enabled: !!user,
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks'],
    queryFn: async () => {
      return await base44.entities.Backlink.list('-created_date', 500);
    },
    enabled: !!user,
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['listening-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 500),
  });

  const { data: keywordHistory = [] } = useQuery({
    queryKey: ['keyword-history'],
    queryFn: () => base44.entities.KeywordHistory.list('-date', 1000),
  });

  const saveSovMutation = useMutation({
    mutationFn: (data) => base44.entities.ShareOfVoice.create(data),
  });

  const detectSEOAnomaliesMutation = useMutation({
    mutationFn: async () => {
      const seoData = websites.map(w => ({
        name: w.name,
        url: w.url,
        seo_score: w.seo_score || 0,
        organic_traffic: w.organic_traffic || 0,
        domain_authority: w.domain_authority || 0
      }));

      const keywordData = keywords.map(k => ({
        keyword: k.keyword,
        position: k.current_position,
        previous: k.previous_position,
        volume: k.search_volume
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze SEO data for anomalies and potential issues:

Websites: ${JSON.stringify(seoData, null, 2)}
Keywords tracked: ${keywords.length}
Sample keywords: ${JSON.stringify(keywordData.slice(0, 10), null, 2)}

Detect:
1. Sudden ranking drops (>10 positions)
2. Traffic anomalies (sudden drops >30%)
3. DA/PA drops
4. Multiple keywords losing positions
5. Technical issues patterns
6. Backlink profile anomalies

For each issue, provide:
- Severity (critical/high/medium/low)
- Title
- Description
- Possible cause
- Recommendation`,
        response_json_schema: {
          type: "object",
          properties: {
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });

      return result.anomalies || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Website.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setShowModal(false);
      setSelectedWebsite(null);
      toast.success('Website added successfully');
    },
    onError: () => toast.error('Failed to add website')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Website.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setShowModal(false);
      setSelectedWebsite(null);
      toast.success('Website updated successfully');
    },
    onError: () => toast.error('Failed to update website')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Website.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast.success('Website deleted successfully');
    },
    onError: () => toast.error('Failed to delete website')
  });

  const analyzeWebsiteMutation = useMutation({
    mutationFn: async (website) => {
      setAnalyzingWebsite(website.id);
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the SEO metrics for this website: ${website.url}
        Website name: ${website.name}
        
        Provide realistic SEO data including:
        1. Domain Authority (0-100)
        2. Page Authority (0-100)
        3. Estimated monthly organic traffic
        4. Overall SEO score (0-100)
        5. Top 5 keywords with position, search volume, difficulty
        6. Top 5 backlinks with source domain, anchor text, DA`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            domain_authority: { type: "number" },
            page_authority: { type: "number" },
            organic_traffic: { type: "number" },
            seo_score: { type: "number" },
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  current_position: { type: "number" },
                  search_volume: { type: "number" },
                  difficulty: { type: "number" }
                }
              }
            },
            backlinks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_domain: { type: "string" },
                  source_url: { type: "string" },
                  anchor_text: { type: "string" },
                  domain_authority: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Count keywords and backlinks for this website
      const existingKeywords = await base44.entities.Keyword.filter({ website_id: website.id });
      const existingBacklinks = await base44.entities.Backlink.filter({ website_id: website.id });
      
      await base44.entities.Website.update(website.id, {
        domain_authority: analysis.domain_authority,
        page_authority: analysis.page_authority,
        organic_traffic: analysis.organic_traffic,
        seo_score: analysis.seo_score,
        total_keywords: existingKeywords.length + (analysis.keywords?.length || 0),
        total_backlinks: existingBacklinks.length + (analysis.backlinks?.length || 0),
        last_audit_date: new Date().toISOString()
      });

      const existingKeywordNames = new Set(existingKeywords.map(k => k.keyword?.toLowerCase()));

      // Create keywords with historical tracking
      if (analysis.keywords?.length > 0) {
        for (const kw of analysis.keywords) {
          if (!existingKeywordNames.has(kw.keyword?.toLowerCase())) {
            const newKeyword = await base44.entities.Keyword.create({
              website_id: website.id,
              keyword: kw.keyword,
              current_position: kw.current_position,
              search_volume: kw.search_volume,
              difficulty: kw.difficulty,
              target_url: website.url
            });
            
            // Create initial history entry
            await base44.entities.KeywordHistory.create({
              keyword_id: newKeyword.id,
              website_id: website.id,
              position: kw.current_position,
              date: new Date().toISOString().split('T')[0],
              search_volume: kw.search_volume,
              url: website.url
            });
          }
        }
      }

      const existingBacklinkDomains = new Set(existingBacklinks.map(b => b.source_domain?.toLowerCase()));

      if (analysis.backlinks?.length > 0) {
        for (const bl of analysis.backlinks) {
          if (!existingBacklinkDomains.has(bl.source_domain?.toLowerCase())) {
            await base44.entities.Backlink.create({
              website_id: website.id,
              source_url: bl.source_url || `https://${bl.source_domain}`,
              source_domain: bl.source_domain,
              target_url: website.url,
              anchor_text: bl.anchor_text,
              domain_authority: bl.domain_authority,
              link_type: 'dofollow',
              status: 'active',
              first_seen: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['backlinks'] });
      setAnalyzingWebsite(null);
      toast.success('Website analysis complete');
    },
    onError: () => {
      setAnalyzingWebsite(null);
      toast.error('Analysis failed');
    }
  });

  const handleSave = (data) => {
    if (selectedWebsite) {
      updateMutation.mutate({ id: selectedWebsite.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (website) => {
    setSelectedWebsite(website);
    setShowModal(true);
  };

  const getWebsiteKeywords = (websiteId) => keywords.filter(k => k.website_id === websiteId);
  const getWebsiteBacklinks = (websiteId) => backlinks.filter(b => b.website_id === websiteId);

  if (loadingWebsites) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">SEO Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Monitor and improve your search engine rankings</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Website
        </Button>
      </div>

      {websites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No websites tracked yet"
          description="Add your first website to start monitoring its SEO performance."
          actionLabel="Add Website"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <SEOOverviewStats websites={websites} keywords={keywords} backlinks={backlinks} />

          {/* Quick Actions */}
          <QuickActionsGrid keywords={keywords} backlinks={backlinks} />

          {/* Main Content Grid */}
          <Tabs defaultValue="websites" className="space-y-5">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="websites" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                Websites
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="websites" className="space-y-6 mt-0">
              {/* Website Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {websites.map((website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    keywords={getWebsiteKeywords(website.id)}
                    backlinks={getWebsiteBacklinks(website.id)}
                    onEdit={() => handleEdit(website)}
                    onAnalyze={() => analyzeWebsiteMutation.mutate(website)}
                    onDelete={() => deleteMutation.mutate(website.id)}
                    isAnalyzing={analyzingWebsite === website.id}
                  />
                ))}
              </div>

              {/* Technical Audit Section */}
              {websites.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {websites.slice(0, 2).map((website) => (
                    <TechnicalAuditCard 
                      key={website.id} 
                      website={website}
                      onAuditSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ['websites'] });
                        toast.success('Technical audit saved');
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-5 mt-0">
              {websites[0] && (
                <LiveDataIntegration 
                  website={websites[0]}
                  onDataFetched={async ({ source, data }) => {
                    // Update website with live data
                    if (source === 'gsc' && data.keywords) {
                      // Sync GSC keywords
                      for (const kw of data.keywords.slice(0, 20)) {
                        const existing = keywords.find(k => k.keyword?.toLowerCase() === kw.keyword?.toLowerCase());
                        if (existing) {
                          await base44.entities.Keyword.update(existing.id, {
                            current_position: Math.round(kw.position),
                            search_volume: kw.impressions
                          });
                        } else {
                          await base44.entities.Keyword.create({
                            website_id: websites[0].id,
                            keyword: kw.keyword,
                            current_position: Math.round(kw.position),
                            search_volume: kw.impressions,
                            target_url: kw.pages?.[0] || websites[0].url
                          });
                        }
                      }
                    }
                    
                    if (source === 'semrush' && data.domain_metrics) {
                      await base44.entities.Website.update(websites[0].id, {
                        organic_traffic: data.domain_metrics.organic_traffic,
                        total_keywords: data.domain_metrics.organic_keywords,
                        total_backlinks: data.backlinks?.total_backlinks || websites[0].total_backlinks
                      });
                    }
                    
                    if (source === 'ahrefs' && data.domain_metrics) {
                      await base44.entities.Website.update(websites[0].id, {
                        domain_authority: data.domain_metrics.domain_rating,
                        organic_traffic: data.domain_metrics.organic_traffic,
                        total_backlinks: data.domain_metrics.backlinks
                      });
                      
                      // Sync backlinks
                      if (data.backlinks) {
                        for (const bl of data.backlinks.slice(0, 50)) {
                          const existing = backlinks.find(b => 
                            b.source_url === bl.source_url && b.target_url === bl.target_url
                          );
                          if (!existing) {
                            await base44.entities.Backlink.create({
                              website_id: websites[0].id,
                              source_url: bl.source_url,
                              source_domain: bl.source_domain,
                              target_url: bl.target_url,
                              anchor_text: bl.anchor_text,
                              domain_authority: bl.domain_rating,
                              link_type: bl.link_type,
                              first_seen: bl.first_seen
                            });
                          }
                        }
                      }
                    }
                    
                    queryClient.invalidateQueries({ queryKey: ['websites'] });
                    queryClient.invalidateQueries({ queryKey: ['keywords'] });
                    queryClient.invalidateQueries({ queryKey: ['backlinks'] });
                    toast.success('Live data synced successfully!');
                  }}
                />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SentimentOverview mentions={mentions} />
                <ShareOfVoiceCard 
                  website={websites[0]} 
                  keywords={keywords}
                  onSaveSov={(data) => saveSovMutation.mutate(data)}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SEOHistoricalTracker 
                  keywords={keywords}
                  keywordHistory={keywordHistory}
                />
                <SEOAnomalyDetector
                  websites={websites}
                  keywords={keywords}
                  backlinks={backlinks}
                  onDetectAnomalies={() => detectSEOAnomaliesMutation.mutateAsync()}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <HistoricalDataCard 
                  keywords={keywords} 
                  keywordHistory={keywordHistory}
                />
                <PredictiveAnalyticsCard 
                  websites={websites} 
                  keywords={keywords} 
                  backlinks={backlinks} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modals */}
      <WebsiteModal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedWebsite(null); }}
        website={selectedWebsite}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}