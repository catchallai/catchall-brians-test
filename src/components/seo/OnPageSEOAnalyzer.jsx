import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Link2,
  Type,
  Hash,
  Image,
  Lightbulb,
  Target,
  BarChart2,
} from 'lucide-react';

const statusConfig = {
  good: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

export default function OnPageSEOAnalyzer() {
  const [pageUrl, setPageUrl] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeOnPageSEO = async () => {
    if (!pageUrl.trim()) {
      return;
    }

    setIsAnalyzing(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Perform a comprehensive on-page SEO analysis for: ${pageUrl}
      ${targetKeyword ? `Target keyword: "${targetKeyword}"` : ''}
      
      Analyze the following aspects in detail:
      
      1. TITLE TAG ANALYSIS:
         - Current title (extract from page)
         - Length (characters)
         - Keyword presence and position
         - Power words usage
         - Recommendations for improvement
      
      2. META DESCRIPTION:
         - Current meta description
         - Length (characters)
         - Keyword presence
         - Call-to-action presence
         - Recommendations
      
      3. HEADING STRUCTURE:
         - H1 tag content and count
         - H2, H3 hierarchy
         - Keyword usage in headings
         - Issues found
      
      4. KEYWORD DENSITY & PLACEMENT:
         - Overall keyword density percentage
         - Keyword placement (first 100 words, headings, etc.)
         - LSI keywords found
         - Over-optimization warnings
      
      5. CONTENT QUALITY:
         - Word count
         - Readability score (Flesch-Kincaid)
         - Content uniqueness indicators
         - Content depth assessment
      
      6. INTERNAL LINKING:
         - Number of internal links
         - Anchor text variety
         - Link placement quality
         - Orphan page risk
         - Recommendations
      
      7. IMAGE OPTIMIZATION:
         - Images found count
         - Images with alt tags
         - Images missing alt tags
         - File name optimization
      
      8. URL STRUCTURE:
         - URL length
         - Keyword in URL
         - URL readability
         - Issues
      
      Provide an overall on-page SEO score (0-100) and prioritized recommendations.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          title_tag: {
            type: 'object',
            properties: {
              current: { type: 'string' },
              length: { type: 'number' },
              has_keyword: { type: 'boolean' },
              status: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
          meta_description: {
            type: 'object',
            properties: {
              current: { type: 'string' },
              length: { type: 'number' },
              has_keyword: { type: 'boolean' },
              has_cta: { type: 'boolean' },
              status: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
          headings: {
            type: 'object',
            properties: {
              h1_content: { type: 'string' },
              h1_count: { type: 'number' },
              h2_count: { type: 'number' },
              h3_count: { type: 'number' },
              keyword_in_h1: { type: 'boolean' },
              status: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } },
            },
          },
          keyword_analysis: {
            type: 'object',
            properties: {
              density: { type: 'number' },
              in_first_100_words: { type: 'boolean' },
              in_headings: { type: 'boolean' },
              lsi_keywords: { type: 'array', items: { type: 'string' } },
              status: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
          content: {
            type: 'object',
            properties: {
              word_count: { type: 'number' },
              readability_score: { type: 'number' },
              reading_level: { type: 'string' },
              status: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
          internal_links: {
            type: 'object',
            properties: {
              count: { type: 'number' },
              unique_anchors: { type: 'number' },
              status: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
          },
          images: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              with_alt: { type: 'number' },
              missing_alt: { type: 'number' },
              status: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
          url_structure: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              has_keyword: { type: 'boolean' },
              is_readable: { type: 'boolean' },
              status: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
          priority_recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                priority: { type: 'string' },
                area: { type: 'string' },
                action: { type: 'string' },
                impact: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const getStatusConfig = (status) => statusConfig[status] || statusConfig.warning;

  const renderStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-500" />
          On-Page SEO Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              placeholder="Enter page URL to analyze..."
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              placeholder="Target keyword (optional)"
              className="flex-1"
            />
            <Button
              onClick={analyzeOnPageSEO}
              disabled={isAnalyzing || !pageUrl.trim()}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Analyze
            </Button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Analyzing on-page SEO...</p>
                <p className="text-sm text-violet-600">
                  Checking title, meta, content, links, and more
                </p>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl text-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-violet-600">{analysis.overall_score}</span>
              </div>
              <p className="text-gray-600">On-Page SEO Score</p>
              <Progress value={analysis.overall_score} className="h-2 mt-3 max-w-xs mx-auto" />
            </div>

            {/* Analysis Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="links">Links & Images</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Title Tag */}
                {analysis.title_tag && (
                  <div
                    className={`p-4 rounded-lg ${getStatusConfig(analysis.title_tag.status).bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Title Tag</h4>
                      </div>
                      {renderStatusBadge(analysis.title_tag.status)}
                    </div>
                    <p className="text-sm text-gray-700 mt-2 font-medium">
                      "{analysis.title_tag.current}"
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{analysis.title_tag.length} characters</span>
                      <span>
                        {analysis.title_tag.has_keyword ? '✓ Keyword found' : '✗ Keyword missing'}
                      </span>
                    </div>
                    {analysis.title_tag.recommendation && (
                      <p className="text-sm text-gray-600 mt-2 p-2 bg-white/50 rounded">
                        💡 {analysis.title_tag.recommendation}
                      </p>
                    )}
                  </div>
                )}

                {/* Meta Description */}
                {analysis.meta_description && (
                  <div
                    className={`p-4 rounded-lg ${getStatusConfig(analysis.meta_description.status).bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Meta Description</h4>
                      </div>
                      {renderStatusBadge(analysis.meta_description.status)}
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      "{analysis.meta_description.current}"
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{analysis.meta_description.length} characters</span>
                      <span>
                        {analysis.meta_description.has_keyword ? '✓ Keyword' : '✗ Keyword'}
                      </span>
                      <span>{analysis.meta_description.has_cta ? '✓ CTA' : '✗ CTA'}</span>
                    </div>
                    {analysis.meta_description.recommendation && (
                      <p className="text-sm text-gray-600 mt-2 p-2 bg-white/50 rounded">
                        💡 {analysis.meta_description.recommendation}
                      </p>
                    )}
                  </div>
                )}

                {/* Headings */}
                {analysis.headings && (
                  <div className={`p-4 rounded-lg ${getStatusConfig(analysis.headings.status).bg}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Heading Structure</h4>
                      </div>
                      {renderStatusBadge(analysis.headings.status)}
                    </div>
                    <p className="text-sm text-gray-700 mt-2 font-medium">
                      H1: "{analysis.headings.h1_content}"
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>H1: {analysis.headings.h1_count}</span>
                      <span>H2: {analysis.headings.h2_count}</span>
                      <span>H3: {analysis.headings.h3_count}</span>
                    </div>
                    {analysis.headings.issues?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {analysis.headings.issues.map((issue, i) => (
                          <p key={i} className="text-sm text-red-600">
                            ⚠ {issue}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* URL Structure */}
                {analysis.url_structure && (
                  <div
                    className={`p-4 rounded-lg ${getStatusConfig(analysis.url_structure.status).bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">URL Structure</h4>
                      </div>
                      {renderStatusBadge(analysis.url_structure.status)}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{analysis.url_structure.length} characters</span>
                      <span>{analysis.url_structure.has_keyword ? '✓ Keyword' : '✗ Keyword'}</span>
                      <span>
                        {analysis.url_structure.is_readable ? '✓ Readable' : '✗ Not readable'}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                {/* Keyword Analysis */}
                {analysis.keyword_analysis && (
                  <div
                    className={`p-4 rounded-lg ${getStatusConfig(analysis.keyword_analysis.status).bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Keyword Density</h4>
                      </div>
                      {renderStatusBadge(analysis.keyword_analysis.status)}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(analysis.keyword_analysis.density * 20, 100)}
                          className="h-3 flex-1"
                        />
                        <span className="font-bold">
                          {analysis.keyword_analysis.density?.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Optimal range: 1-3%</p>
                    </div>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span
                        className={
                          analysis.keyword_analysis.in_first_100_words
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }
                      >
                        {analysis.keyword_analysis.in_first_100_words ? '✓' : '✗'} In first 100
                        words
                      </span>
                      <span
                        className={
                          analysis.keyword_analysis.in_headings
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }
                      >
                        {analysis.keyword_analysis.in_headings ? '✓' : '✗'} In headings
                      </span>
                    </div>
                    {analysis.keyword_analysis.lsi_keywords?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">LSI Keywords Found:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.keyword_analysis.lsi_keywords.map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Quality */}
                {analysis.content && (
                  <div className={`p-4 rounded-lg ${getStatusConfig(analysis.content.status).bg}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Content Quality</h4>
                      </div>
                      {renderStatusBadge(analysis.content.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Word Count</p>
                        <p className="text-xl font-bold">{analysis.content.word_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Readability</p>
                        <p className="text-xl font-bold">{analysis.content.readability_score}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reading Level</p>
                        <p className="text-sm font-medium">{analysis.content.reading_level}</p>
                      </div>
                    </div>
                    {analysis.content.recommendation && (
                      <p className="text-sm text-gray-600 mt-3 p-2 bg-white/50 rounded">
                        💡 {analysis.content.recommendation}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="links" className="space-y-4">
                {/* Internal Links */}
                {analysis.internal_links && (
                  <div
                    className={`p-4 rounded-lg ${getStatusConfig(analysis.internal_links.status).bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Internal Links</h4>
                      </div>
                      {renderStatusBadge(analysis.internal_links.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Total Links</p>
                        <p className="text-xl font-bold">{analysis.internal_links.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unique Anchors</p>
                        <p className="text-xl font-bold">
                          {analysis.internal_links.unique_anchors}
                        </p>
                      </div>
                    </div>
                    {analysis.internal_links.recommendations?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {analysis.internal_links.recommendations.map((rec, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            💡 {rec}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Images */}
                {analysis.images && (
                  <div className={`p-4 rounded-lg ${getStatusConfig(analysis.images.status).bg}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Image Optimization</h4>
                      </div>
                      {renderStatusBadge(analysis.images.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Total Images</p>
                        <p className="text-xl font-bold">{analysis.images.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">With Alt Tags</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {analysis.images.with_alt}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Missing Alt</p>
                        <p className="text-xl font-bold text-red-600">
                          {analysis.images.missing_alt}
                        </p>
                      </div>
                    </div>
                    {analysis.images.recommendation && (
                      <p className="text-sm text-gray-600 mt-3 p-2 bg-white/50 rounded">
                        💡 {analysis.images.recommendation}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Priority Recommendations
                </h4>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {analysis.priority_recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg ${
                          rec.priority === 'high'
                            ? 'bg-red-50 border-l-4 border-red-500'
                            : rec.priority === 'medium'
                              ? 'bg-amber-50 border-l-4 border-amber-500'
                              : 'bg-blue-50 border-l-4 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            className={
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : rec.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                            }
                          >
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.area}</Badge>
                        </div>
                        <p className="font-medium text-gray-900">{rec.action}</p>
                        <p className="text-sm text-gray-500 mt-1">Impact: {rec.impact}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
