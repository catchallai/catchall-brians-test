import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Loader2, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown,
  Minus, BarChart3, Radio, Filter
} from "lucide-react";
import ListeningKeywordCard from '@/components/social/ListeningKeywordCard';
import ListeningMentionCard from '@/components/social/ListeningMentionCard';
import ListeningTrendsCard from '@/components/social/ListeningTrendsCard';
import AddListeningModal from '@/components/modals/AddListeningModal';
import EmptyState from '@/components/ui/EmptyState';

const platformLabels = {
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export default function SocialListening() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['social-listening'],
    queryFn: () => base44.entities.SocialListening.list('-created_date', 50),
  });

  const { data: mentions = [], isLoading: loadingMentions } = useQuery({
    queryKey: ['listening-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 500),
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialListening.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-listening'] });
      setShowAddModal(false);
    },
  });

  const toggleKeywordMutation = useMutation({
    mutationFn: (keyword) => base44.entities.SocialListening.update(keyword.id, { 
      is_active: !keyword.is_active 
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-listening'] }),
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id) => {
      // Delete associated mentions first
      const keywordMentions = mentions.filter(m => m.listening_id === id);
      for (const mention of keywordMentions) {
        await base44.entities.ListeningMention.delete(mention.id);
      }
      await base44.entities.SocialListening.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-listening'] });
      queryClient.invalidateQueries({ queryKey: ['listening-mentions'] });
    },
  });

  const scanKeywordMutation = useMutation({
    mutationFn: async (keyword) => {
      setScanningId(keyword.id);
      
      const platformsToScan = keyword.platforms?.join(', ') || 'Twitter, LinkedIn';
      const searchTerm = keyword.type === 'hashtag' ? `#${keyword.keyword}` : 
                         keyword.type === 'mention' ? `@${keyword.keyword}` : keyword.keyword;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the internet for recent social media posts and discussions about "${searchTerm}" on these platforms: ${platformsToScan}.

Find 10 recent posts/mentions and for each provide:
1. The platform (twitter, linkedin, facebook, instagram, or youtube)
2. The full post content/text
3. The author's username
4. Estimated author follower count
5. Engagement: likes, comments, shares (use realistic estimates)
6. Sentiment: positive, neutral, or negative
7. Influence score 0-100 based on reach and engagement

Also provide:
- Overall trending score 0-100 (how much buzz this topic is generating)
- Sentiment breakdown: count of positive, neutral, negative mentions`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            trending_score: { type: "number" },
            sentiment_breakdown: {
              type: "object",
              properties: {
                positive: { type: "number" },
                neutral: { type: "number" },
                negative: { type: "number" }
              }
            },
            mentions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  content: { type: "string" },
                  author: { type: "string" },
                  author_followers: { type: "number" },
                  likes: { type: "number" },
                  comments: { type: "number" },
                  shares: { type: "number" },
                  sentiment: { type: "string" },
                  influence_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Update keyword with new stats
      await base44.entities.SocialListening.update(keyword.id, {
        last_scanned: new Date().toISOString(),
        trending_score: analysis.trending_score || 0,
        sentiment_breakdown: analysis.sentiment_breakdown || { positive: 0, neutral: 0, negative: 0 },
        total_mentions: (keyword.total_mentions || 0) + (analysis.mentions?.length || 0),
      });

      // Save new mentions
      if (analysis.mentions?.length > 0) {
        for (const mention of analysis.mentions) {
          await base44.entities.ListeningMention.create({
            listening_id: keyword.id,
            platform: mention.platform || 'twitter',
            content: mention.content,
            author: mention.author,
            author_followers: mention.author_followers || 0,
            likes: mention.likes || 0,
            comments: mention.comments || 0,
            shares: mention.shares || 0,
            sentiment: mention.sentiment || 'neutral',
            influence_score: mention.influence_score || 0,
            post_date: new Date().toISOString(),
          });
        }
      }

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-listening'] });
      queryClient.invalidateQueries({ queryKey: ['listening-mentions'] });
      setScanningId(null);
    },
    onError: () => setScanningId(null),
  });

  // Filter mentions
  const filteredMentions = mentions.filter(m => {
    if (selectedKeyword && m.listening_id !== selectedKeyword.id) return false;
    if (platformFilter !== 'all' && m.platform !== platformFilter) return false;
    if (sentimentFilter !== 'all' && m.sentiment !== sentimentFilter) return false;
    return true;
  });

  // Stats
  const totalMentions = mentions.length;
  const activeTracks = keywords.filter(k => k.is_active).length;
  const avgTrendScore = keywords.length > 0 
    ? Math.round(keywords.reduce((sum, k) => sum + (k.trending_score || 0), 0) / keywords.length)
    : 0;
  const sentimentCounts = {
    positive: mentions.filter(m => m.sentiment === 'positive').length,
    neutral: mentions.filter(m => m.sentiment === 'neutral').length,
    negative: mentions.filter(m => m.sentiment === 'negative').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Listening</h1>
          <p className="text-gray-500 mt-1">Track keywords, hashtags, and mentions across social media</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Add Keyword
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Radio className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{activeTracks}</p>
            <p className="text-sm text-gray-500">Active Tracks</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalMentions}</p>
            <p className="text-sm text-gray-500">Mentions Found</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{avgTrendScore}</p>
            <p className="text-sm text-gray-500">Avg Trend Score</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center gap-2 mb-2">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
              <Minus className="w-5 h-5 text-gray-400" />
              <ThumbsDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm font-medium">
              <span className="text-emerald-600">{sentimentCounts.positive}</span>
              {' / '}
              <span className="text-gray-500">{sentimentCounts.neutral}</span>
              {' / '}
              <span className="text-red-600">{sentimentCounts.negative}</span>
            </p>
            <p className="text-sm text-gray-500">Sentiment</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords">Tracked Keywords</TabsTrigger>
          <TabsTrigger value="mentions">Mentions ({totalMentions})</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          {loadingKeywords ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : keywords.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No keywords tracked"
              description="Start tracking keywords, hashtags, or competitor mentions to monitor social conversations."
              actionLabel="Add Keyword"
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keywords.map((keyword) => (
                <ListeningKeywordCard
                  key={keyword.id}
                  keyword={keyword}
                  onClick={() => setSelectedKeyword(keyword)}
                  onToggle={(kw) => toggleKeywordMutation.mutate(kw)}
                  onScan={(kw) => scanKeywordMutation.mutate(kw)}
                  onDelete={(id) => deleteKeywordMutation.mutate(id)}
                  isScanning={scanningId === keyword.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Mentions Tab */}
        <TabsContent value="mentions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedKeyword?.id || 'all'} onValueChange={(v) => setSelectedKeyword(v === 'all' ? null : keywords.find(k => k.id === v))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Keywords" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Keywords</SelectItem>
                  {keywords.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.type === 'hashtag' ? '#' : k.type === 'mention' ? '@' : ''}{k.keyword}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {Object.entries(platformLabels).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
            {(selectedKeyword || platformFilter !== 'all' || sentimentFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => { setSelectedKeyword(null); setPlatformFilter('all'); setSentimentFilter('all'); }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {loadingMentions ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredMentions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No mentions found"
              description={keywords.length === 0 
                ? "Add keywords to start tracking social mentions."
                : "Scan your tracked keywords to find social media mentions."}
            />
          ) : (
            <div className="space-y-3">
              {filteredMentions.map((mention) => (
                <ListeningMentionCard key={mention.id} mention={mention} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListeningTrendsCard keywords={keywords} mentions={mentions} />
            
            {/* Sentiment Over Time (placeholder visualization) */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Platform Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mentions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(platformLabels).map(([platform, label]) => {
                      const count = mentions.filter(m => m.platform === platform).length;
                      const percentage = totalMentions > 0 ? (count / totalMentions) * 100 : 0;
                      return (
                        <div key={platform}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{label}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <AddListeningModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(data) => createKeywordMutation.mutate(data)}
        isLoading={createKeywordMutation.isPending}
      />
    </div>
  );
}