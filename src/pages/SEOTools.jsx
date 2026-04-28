import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Globe,
  Shield,
  Smartphone,
  Zap,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Code,
  Target,
  Sparkles,
} from 'lucide-react';
import SEOCheckCard from '@/components/seo/SEOCheckCard';
import KeywordResearchCard from '@/components/seo/KeywordResearchCard';
import OnPageSEOAnalyzer from '@/components/seo/OnPageSEOAnalyzer';
import SERPGapAnalyzer from '@/components/seo/SERPGapAnalyzer';
import ExplodingTopicsCard from '@/components/seo/ExplodingTopicsCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CHECK_CATEGORIES = [
  { id: 'technical', label: 'Technical SEO', icon: Code },
  { id: 'on_page', label: 'On-Page SEO', icon: FileText },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'content', label: 'Content', icon: FileText },
];

export default function SEOTools() {
  const [targetUrl, setTargetUrl] = useState('https://syberjet.com');
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: seoChecks = [], isLoading: loadingChecks } = useQuery({
    queryKey: ['seo-checks'],
    queryFn: () => base44.entities.SEOCheck.list('-created_date', 500),
  });

  const runSEOAuditMutation = useMutation({
    mutationFn: async (url) => {
      // Find or create website
      let website = websites.find((w) => w.url?.includes(new URL(url).hostname));
      if (!website) {
        website = await base44.entities.Website.create({
          name: new URL(url).hostname,
          url: url,
        });
      }

      // Clear old checks for this website
      const oldChecks = seoChecks.filter((c) => c.website_id === website.id);
      for (const check of oldChecks) {
        await base44.entities.SEOCheck.delete(check.id);
      }

      // Run comprehensive SEO analysis
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a comprehensive SEO audit for the website: ${url}
        
        Analyze the following aspects and provide detailed findings:
        
        1. TECHNICAL SEO (check_type: "technical"):
        - Robots.txt accessibility
        - XML sitemap presence
        - Canonical tags
        - Schema markup/structured data
        - URL structure
        - Crawlability issues
        
        2. ON-PAGE SEO (check_type: "on_page"):
        - Title tags (length, keywords)
        - Meta descriptions
        - Header hierarchy (H1, H2, H3)
        - Image alt tags
        - Internal linking
        - Keyword optimization
        
        3. PERFORMANCE (check_type: "performance"):
        - Page load speed estimate
        - Core Web Vitals expectations
        - Resource optimization
        - Caching potential
        
        4. MOBILE (check_type: "mobile"):
        - Mobile responsiveness
        - Touch targets
        - Viewport configuration
        
        5. SECURITY (check_type: "security"):
        - HTTPS implementation
        - Mixed content issues
        - Security headers
        
        6. CONTENT (check_type: "content"):
        - Content quality signals
        - Readability
        - Content freshness
        - Duplicate content risks
        
        IMPORTANT: For each check, use EXACTLY these check_type values: "technical", "on_page", "performance", "mobile", "security", or "content".
        For status, use EXACTLY: "pass", "warning", or "fail".
        For priority, use EXACTLY: "critical", "high", "medium", or "low".`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number' },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  check_type: {
                    type: 'string',
                    enum: ['technical', 'on_page', 'performance', 'mobile', 'security', 'content'],
                  },
                  check_name: { type: 'string' },
                  status: { type: 'string', enum: ['pass', 'warning', 'fail'] },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  details: { type: 'string' },
                  recommendation: { type: 'string' },
                },
              },
            },
          },
        },
      });

      // Normalize and save checks
      const validTypes = ['technical', 'on_page', 'performance', 'mobile', 'security', 'content'];
      const validStatuses = ['pass', 'warning', 'fail'];

      for (const check of analysis.checks || []) {
        // Normalize check_type
        let checkType = (check.check_type || '').toLowerCase().replace(/[\s-]/g, '_');
        if (checkType.includes('technical')) {
          checkType = 'technical';
        } else if (checkType.includes('on') && checkType.includes('page')) {
          checkType = 'on_page';
        } else if (checkType.includes('performance') || checkType.includes('speed')) {
          checkType = 'performance';
        } else if (checkType.includes('mobile')) {
          checkType = 'mobile';
        } else if (checkType.includes('security') || checkType.includes('https')) {
          checkType = 'security';
        } else if (checkType.includes('content')) {
          checkType = 'content';
        } else if (!validTypes.includes(checkType)) {
          checkType = 'technical';
        }

        // Normalize status
        let status = (check.status || '').toLowerCase();
        if (status.includes('pass') || status.includes('good') || status.includes('ok')) {
          status = 'pass';
        } else if (status.includes('warn')) {
          status = 'warning';
        } else if (status.includes('fail') || status.includes('error') || status.includes('bad')) {
          status = 'fail';
        } else if (!validStatuses.includes(status)) {
          status = 'warning';
        }

        await base44.entities.SEOCheck.create({
          website_id: website.id,
          url_checked: url,
          check_type: checkType,
          check_name: check.check_name,
          status: status,
          priority: check.priority || 'medium',
          details: check.details,
          recommendation: check.recommendation,
        });
      }

      // Update website score
      await base44.entities.Website.update(website.id, {
        seo_score: analysis.overall_score || 0,
        last_audit_date: new Date().toISOString(),
      });

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-checks'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
  });

  const currentWebsite = websites.find((w) =>
    targetUrl.includes(w.url?.replace(/https?:\/\//, '').split('/')[0])
  );
  const websiteChecks = seoChecks.filter((c) => c.website_id === currentWebsite?.id);

  const filteredChecks =
    activeCategory === 'all'
      ? websiteChecks
      : websiteChecks.filter((c) => c.check_type === activeCategory);

  const passCount = websiteChecks.filter((c) => c.status === 'pass').length;
  const warningCount = websiteChecks.filter((c) => c.status === 'warning').length;
  const failCount = websiteChecks.filter((c) => c.status === 'fail').length;
  const totalChecks = websiteChecks.length;

  const scoreByCategory = CHECK_CATEGORIES.map((cat) => {
    const catChecks = websiteChecks.filter((c) => c.check_type === cat.id);
    const passed = catChecks.filter((c) => c.status === 'pass').length;
    return {
      ...cat,
      score: catChecks.length > 0 ? Math.round((passed / catChecks.length) * 100) : 0,
      total: catChecks.length,
    };
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (keywordData) => {
      const website = websites[0];
      if (!website) {
        return;
      }

      await base44.entities.Keyword.create({
        keyword: keywordData.keyword,
        website_id: website.id,
        search_volume: keywordData.search_volume || 0,
        difficulty: keywordData.difficulty || 0,
        cpc: keywordData.cpc || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Tools</h1>
        <p className="text-gray-500 mt-1">Keyword research, on-page analysis, and site audits</p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit" className="gap-2">
            <Globe className="w-4 h-4" />
            Site Audit
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-2">
            <Target className="w-4 h-4" />
            Keyword Research
          </TabsTrigger>
          <TabsTrigger value="onpage" className="gap-2">
            <FileText className="w-4 h-4" />
            On-Page Analysis
          </TabsTrigger>
          <TabsTrigger value="serpgap" className="gap-2">
            <Target className="w-4 h-4" />
            SERP Gap
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Exploding Topics
          </TabsTrigger>
        </TabsList>

        {/* Site Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          {/* URL Input */}
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label className="mb-2 block">Website URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://syberjet.com"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => runSEOAuditMutation.mutate(targetUrl)}
                      disabled={runSEOAuditMutation.isPending || !targetUrl}
                      className="gap-2 bg-violet-600 hover:bg-violet-700"
                    >
                      {runSEOAuditMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Run Full Audit
                    </Button>
                  </div>
                </div>
              </div>

              {runSEOAuditMutation.isPending && (
                <div className="mt-4 p-4 bg-violet-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                    <div>
                      <p className="font-medium text-violet-900">
                        Running comprehensive SEO audit...
                      </p>
                      <p className="text-sm text-violet-600">
                        Analyzing technical SEO, content, performance, and more
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Overview */}
          {totalChecks > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-violet-600">
                      {(() => {
                        const score = currentWebsite?.seo_score || 0;
                        // If score is between 0-1, convert to 0-100
                        if (score > 0 && score <= 1) {
                          return Math.round(score * 100);
                        }
                        // If score is already 0-100, use as is
                        return Math.round(score);
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Overall Score</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-emerald-50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600">{passCount}</p>
                  <p className="text-sm text-gray-500">Passed</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-amber-50">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
                  <p className="text-sm text-gray-500">Warnings</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-red-50">
                <CardContent className="p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{failCount}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Scores */}
          {totalChecks > 0 && (
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {scoreByCategory.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id === activeCategory ? 'all' : cat.id)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        activeCategory === cat.id
                          ? 'bg-violet-100 ring-2 ring-violet-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <cat.icon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          activeCategory === cat.id ? 'text-violet-600' : 'text-gray-400'
                        }`}
                      />
                      <p className="text-2xl font-bold text-gray-900">{cat.score}%</p>
                      <p className="text-xs text-gray-500">{cat.label}</p>
                      <p className="text-xs text-gray-400">{cat.total} checks</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {loadingChecks ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : filteredChecks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {activeCategory === 'all'
                    ? 'All Checks'
                    : CHECK_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  <span className="text-gray-400 font-normal ml-2">({filteredChecks.length})</span>
                </h3>
                {activeCategory !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveCategory('all')}>
                    Show All
                  </Button>
                )}
              </div>
              {filteredChecks.map((check) => (
                <SEOCheckCard
                  key={check.id}
                  check={check}
                  onClick={() => setSelectedCheck(check)}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-16 text-center">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SEO checks yet</h3>
                <p className="text-gray-500 mb-4">
                  Enter a URL above and run a full audit to see results
                </p>
              </CardContent>
            </Card>
          )}

          {/* Check Detail Modal */}
          <Dialog open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedCheck?.status === 'pass' && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {selectedCheck?.status === 'warning' && (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  {selectedCheck?.status === 'fail' && <XCircle className="w-5 h-5 text-red-500" />}
                  {selectedCheck?.check_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className="bg-gray-100 text-gray-700">
                    {selectedCheck?.check_type?.replace('_', ' ')}
                  </Badge>
                  {selectedCheck?.priority && (
                    <Badge
                      className={`${
                        selectedCheck.priority === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : selectedCheck.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : selectedCheck.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {selectedCheck.priority} priority
                    </Badge>
                  )}
                </div>

                {selectedCheck?.details && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Details</h4>
                    <p className="text-sm text-gray-600">{selectedCheck.details}</p>
                  </div>
                )}

                {selectedCheck?.recommendation && (
                  <div className="p-4 bg-violet-50 rounded-lg">
                    <h4 className="font-medium text-violet-900 mb-1">Recommendation</h4>
                    <p className="text-sm text-violet-700">{selectedCheck.recommendation}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Keyword Research Tab */}
        <TabsContent value="keywords">
          <KeywordResearchCard onAddKeyword={(kw) => addKeywordMutation.mutate(kw)} />
        </TabsContent>

        {/* On-Page Analysis Tab */}
        <TabsContent value="onpage">
          <OnPageSEOAnalyzer />
        </TabsContent>

        {/* SERP Gap Analyzer Tab */}
        <TabsContent value="serpgap">
          <SERPGapAnalyzer onAddKeyword={(kw) => addKeywordMutation.mutate(kw)} />
        </TabsContent>

        {/* Exploding Topics Tab */}
        <TabsContent value="trends">
          <ExplodingTopicsCard onAddKeyword={(kw) => addKeywordMutation.mutate(kw)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
