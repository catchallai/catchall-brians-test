import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe } from "lucide-react";
import WebsiteModal from '@/components/modals/WebsiteModal';
import EmptyState from '@/components/ui/EmptyState';
import SEOOverviewStats from '@/components/seo/SEOOverviewStats';
import WebsiteCard from '@/components/seo/WebsiteCard';
import SentimentOverview from '@/components/seo/SentimentOverview';
import QuickActionsGrid from '@/components/seo/QuickActionsGrid';
import GoogleTrackingCard from '@/components/seo/GoogleTrackingCard';
import ShareOfVoiceCard from '@/components/seo/ShareOfVoiceCard';
import KeywordCannibalizationCard from '@/components/seo/KeywordCannibalizationCard';
import HistoricalDataCard from '@/components/seo/HistoricalDataCard';
import MultiLocationCard from '@/components/seo/MultiLocationCard';
import PredictiveAnalyticsCard from '@/components/seo/PredictiveAnalyticsCard';
import TechnicalAuditCard from '@/components/seo/TechnicalAuditCard';

export default function SEODashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(null);
  const queryClient = useQueryClient();

  const { data: websites = [], isLoading: loadingWebsites } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 500),
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 500),
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

  const saveTrackingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Website.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['websites'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Website.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setShowModal(false);
      setSelectedWebsite(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Website.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setShowModal(false);
      setSelectedWebsite(null);
    },
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

      await base44.entities.Website.update(website.id, {
        domain_authority: analysis.domain_authority,
        page_authority: analysis.page_authority,
        organic_traffic: analysis.organic_traffic,
        seo_score: analysis.seo_score,
        last_audit_date: new Date().toISOString()
      });

      if (analysis.keywords?.length > 0) {
        for (const kw of analysis.keywords) {
          await base44.entities.Keyword.create({
            website_id: website.id,
            keyword: kw.keyword,
            current_position: kw.current_position,
            search_volume: kw.search_volume,
            difficulty: kw.difficulty,
            target_url: website.url
          });
        }
      }

      if (analysis.backlinks?.length > 0) {
        for (const bl of analysis.backlinks) {
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

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['backlinks'] });
      setAnalyzingWebsite(null);
    },
    onError: () => {
      setAnalyzingWebsite(null);
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
      <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor and improve your search engine rankings</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
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
        <>
          {/* Overview Stats */}
          <SEOOverviewStats websites={websites} keywords={keywords} backlinks={backlinks} />

          {/* Quick Actions */}
          <QuickActionsGrid keywords={keywords} backlinks={backlinks} />

          {/* Tabs for organized content */}
          <Tabs defaultValue="websites" className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="websites">Websites</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="websites" className="space-y-6">
              {/* Website Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {websites.map((website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    keywords={getWebsiteKeywords(website.id)}
                    backlinks={getWebsiteBacklinks(website.id)}
                    onEdit={() => handleEdit(website)}
                    onAnalyze={() => analyzeWebsiteMutation.mutate(website)}
                    isAnalyzing={analyzingWebsite === website.id}
                  />
                ))}
              </div>

              {/* Technical Audit Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {websites.slice(0, 2).map((website) => (
                  <TechnicalAuditCard key={website.id} website={website} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SentimentOverview mentions={mentions} />
                <ShareOfVoiceCard 
                  website={websites[0]} 
                  keywords={keywords}
                  onSaveSov={(data) => saveSovMutation.mutate(data)}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HistoricalDataCard 
                  keywords={keywords} 
                  keywordHistory={keywordHistory}
                />
                <MultiLocationCard 
                  keywords={keywords} 
                  keywordHistory={keywordHistory}
                />
              </div>
              <PredictiveAnalyticsCard 
                websites={websites} 
                keywords={keywords} 
                backlinks={backlinks} 
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <GoogleTrackingCard 
                  website={websites[0]} 
                  onSaveTracking={(data) => websites[0] && saveTrackingMutation.mutate({ id: websites[0].id, data })}
                />
                <KeywordCannibalizationCard 
                  keywords={keywords} 
                  websites={websites}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal */}
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