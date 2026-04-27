import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { checkRateLimit } from '@/components/utils/validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lightbulb,
  FileText,
  Wand2,
  Sparkles,
  Target,
  Search,
  Filter,
  Zap,
  BookOpen,
  ArrowRight,
  Star,
  Loader2,
  Users,
  Share2,
  Shield,
  Download,
  History,
} from 'lucide-react';
import ContentIdeaCard from '@/components/content/ContentIdeaCard';
import ContentBriefModal from '@/components/content/ContentBriefModal';
import ArticleGeneratorModal from '@/components/content/ArticleGeneratorModal';
import BrandVoiceSettings from '@/components/content/BrandVoiceSettings';
import CRMContentGenerator from '@/components/content/CRMContentGenerator';
import ShareToSocialModal from '@/components/content/ShareToSocialModal';
import ContentVersionHistory from '@/components/content/ContentVersionHistory';
import ContentExporter from '@/components/content/ContentExporter';

export default function ContentStudio() {
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingArticle, setSharingArticle] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionArticleId, setVersionArticleId] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingArticle, setExportingArticle] = useState(null);
  const queryClient = useQueryClient();

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ['content-ideas'],
    queryFn: () => base44.entities.ContentIdea.list('-opportunity_score', 100),
  });

  const { data: briefs = [] } = useQuery({
    queryKey: ['content-briefs'],
    queryFn: () => base44.entities.ContentBrief.list('-created_date', 50),
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['generated-articles'],
    queryFn: () => base44.entities.GeneratedArticle.list('-created_date', 50),
  });

  const { data: brandVoices = [] } = useQuery({
    queryKey: ['brand-voices'],
    queryFn: () => base44.entities.BrandVoice.list('-created_date', 20),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  // CRM data for content generation
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 100),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      const rateCheck = checkRateLimit('generate-ideas', 5, 60000);
      if (!rateCheck.allowed) {
        throw new Error(`Rate limit exceeded. Please wait ${rateCheck.remainingTime} seconds.`);
      }

      setIsGeneratingIdeas(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 low-hanging fruit content ideas for SEO. These should be topics with:
- Low keyword difficulty (under 30)
- Decent search volume (500-5000/month)
- Clear search intent
- Opportunity to rank quickly

For each idea provide:
- title: Compelling article title
- description: Brief description of the content angle
- target_keyword: Primary keyword to target
- keyword_difficulty: Estimated difficulty 0-100
- search_volume: Estimated monthly searches
- opportunity_score: How good the opportunity is 0-100
- content_type: One of blog, guide, listicle, how-to, comparison, review`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  target_keyword: { type: 'string' },
                  keyword_difficulty: { type: 'number' },
                  search_volume: { type: 'number' },
                  opportunity_score: { type: 'number' },
                  content_type: { type: 'string' },
                },
              },
            },
          },
        },
      });

      for (const idea of result.ideas || []) {
        await base44.entities.ContentIdea.create(idea);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      setIsGeneratingIdeas(false);
      toast.success('Content ideas generated successfully');
    },
    onError: (error) => {
      setIsGeneratingIdeas(false);
      toast.error(error.message || 'Failed to generate ideas');
    },
  });

  const boostsUsed = articles.reduce((sum, a) => sum + (a.boosts_used || 0), 0);
  const boostsRemaining = 5 - boostsUsed;

  const filteredIdeas = ideas.filter(
    (i) => !searchQuery || i.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowHangingIdeas = ideas.filter((i) => (i.opportunity_score || 0) >= 70);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Content Studio
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            AI-powered content ideation and generation
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => generateIdeasMutation.mutate()}
            disabled={isGeneratingIdeas}
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            {isGeneratingIdeas ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Generate</span> Ideas
          </Button>
          <Button
            onClick={() => setShowArticleModal(true)}
            className="gap-2 bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-none"
            size="sm"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Generate</span> Article
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ideas.length}</p>
            <p className="text-sm text-gray-500">Content Ideas</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{lowHangingIdeas.length}</p>
            <p className="text-sm text-gray-500">Low-Hanging Fruit</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{briefs.length}</p>
            <p className="text-sm text-gray-500">Content Briefs</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{articles.length}</p>
            <p className="text-sm text-gray-500">Articles Generated</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{boostsRemaining}/5</p>
            <p className="text-sm text-gray-500">SEO Boosts Left</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ideas">
        <TabsList className="flex-wrap h-auto gap-1 p-1 w-full overflow-x-auto">
          <TabsTrigger value="ideas" className="text-xs sm:text-sm">
            Ideas
          </TabsTrigger>
          <TabsTrigger value="crm" className="gap-1 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="briefs" className="text-xs sm:text-sm">
            Briefs
          </TabsTrigger>
          <TabsTrigger value="articles" className="text-xs sm:text-sm">
            Articles
          </TabsTrigger>
          <TabsTrigger value="voice" className="text-xs sm:text-sm">
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {lowHangingIdeas.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-emerald-600" />
                  Low-Hanging Fruit Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowHangingIdeas.slice(0, 3).map((idea) => (
                    <ContentIdeaCard
                      key={idea.id}
                      idea={idea}
                      onCreateBrief={() => {
                        setSelectedIdea(idea);
                        setShowBriefModal(true);
                      }}
                      isHighlight
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => (
              <ContentIdeaCard
                key={idea.id}
                idea={idea}
                onCreateBrief={() => {
                  setSelectedIdea(idea);
                  setShowBriefModal(true);
                }}
              />
            ))}
          </div>

          {filteredIdeas.length === 0 && (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No Content Ideas Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Generate AI-powered content ideas to get started
                </p>
                <Button
                  onClick={() => generateIdeasMutation.mutate()}
                  disabled={isGeneratingIdeas}
                  className="gap-2"
                >
                  {isGeneratingIdeas ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate Ideas
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="crm" className="mt-4">
          <CRMContentGenerator contacts={contacts} companies={companies} deals={deals} />
        </TabsContent>

        <TabsContent value="briefs" className="mt-4">
          <div className="space-y-3">
            {briefs.length === 0 ? (
              <Card className="glass-card rounded-2xl">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Content Briefs
                  </h3>
                  <p className="text-gray-500">
                    Create briefs from content ideas to guide your writing
                  </p>
                </CardContent>
              </Card>
            ) : (
              briefs.map((brief) => (
                <Card key={brief.id} className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{brief.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>Target: {brief.target_keyword}</span>
                          <span>•</span>
                          <span>{brief.word_count_target} words</span>
                          <Badge variant="outline">{brief.status}</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        Generate Article <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="articles" className="mt-4">
          <div className="space-y-3">
            {articles.length === 0 ? (
              <Card className="glass-card rounded-2xl">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Articles Generated
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Generate unlimited SEO-optimized articles with AI
                  </p>
                  <Button onClick={() => setShowArticleModal(true)} className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Generate Article
                  </Button>
                </CardContent>
              </Card>
            ) : (
              articles.map((article) => (
                <Card key={article.id} className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-gray-500">SEO Score:</span>
                            <Progress value={article.seo_score || 0} className="w-20 h-2" />
                            <span className="font-medium">{article.seo_score || 0}%</span>
                          </div>
                          <span className="text-sm text-gray-500">{article.word_count} words</span>
                          <Badge variant="outline">{article.status}</Badge>
                          {article.plagiarism_score && (
                            <Badge
                              className={
                                article.plagiarism_score >= 90
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {article.plagiarism_score}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setVersionArticleId(article.id);
                            setShowVersionHistory(true);
                          }}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setExportingArticle(article);
                            setShowExportModal(true);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setSharingArticle(article);
                            setShowShareModal(true);
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {boostsRemaining > 0 && (
                          <Button size="sm" className="gap-1 bg-orange-500 hover:bg-orange-600">
                            <Zap className="w-4 h-4" />
                            Boost
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-4">
          <BrandVoiceSettings brandVoices={brandVoices} websites={websites} />
        </TabsContent>
      </Tabs>

      <ContentBriefModal
        open={showBriefModal}
        onClose={() => {
          setShowBriefModal(false);
          setSelectedIdea(null);
        }}
        idea={selectedIdea}
      />

      <ArticleGeneratorModal
        open={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        briefs={briefs}
        brandVoices={brandVoices}
      />

      <ShareToSocialModal
        open={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSharingArticle(null);
        }}
        article={sharingArticle}
      />

      <ContentVersionHistory
        articleId={versionArticleId}
        open={showVersionHistory}
        onClose={() => {
          setShowVersionHistory(false);
          setVersionArticleId(null);
        }}
        onRestore={(_version) => {
          toast.success('Version restored - feature coming soon');
          setShowVersionHistory(false);
        }}
      />

      <ContentExporter
        article={exportingArticle}
        open={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setExportingArticle(null);
        }}
      />
    </div>
  );
}
