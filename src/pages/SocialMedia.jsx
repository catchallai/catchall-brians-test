import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Loader2, RefreshCw, TrendingUp, TrendingDown,
  MessageSquare, Heart, Share2, Users, BarChart3, Sparkles,
  ThumbsUp, ThumbsDown, Minus
} from "lucide-react";
import SocialAccountCard from '@/components/seo/SocialAccountCard';
import EmptyState from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', icon: '𝕏' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'youtube', label: 'YouTube', icon: '▶' },
];

const sentimentConfig = {
  positive: { icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  neutral: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100' },
  negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-100' },
};

export default function SocialMedia() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({ platform: 'twitter', account_name: '', account_url: '' });
  const queryClient = useQueryClient();

  const { data: socialAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => base44.entities.SocialAccount.list('-created_date', 50),
  });

  const { data: socialPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => base44.entities.SocialPost.list('-created_date', 500),
  });

  const createAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setShowAddModal(false);
      setNewAccount({ platform: 'twitter', account_name: '', account_url: '' });
    },
  });

  const analyzeAccountMutation = useMutation({
    mutationFn: async (account) => {
      // Use AI to analyze social media presence
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the social media presence for ${account.platform} account: @${account.account_name}
        ${account.account_url ? `Profile URL: ${account.account_url}` : ''}
        
        Please provide:
        1. Estimated follower count (realistic estimate based on typical accounts)
        2. Estimated engagement rate
        3. Analysis of 5 recent post types with:
           - Content summary
           - Estimated engagement (likes, comments, shares)
           - Sentiment (positive/neutral/negative)
           - Key topics/hashtags
        4. Overall recommendations for improving social presence
        5. Content performance insights`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_followers: { type: "number" },
            engagement_rate: { type: "number" },
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  content: { type: "string" },
                  likes: { type: "number" },
                  comments: { type: "number" },
                  shares: { type: "number" },
                  sentiment: { type: "string" },
                  topics: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            top_performing_content: { type: "string" },
            best_posting_times: { type: "string" }
          }
        }
      });

      // Update account with analysis
      await base44.entities.SocialAccount.update(account.id, {
        followers_count: analysis.estimated_followers || 0,
        engagement_rate: analysis.engagement_rate || 0,
        last_analyzed: new Date().toISOString()
      });

      // Clear old posts for this account
      const oldPosts = socialPosts.filter(p => p.social_account_id === account.id);
      for (const post of oldPosts) {
        await base44.entities.SocialPost.delete(post.id);
      }

      // Save analyzed posts
      for (const post of analysis.posts || []) {
        await base44.entities.SocialPost.create({
          social_account_id: account.id,
          platform: account.platform,
          content: post.content,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          sentiment: post.sentiment || 'neutral',
          topics: post.topics || [],
          post_date: new Date().toISOString()
        });
      }

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
  });

  const getAccountPosts = (accountId) => socialPosts.filter(p => p.social_account_id === accountId);

  const totalFollowers = socialAccounts.reduce((sum, a) => sum + (a.followers_count || 0), 0);
  const avgEngagement = socialAccounts.length > 0
    ? (socialAccounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / socialAccounts.length).toFixed(2)
    : 0;
  const totalPosts = socialPosts.length;

  const sentimentBreakdown = {
    positive: socialPosts.filter(p => p.sentiment === 'positive').length,
    neutral: socialPosts.filter(p => p.sentiment === 'neutral').length,
    negative: socialPosts.filter(p => p.sentiment === 'negative').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Analysis</h1>
          <p className="text-gray-500 mt-1">Monitor and analyze your social media presence</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(1)}K` : totalFollowers}
            </p>
            <p className="text-sm text-gray-500">Total Followers</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{avgEngagement}%</p>
            <p className="text-sm text-gray-500">Avg Engagement</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
            <p className="text-sm text-gray-500">Posts Analyzed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{socialAccounts.length}</p>
            <p className="text-sm text-gray-500">Accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Overview */}
      {totalPosts > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Content Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {Object.entries(sentimentBreakdown).map(([sentiment, count]) => {
                const config = sentimentConfig[sentiment];
                const percentage = totalPosts > 0 ? ((count / totalPosts) * 100).toFixed(0) : 0;
                return (
                  <div key={sentiment} className={`flex-1 p-4 rounded-xl ${config.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                      <span className="font-medium capitalize">{sentiment}</span>
                    </div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-gray-500">{percentage}% of posts</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts */}
      {loadingAccounts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : socialAccounts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No social accounts"
          description="Add your social media accounts to analyze your presence and content performance."
          actionLabel="Add Account"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialAccounts.map((account) => (
            <div key={account.id} className="relative">
              <SocialAccountCard
                account={account}
                postsCount={getAccountPosts(account.id).length}
                onClick={() => setSelectedAccount(account)}
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 gap-1"
                onClick={(e) => { e.stopPropagation(); analyzeAccountMutation.mutate(account); }}
                disabled={analyzeAccountMutation.isPending}
              >
                {analyzeAccountMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Analyze
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Social Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={newAccount.platform}
                onValueChange={(value) => setNewAccount({ ...newAccount, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="mr-2">{p.icon}</span> {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Username</Label>
              <Input
                value={newAccount.account_name}
                onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                placeholder="e.g., syberjet"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile URL (optional)</Label>
              <Input
                value={newAccount.account_url}
                onChange={(e) => setNewAccount({ ...newAccount, account_url: e.target.value })}
                placeholder="https://twitter.com/syberjet"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button 
                onClick={() => createAccountMutation.mutate(newAccount)}
                disabled={!newAccount.account_name || createAccountMutation.isPending}
              >
                {createAccountMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Detail Modal */}
      <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{PLATFORMS.find(p => p.id === selectedAccount?.platform)?.icon}</span>
              @{selectedAccount?.account_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Account Posts */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Analyzed Posts</h4>
              {getAccountPosts(selectedAccount?.id).length > 0 ? (
                <div className="space-y-3">
                  {getAccountPosts(selectedAccount?.id).map((post) => {
                    const sentiment = sentimentConfig[post.sentiment] || sentimentConfig.neutral;
                    return (
                      <Card key={post.id} className="p-4 border-0 shadow-sm">
                        <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" /> {post.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" /> {post.comments || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" /> {post.shares || 0}
                            </span>
                          </div>
                          <Badge className={`${sentiment.bg} ${sentiment.color} border-0`}>
                            {post.sentiment}
                          </Badge>
                        </div>
                        {post.topics?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {post.topics.map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                #{topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  No posts analyzed yet. Click "Analyze" to fetch content.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}