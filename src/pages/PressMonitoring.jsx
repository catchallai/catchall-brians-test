import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Newspaper,
  Loader2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Trash2,
  X,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { format } from 'date-fns';

const publicationTypes = [
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'blog', label: 'Blog' },
  { value: 'news_site', label: 'News Site' },
  { value: 'trade_publication', label: 'Trade Publication' },
];

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  neutral: { icon: Minus, color: 'text-gray-600 bg-gray-50' },
  negative: { icon: TrendingDown, color: 'text-red-600 bg-red-50' },
};

export default function PressMonitoring() {
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterKeyword, setFilterKeyword] = useState('all');
  const [scanning, setScanning] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'newspaper', website_url: '' });
  const [newKeyword, setNewKeyword] = useState('');
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading: loadingSources } = useQuery({
    queryKey: ['press-sources'],
    queryFn: () => base44.entities.PressSource.list('-created_date', 100),
  });

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['press-keywords'],
    queryFn: () => base44.entities.PressKeyword.list('-created_date', 100),
  });

  const { data: mentions = [], isLoading: loadingMentions } = useQuery({
    queryKey: ['press-mentions'],
    queryFn: () => base44.entities.PressMention.list('-publish_date', 500),
  });

  const createSourceMutation = useMutation({
    mutationFn: (data) => base44.entities.PressSource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-sources'] });
      setShowSourceModal(false);
      setNewSource({ name: '', type: 'newspaper', website_url: '' });
    },
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data) => base44.entities.PressKeyword.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-keywords'] });
      setShowKeywordModal(false);
      setNewKeyword('');
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (id) => base44.entities.PressSource.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['press-sources'] }),
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: (id) => base44.entities.PressKeyword.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['press-keywords'] }),
  });

  const updateMentionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PressMention.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['press-mentions'] }),
  });

  const scanForMentions = async () => {
    if (sources.length === 0 || keywords.length === 0) {
      return;
    }

    setScanning(true);

    for (const source of sources.filter((s) => s.is_active)) {
      for (const keyword of keywords.filter((k) => k.is_active)) {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Search for recent news articles from ${source.name} (${source.website_url || 'major publication'}) that mention "${keyword.keyword}".
          
          Find real, recent articles (from the past month if possible) that discuss or mention this topic.
          
          For each article found, provide:
          - Article title
          - Brief excerpt/summary (2-3 sentences)
          - Author name if available
          - Approximate publish date
          - Sentiment (positive, neutral, or negative toward the subject)
          - Relevance score (0-100)
          
          Only include articles that genuinely exist and are relevant.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    excerpt: { type: 'string' },
                    article_url: { type: 'string' },
                    author: { type: 'string' },
                    publish_date: { type: 'string' },
                    sentiment: { type: 'string' },
                    relevance_score: { type: 'number' },
                  },
                },
              },
            },
          },
        });

        if (analysis.articles?.length > 0) {
          for (const article of analysis.articles) {
            // Check if article already exists
            const exists = mentions.some(
              (m) =>
                m.title?.toLowerCase() === article.title?.toLowerCase() ||
                m.article_url === article.article_url
            );

            if (!exists && article.title) {
              await base44.entities.PressMention.create({
                source_id: source.id,
                keyword_id: keyword.id,
                title: article.title,
                excerpt: article.excerpt,
                article_url: article.article_url,
                author: article.author,
                publish_date: article.publish_date,
                sentiment: ['positive', 'neutral', 'negative'].includes(article.sentiment)
                  ? article.sentiment
                  : 'neutral',
                relevance_score: article.relevance_score || 50,
              });
            }
          }
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['press-mentions'] });
    setScanning(false);
  };

  const filteredMentions = mentions.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === 'all' || m.source_id === filterSource;
    const matchesKeyword = filterKeyword === 'all' || m.keyword_id === filterKeyword;
    return matchesSearch && matchesSource && matchesKeyword;
  });

  const getSourceName = (id) => sources.find((s) => s.id === id)?.name || 'Unknown';
  const getKeywordName = (id) => keywords.find((k) => k.id === id)?.keyword || '';

  const isLoading = loadingSources || loadingKeywords || loadingMentions;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Press Monitoring</h1>
          <p className="text-gray-500 mt-1">
            Track mentions in newspapers, magazines, and publications
          </p>
        </div>
        <Button
          onClick={scanForMentions}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
          disabled={scanning || sources.length === 0 || keywords.length === 0}
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanning ? 'Scanning...' : 'Scan for Mentions'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sources.length}</p>
                <p className="text-sm text-gray-500">Publications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{keywords.length}</p>
                <p className="text-sm text-gray-500">Keywords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mentions.length}</p>
                <p className="text-sm text-gray-500">Mentions Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mentions.filter((m) => m.is_saved).length}</p>
                <p className="text-sm text-gray-500">Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mentions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="sources">Publications ({sources.length})</TabsTrigger>
          <TabsTrigger value="keywords">Keywords ({keywords.length})</TabsTrigger>
        </TabsList>

        {/* Mentions Tab */}
        <TabsContent value="mentions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Publications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Publications</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterKeyword} onValueChange={setFilterKeyword}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Keywords" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Keywords</SelectItem>
                {keywords.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.keyword}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mentions List */}
          {filteredMentions.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mentions found</h3>
                <p className="text-gray-500 mb-4">
                  {sources.length === 0
                    ? 'Add publications to track first.'
                    : keywords.length === 0
                      ? 'Add keywords to search for.'
                      : "Click 'Scan for Mentions' to search publications for your keywords."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMentions.map((mention) => {
                const sentiment = sentimentConfig[mention.sentiment] || sentimentConfig.neutral;
                const SentimentIcon = sentiment.icon;
                return (
                  <Card
                    key={mention.id}
                    className="border-0 shadow-sm hover:shadow-md transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getSourceName(mention.source_id)}
                            </Badge>
                            <Badge className={`text-xs ${sentiment.color}`}>
                              <SentimentIcon className="w-3 h-3 mr-1" />
                              {mention.sentiment}
                            </Badge>
                            {mention.relevance_score && (
                              <Badge variant="outline" className="text-xs">
                                {mention.relevance_score}% relevant
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{mention.title}</h3>
                          {mention.excerpt && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {mention.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {mention.author && <span>By {mention.author}</span>}
                            {mention.publish_date && (
                              <span>{format(new Date(mention.publish_date), 'MMM d, yyyy')}</span>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs bg-violet-50 text-violet-700"
                            >
                              {getKeywordName(mention.keyword_id)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {mention.article_url && (
                            <a href={mention.article_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Read
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateMentionMutation.mutate({
                                id: mention.id,
                                data: { is_saved: !mention.is_saved },
                              })
                            }
                          >
                            {mention.is_saved ? (
                              <BookmarkCheck className="w-4 h-4 text-violet-600" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowSourceModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Publication
            </Button>
          </div>

          {sources.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No publications added</h3>
                <p className="text-gray-500">
                  Add newspapers, magazines, or news sites to monitor.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <Card key={source.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{source.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          {source.type?.replace('_', ' ')}
                        </Badge>
                        {source.website_url && (
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                            {source.website_url}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteSourceMutation.mutate(source.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowKeywordModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Keyword
            </Button>
          </div>

          {keywords.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No keywords added</h3>
                <p className="text-gray-500">
                  Add keywords or phrases to search for in publications.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge
                  key={keyword.id}
                  className="text-sm py-2 px-3 bg-violet-100 text-violet-700 hover:bg-violet-200 gap-2"
                >
                  {keyword.keyword}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Source Modal */}
      <Dialog open={showSourceModal} onOpenChange={setShowSourceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Publication Name *</Label>
              <Input
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                placeholder="e.g., Wall Street Journal"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newSource.type}
                onValueChange={(v) => setNewSource({ ...newSource, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {publicationTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                value={newSource.website_url}
                onChange={(e) => setNewSource({ ...newSource, website_url: e.target.value })}
                placeholder="https://wsj.com"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSourceModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createSourceMutation.mutate(newSource)}
                disabled={!newSource.name || createSourceMutation.isPending}
              >
                {createSourceMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Publication
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Keyword Modal */}
      <Dialog open={showKeywordModal} onOpenChange={setShowKeywordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Keyword</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Keyword or Phrase *</Label>
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g., your company name, industry term"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowKeywordModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createKeywordMutation.mutate({ keyword: newKeyword })}
                disabled={!newKeyword || createKeywordMutation.isPending}
              >
                {createKeywordMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Keyword
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
