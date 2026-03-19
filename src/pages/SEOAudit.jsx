import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Eye,
  Globe,
  Bot,
  FileText,
  Link2,
  Smartphone,
  Code,
} from 'lucide-react';
import SEOScoreGauge from '@/components/seo/SEOScoreGauge';
import EmptyState from '@/components/ui/EmptyState';
import TechnicalSEOCard from '@/components/seo/audit/TechnicalSEOCard';
import ContentOptimizationCard from '@/components/seo/audit/ContentOptimizationCard';
import BacklinkAnalysisCard from '@/components/seo/audit/BacklinkAnalysisCard';
import MobileFriendlinessCard from '@/components/seo/audit/MobileFriendlinessCard';
import SchemaMarkupCard from '@/components/seo/audit/SchemaMarkupCard';

export default function SEOAudit() {
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: websites = [], isLoading: loadingWebsites } = useQuery({
    queryKey: ['websites', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Website.filter(
        { business_id: user.current_business_id },
        '-created_date',
        50
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: audits = [], isLoading: loadingAudits } = useQuery({
    queryKey: ['seo-audits', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.SEOAudit.filter(
        { business_id: user.current_business_id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords-audit', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Keyword.filter(
        { business_id: user.current_business_id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks-audit', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Backlink.filter(
        { business_id: user.current_business_id },
        '-created_date',
        200
      );
    },
    enabled: !!user?.current_business_id,
  });

  const createAuditMutation = useMutation({
    mutationFn: async (websiteId) => {
      setIsAnalyzing(true);
      // Simulate AI analysis
      const website = websites.find((w) => w.id === websiteId);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the SEO for this website: ${website?.url || 'example.com'}
        Generate a realistic SEO audit report with:
        - overall_score (0-100)
        - performance_score (0-100)
        - accessibility_score (0-100)
        - best_practices_score (0-100)
        - seo_score (0-100)
        - issues array (3-5 items with type, severity [critical/warning/info], message, and page)
        - recommendations array (3-5 actionable suggestions)`,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number' },
            performance_score: { type: 'number' },
            accessibility_score: { type: 'number' },
            best_practices_score: { type: 'number' },
            seo_score: { type: 'number' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  message: { type: 'string' },
                  page: { type: 'string' },
                },
              },
            },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      return base44.entities.SEOAudit.create({
        website_id: websiteId,
        ...response,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-audits'] });
      setIsAnalyzing(false);
    },
    onError: () => {
      setIsAnalyzing(false);
    },
  });

  const runAudit = (websiteId) => {
    setSelectedWebsite(websiteId);
    createAuditMutation.mutate(websiteId);
  };

  const getLatestAudit = (websiteId) => {
    return audits.find((a) => a.website_id === websiteId);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <Info className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loadingWebsites) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Audit</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive analysis of your website's SEO health
          </p>
        </div>
        {websites.length > 0 && (
          <div className="flex gap-3">
            <Select value={selectedWebsite || ''} onValueChange={setSelectedWebsite}>
              <SelectTrigger className="w-48 dark:bg-gray-800 dark:border-gray-700">
                <SelectValue placeholder="Select website" />
              </SelectTrigger>
              <SelectContent>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedWebsite && runAudit(selectedWebsite)}
              disabled={!selectedWebsite || isAnalyzing}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Run Full Audit
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {websites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No websites to audit"
          description="Add a website first to run SEO audits."
          actionLabel="Go to SEO Dashboard"
        />
      ) : !selectedWebsite ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select a Website
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Choose a website from the dropdown to run a comprehensive SEO audit
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Audit Results */}
          {(() => {
            const audit = getLatestAudit(selectedWebsite);
            const website = websites.find((w) => w.id === selectedWebsite);

            if (!audit) {
              return (
                <Card className="glass-card rounded-2xl">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Audit Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Click "Run Full Audit" to analyze {website?.name}
                    </p>
                    <Button
                      onClick={() => runAudit(selectedWebsite)}
                      disabled={isAnalyzing}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Start Audit
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            return (
              <>
                {/* Score Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <SEOScoreGauge score={audit.overall_score} label="Overall" size="md" />
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                    <Zap className="w-6 h-6 text-amber-500 mb-2" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {audit.performance_score || '-'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Performance</span>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                    <Eye className="w-6 h-6 text-violet-500 mb-2" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {audit.accessibility_score || '-'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Accessibility</span>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                    <Shield className="w-6 h-6 text-blue-500 mb-2" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {audit.best_practices_score || '-'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Best Practices</span>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                    <Globe className="w-6 h-6 text-emerald-500 mb-2" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {audit.seo_score || '-'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">SEO</span>
                  </Card>
                </div>

                {/* Tabs for Detailed Analysis */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                    <TabsTrigger value="overview" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="gap-2">
                      <Bot className="w-4 h-4" />
                      Technical
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="backlinks" className="gap-2">
                      <Link2 className="w-4 h-4" />
                      Backlinks
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="gap-2">
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </TabsTrigger>
                    <TabsTrigger value="schema" className="gap-2">
                      <Code className="w-4 h-4" />
                      Schema
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Issues */}
                    {audit.issues && audit.issues.length > 0 && (
                      <Card className="glass-card rounded-2xl">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900 dark:text-white">
                            Issues Found
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {audit.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900"
                            >
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {issue.type}
                                  </span>
                                  <Badge
                                    className={`${getSeverityColor(issue.severity)} text-xs border`}
                                  >
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {issue.message}
                                </p>
                                {issue.page && (
                                  <p className="text-xs text-gray-400 mt-1">{issue.page}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {audit.recommendations && audit.recommendations.length > 0 && (
                      <Card className="glass-card rounded-2xl">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900 dark:text-white">
                            Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {audit.recommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20"
                            >
                              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                              <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="technical">
                    <TechnicalSEOCard data={audit.technical_data} />
                  </TabsContent>

                  <TabsContent value="content">
                    <ContentOptimizationCard data={audit.content_data} keywords={keywords} />
                  </TabsContent>

                  <TabsContent value="backlinks">
                    <BacklinkAnalysisCard data={audit.backlink_data} backlinks={backlinks} />
                  </TabsContent>

                  <TabsContent value="mobile">
                    <MobileFriendlinessCard data={audit.mobile_data} />
                  </TabsContent>

                  <TabsContent value="schema">
                    <SchemaMarkupCard data={audit.schema_data} />
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
