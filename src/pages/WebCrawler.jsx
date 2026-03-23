import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Globe,
  Loader2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const contentTypes = {
  article: { label: 'Article', color: 'bg-blue-100 text-blue-700' },
  blog: { label: 'Blog', color: 'bg-purple-100 text-purple-700' },
  news: { label: 'News', color: 'bg-red-100 text-red-700' },
  forum: { label: 'Forum', color: 'bg-amber-100 text-amber-700' },
  social: { label: 'Social', color: 'bg-pink-100 text-pink-700' },
  website: { label: 'Website', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

export default function WebCrawler() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [crawling, setCrawling] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const queryClient = useQueryClient();

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['crawl-keywords'],
    queryFn: () => base44.entities.CrawlKeyword.list('-created_date', 100),
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['crawl-results'],
    queryFn: () => base44.entities.WebCrawlResult.list('-created_date', 500),
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data) => base44.entities.CrawlKeyword.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawl-keywords'] });
      setNewKeyword('');
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: (id) => base44.entities.CrawlKeyword.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crawl-keywords'] }),
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WebCrawlResult.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crawl-results'] }),
  });

  const crawlWeb = async () => {
    if (keywords.length === 0) {
      return;
    }

    setCrawling(true);

    for (const keyword of keywords.filter((k) => k.is_active)) {
      const searchResults = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the entire web for "${keyword.keyword}". Find recent and relevant web pages, articles, blog posts, news, forum discussions, and any other content mentioning this keyword.
        
        Return diverse results from different sources across the web. Include:
        - News articles
        - Blog posts
        - Forum discussions
        - Company websites
        - Social media posts
        - Any other relevant content
        
        For each result provide:
        - Page title
        - URL
        - Brief snippet/excerpt showing the keyword in context
        - Source domain
        - Content type (article, blog, news, forum, social, website, other)
        - Approximate date if available`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' },
                  snippet: { type: 'string' },
                  source_domain: { type: 'string' },
                  content_type: { type: 'string' },
                  publish_date: { type: 'string' },
                },
              },
            },
          },
        },
      });

      let newCount = 0;
      if (searchResults.results?.length > 0) {
        for (const result of searchResults.results) {
          const exists = results.some((r) => r.url === result.url);

          if (!exists && result.title && result.url) {
            await base44.entities.WebCrawlResult.create({
              keyword_id: keyword.id,
              title: result.title,
              url: result.url,
              snippet: result.snippet,
              source_domain: result.source_domain || new URL(result.url).hostname,
              content_type: [
                'article',
                'blog',
                'news',
                'forum',
                'social',
                'website',
                'other',
              ].includes(result.content_type)
                ? result.content_type
                : 'website',
              publish_date: result.publish_date,
            });
            newCount++;
          }
        }
      }

      await base44.entities.CrawlKeyword.update(keyword.id, {
        last_crawled: new Date().toISOString(),
        results_count: (keyword.results_count || 0) + newCount,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['crawl-results'] });
    queryClient.invalidateQueries({ queryKey: ['crawl-keywords'] });
    setCrawling(false);
  };

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.snippet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.source_domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKeyword = filterKeyword === 'all' || r.keyword_id === filterKeyword;
    const matchesType = filterType === 'all' || r.content_type === filterType;
    return matchesSearch && matchesKeyword && matchesType;
  });

  const getKeywordName = (id) => keywords.find((k) => k.id === id)?.keyword || '';

  const isLoading = loadingKeywords || loadingResults;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Web Crawler</h1>
          <p className="text-gray-500 mt-1">Search the entire web for your keywords</p>
        </div>
        <Button
          onClick={crawlWeb}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
          disabled={crawling || keywords.length === 0}
        >
          {crawling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {crawling ? 'Crawling...' : 'Crawl Web'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
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
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-sm text-gray-500">Results Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{results.filter((r) => r.is_saved).length}</p>
                <p className="text-sm text-gray-500">Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(results.map((r) => r.source_domain)).size}
                </p>
                <p className="text-sm text-gray-500">Unique Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="results" className="space-y-6">
        <TabsList>
          <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          <TabsTrigger value="keywords">Keywords ({keywords.length})</TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(contentTypes).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredResults.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">
                  {keywords.length === 0
                    ? 'Add keywords to search for first.'
                    : "Click 'Crawl Web' to search the internet for your keywords."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result) => {
                const typeConfig = contentTypes[result.content_type] || contentTypes.other;
                return (
                  <Card
                    key={result.id}
                    className="border-0 shadow-sm hover:shadow-md transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={`text-xs ${typeConfig.color}`}>
                              {typeConfig.label}
                            </Badge>
                            <span className="text-xs text-gray-400">{result.source_domain}</span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-violet-50 text-violet-700"
                            >
                              {getKeywordName(result.keyword_id)}
                            </Badge>
                          </div>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                          </a>
                          {result.snippet && (
                            <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a href={result.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateResultMutation.mutate({
                                id: result.id,
                                data: { is_saved: !result.is_saved },
                              })
                            }
                          >
                            {result.is_saved ? (
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

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a keyword to search for..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newKeyword.trim()) {
                  createKeywordMutation.mutate({ keyword: newKeyword.trim() });
                }
              }}
              className="max-w-md"
            />
            <Button
              onClick={() => createKeywordMutation.mutate({ keyword: newKeyword.trim() })}
              disabled={!newKeyword.trim() || createKeywordMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {keywords.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No keywords added</h3>
                <p className="text-gray-500">Add keywords to crawl the web for.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keywords.map((keyword) => (
                <Card key={keyword.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{keyword.keyword}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{keyword.results_count || 0} results</span>
                          {keyword.last_crawled && (
                            <span>
                              Crawled{' '}
                              {formatDistanceToNow(new Date(keyword.last_crawled), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteKeywordMutation.mutate(keyword.id)}
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
      </Tabs>
    </div>
  );
}
