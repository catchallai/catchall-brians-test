import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Globe, TrendingUp, Link2, Search, ExternalLink, Settings, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import SEOScoreGauge from '@/components/seo/SEOScoreGauge';
import WebsiteModal from '@/components/modals/WebsiteModal';
import EmptyState from '@/components/ui/EmptyState';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SEODashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
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

  // Calculate toxicity breakdown
  const toxicityData = React.useMemo(() => {
    if (mentions.length === 0) return null;
    const negative = mentions.filter(m => m.sentiment === 'negative').length;
    const neutral = mentions.filter(m => m.sentiment === 'neutral').length;
    const positive = mentions.filter(m => m.sentiment === 'positive').length;
    const total = mentions.length;
    
    const toxicPercent = Math.round((negative / total) * 100);
    const potToxicPercent = Math.round((neutral / total) * 100);
    const nonToxicPercent = Math.round((positive / total) * 100);
    
    let level = 'Low';
    if (toxicPercent > 30) level = 'High';
    else if (toxicPercent > 15) level = 'Medium';
    
    return {
      toxic: negative,
      toxicPercent,
      potToxic: neutral,
      potToxicPercent,
      nonToxic: positive,
      nonToxicPercent,
      total,
      level
    };
  }, [mentions]);

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

  const [analyzingWebsite, setAnalyzingWebsite] = useState(null);

  const analyzeWebsiteMutation = useMutation({
    mutationFn: async (website) => {
      setAnalyzingWebsite(website.id);
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the SEO metrics for this website: ${website.url}
        Website name: ${website.name}
        
        Search the internet and provide realistic SEO data including:
        1. Domain Authority (0-100 scale, based on backlink profile strength)
        2. Page Authority (0-100 scale)
        3. Estimated monthly organic traffic (number)
        4. Overall SEO score (0-100, based on technical SEO, content, backlinks)
        5. Top 5 keywords this site likely ranks for with their position, search volume, and difficulty
        6. Top 5 backlinks pointing to this site with source domain, anchor text, and domain authority
        
        Be realistic with the numbers based on what you find about this website.`,
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

      // Update website with SEO metrics
      await base44.entities.Website.update(website.id, {
        domain_authority: analysis.domain_authority,
        page_authority: analysis.page_authority,
        organic_traffic: analysis.organic_traffic,
        seo_score: analysis.seo_score,
        last_audit_date: new Date().toISOString()
      });

      // Create keywords
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

      // Create backlinks
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

  const getWebsiteKeywords = (websiteId) => keywords.filter(k => k.website_id === websiteId);
  const getWebsiteBacklinks = (websiteId) => backlinks.filter(b => b.website_id === websiteId);

  const formatNumber = (num) => {
    if (!num) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loadingWebsites) {
    return (
      <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
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

      {/* Toxicity Score Card */}
      {toxicityData && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium text-gray-700">Overall Toxicity Score</h3>
              <span className="text-gray-400 cursor-help" title="Based on sentiment analysis of social media mentions">ⓘ</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className={`text-3xl font-bold ${toxicityData.level === 'High' ? 'text-red-500' : toxicityData.level === 'Medium' ? 'text-orange-500' : 'text-emerald-500'}`}>
                {toxicityData.level}
              </span>
              <span className="text-gray-600">
                {toxicityData.level === 'High' ? 'Take a close look at your most toxic mentions' : 
                 toxicityData.level === 'Medium' ? 'Monitor your negative mentions closely' : 
                 'Your social presence looks healthy'}
              </span>
            </div>

            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-2xl font-bold text-red-500">{toxicityData.toxic}</p>
                <p className="text-sm text-gray-500">{toxicityData.toxicPercent}% toxic</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{toxicityData.potToxic}</p>
                <p className="text-sm text-gray-500">{toxicityData.potToxicPercent}% pot. toxic</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{toxicityData.nonToxic}</p>
                <p className="text-sm text-gray-500">{toxicityData.nonToxicPercent}% non-toxic</p>
              </div>
            </div>

            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="bg-red-500" style={{ width: `${toxicityData.toxicPercent}%` }} />
              <div className="bg-orange-400" style={{ width: `${toxicityData.potToxicPercent}%` }} />
              <div className="bg-emerald-500 rounded-r-full" style={{ width: `${toxicityData.nonToxicPercent}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600 font-medium">Total Mentions</span>
                  <span className="text-gray-400 cursor-help" title="Total analyzed social media mentions">ⓘ</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{toxicityData.total.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600 font-medium">Analyzed Platforms</span>
                  <span className="text-gray-400 cursor-help" title="Number of platforms being monitored">ⓘ</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{[...new Set(mentions.map(m => m.platform))].length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          {/* Website Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {websites.map((website) => {
              const siteKeywords = getWebsiteKeywords(website.id);
              const siteBacklinks = getWebsiteBacklinks(website.id);
              const top10Keywords = siteKeywords.filter(k => k.current_position && k.current_position <= 10).length;
              
              return (
                <Card key={website.id} className="border-0 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                          {website.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{website.name}</CardTitle>
                          <a 
                            href={website.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                          >
                            {website.url?.replace(/^https?:\/\//, '').slice(0, 30)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => analyzeWebsiteMutation.mutate(website)}
                          disabled={analyzingWebsite === website.id}
                        >
                          {analyzingWebsite === website.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          onClick={() => handleEdit(website)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* SEO Score */}
                    <div className="flex items-center justify-center mb-6">
                      <SEOScoreGauge score={website.seo_score || 0} label="SEO Score" size="md" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                          <Search className="w-4 h-4" />
                          <span className="text-xs">Keywords</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{siteKeywords.length}</p>
                        <p className="text-xs text-emerald-600">{top10Keywords} in top 10</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                          <Link2 className="w-4 h-4" />
                          <span className="text-xs">Backlinks</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{siteBacklinks.length}</p>
                        <p className="text-xs text-gray-500">
                          {siteBacklinks.filter(b => b.status === 'active').length} active
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs">Traffic</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(website.organic_traffic)}</p>
                        <p className="text-xs text-gray-500">monthly</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                          <Globe className="w-4 h-4" />
                          <span className="text-xs">DA</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{website.domain_authority || '-'}</p>
                        <p className="text-xs text-gray-500">domain auth</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to={createPageUrl('Keywords')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">Keywords</h3>
                    <p className="text-sm text-gray-500">{keywords.length} keywords tracked</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to={createPageUrl('Backlinks')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <Link2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">Backlinks</h3>
                    <p className="text-sm text-gray-500">{backlinks.length} backlinks found</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to={createPageUrl('SEOAudit')}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">SEO Audit</h3>
                    <p className="text-sm text-gray-500">Run site analysis</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
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