import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Globe, TrendingUp, Link2, Search, ExternalLink, Settings } from "lucide-react";
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Website.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setShowModal(false);
    },
  });

  const handleSave = (data) => {
    createMutation.mutate(data);
  };

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
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}