import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import SEOReportCard from '@/components/seo/SEOReportCard';
import CreateReportModal from '@/components/seo/CreateReportModal';
import ReportViewer from '@/components/seo/ReportViewer';
import { useToast } from '@/components/ui/toast-provider';

export default function SEODashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [runningReportId, setRunningReportId] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

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

  const { data: seoReports = [] } = useQuery({
    queryKey: ['seo-reports'],
    queryFn: () => base44.entities.SEOReport.list('-created_date', 50),
  });

  const saveSovMutation = useMutation({
    mutationFn: (data) => base44.entities.ShareOfVoice.create(data),
  });

  const saveTrackingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Website.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['websites'] }),
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.SEOReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
      setShowReportModal(false);
      toast.success('Report created successfully');
    },
    onError: () => toast.error('Failed to create report')
  });

  const runReportMutation = useMutation({
    mutationFn: async (report) => {
      setRunningReportId(report.id);
      const website = websites.find(w => w.id === report.website_id);
      const siteKeywords = keywords.filter(k => k.website_id === report.website_id);
      const siteBacklinks = backlinks.filter(b => b.website_id === report.website_id);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate an SEO performance report for: ${website?.url}
        
        Current metrics:
        - SEO Score: ${website?.seo_score || 'N/A'}
        - Domain Authority: ${website?.domain_authority || 'N/A'}
        - Organic Traffic: ${website?.organic_traffic || 'N/A'}
        - Total Keywords: ${siteKeywords.length}
        - Keywords in top 10: ${siteKeywords.filter(k => k.current_position <= 10).length}
        - Total Backlinks: ${siteBacklinks.length}

        Top keywords: ${siteKeywords.slice(0, 10).map(k => `${k.keyword} (pos ${k.current_position})`).join(', ')}

        Provide:
        1. Performance summary with trend analysis
        2. Top 5 keywords with position changes
        3. Key insights and recommendations
        4. Estimated traffic and ranking changes (as percentages)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            seo_score: { type: "number" },
            seo_score_change: { type: "number" },
            organic_traffic: { type: "number" },
            traffic_change: { type: "number" },
            total_keywords: { type: "number" },
            top_10_keywords: { type: "number" },
            total_backlinks: { type: "number" },
            backlinks_change: { type: "number" },
            domain_authority: { type: "number" },
            top_keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  position: { type: "number" },
                  search_volume: { type: "number" },
                  change: { type: "number" }
                }
              }
            },
            trends_summary: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      const reportData = {
        ...analysis,
        generated_at: new Date().toISOString(),
        website_name: website?.name,
        website_url: website?.url
      };

      await base44.entities.SEOReport.update(report.id, {
        report_data: reportData,
        last_run: new Date().toISOString()
      });

      return { ...report, report_data: reportData };
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
      setRunningReportId(null);
      setViewingReport(updatedReport);
      toast.success('Report generated successfully');
    },
    onError: () => {
      setRunningReportId(null);
      toast.error('Failed to generate report');
    }
  });

  const handleExportReport = (report, format) => {
    if (!report.report_data) return;
    const data = report.report_data;
    const website = websites.find(w => w.id === report.website_id);

    if (format === 'csv') {
      const csvRows = [
        ['SEO Report', report.name],
        ['Website', website?.name || ''],
        ['Generated', data.generated_at],
        [''],
        ['Metric', 'Value', 'Change'],
        ['SEO Score', data.seo_score, `${data.seo_score_change}%`],
        ['Organic Traffic', data.organic_traffic, `${data.traffic_change}%`],
        ['Total Keywords', data.total_keywords, ''],
        ['Top 10 Keywords', data.top_10_keywords, ''],
        ['Total Backlinks', data.total_backlinks, `${data.backlinks_change}%`],
        [''],
        ['Top Keywords'],
        ['Keyword', 'Position', 'Search Volume', 'Change'],
        ...(data.top_keywords || []).map(k => [k.keyword, k.position, k.search_volume, k.change])
      ];
      const csvContent = csvRows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const content = `
SEO REPORT: ${report.name}
Website: ${website?.name} (${website?.url})
Generated: ${new Date(data.generated_at).toLocaleString()}

PERFORMANCE OVERVIEW
====================
SEO Score: ${data.seo_score} (${data.seo_score_change > 0 ? '+' : ''}${data.seo_score_change}%)
Organic Traffic: ${data.organic_traffic?.toLocaleString()} (${data.traffic_change > 0 ? '+' : ''}${data.traffic_change}%)
Total Keywords: ${data.total_keywords} (${data.top_10_keywords} in top 10)
Total Backlinks: ${data.total_backlinks} (${data.backlinks_change > 0 ? '+' : ''}${data.backlinks_change}%)

TOP KEYWORDS
============
${(data.top_keywords || []).map(k => `• ${k.keyword} - Position ${k.position} (Vol: ${k.search_volume})`).join('\n')}

TRENDS & INSIGHTS
=================
${data.trends_summary}

RECOMMENDATIONS
===============
${(data.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
      `;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

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

      // Get existing keywords to prevent duplicates
      const existingKeywords = await base44.entities.Keyword.filter({ website_id: website.id });
      const existingKeywordNames = new Set(existingKeywords.map(k => k.keyword?.toLowerCase()));

      if (analysis.keywords?.length > 0) {
        for (const kw of analysis.keywords) {
          if (!existingKeywordNames.has(kw.keyword?.toLowerCase())) {
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
      }

      // Get existing backlinks to prevent duplicates
      const existingBacklinks = await base44.entities.Backlink.filter({ website_id: website.id });
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
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Dashboard</h1>
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
            <TabsList className="glass-card">
              <TabsTrigger value="websites">Websites</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
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

            <TabsContent value="reports" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Scheduled Reports</h2>
                  <p className="text-sm text-gray-500">Automate weekly or monthly SEO performance reports</p>
                </div>
                <Button onClick={() => setShowReportModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4" />
                  Create Report
                </Button>
              </div>

              {seoReports.length === 0 ? (
                <Card className="glass-card rounded-2xl">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="font-medium text-gray-900">No reports yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Create your first scheduled SEO report</p>
                    <Button onClick={() => setShowReportModal(true)} className="mt-4 gap-2">
                      <Plus className="w-4 h-4" /> Create Report
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seoReports.map(report => (
                    <SEOReportCard
                      key={report.id}
                      report={report}
                      website={websites.find(w => w.id === report.website_id)}
                      onRunReport={(r) => runReportMutation.mutate(r)}
                      onExport={handleExportReport}
                      isRunning={runningReportId === report.id}
                    />
                  ))}
                </div>
              )}
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

      {/* Modals */}
      <WebsiteModal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedWebsite(null); }}
        website={selectedWebsite}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <CreateReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSave={(data) => createReportMutation.mutate(data)}
        websites={websites}
        isLoading={createReportMutation.isPending}
      />

      <ReportViewer
        open={!!viewingReport}
        onClose={() => setViewingReport(null)}
        report={viewingReport}
        website={viewingReport ? websites.find(w => w.id === viewingReport.website_id) : null}
        onExport={handleExportReport}
      />
    </div>
  );
}