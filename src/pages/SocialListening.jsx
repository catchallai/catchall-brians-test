import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Loader2,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  Radio,
  Filter,
  Bell,
  Globe,
  Sparkles,
  MessagesSquare,
  Brain,
} from 'lucide-react';
import ListeningKeywordCard from '@/components/social/ListeningKeywordCard';
import ListeningMentionCard from '@/components/social/ListeningMentionCard';
import ListeningTrendsCard from '@/components/social/ListeningTrendsCard';
import AlertsPanel from '@/components/social/AlertsPanel';
import InfluencersPanel from '@/components/social/InfluencersPanel';
import SentimentTrendsChart from '@/components/social/SentimentTrendsChart';
import GeographicInsights from '@/components/social/GeographicInsights';
import ResponseSuggestionCard from '@/components/social/ResponseSuggestionCard';
import AddListeningModal from '@/components/modals/AddListeningModal';
import ForumMentionCard from '@/components/social/ForumMentionCard';
import EmptyState from '@/components/ui/EmptyState';
import AlertSettingsModal from '@/components/social/AlertSettingsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const platformLabels = {
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export default function SocialListening() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [scanningId, setScanningId] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [selectedMention, setSelectedMention] = useState(null);
  const [generatingResponseFor, setGeneratingResponseFor] = useState(null);
  const [deepScanningId, setDeepScanningId] = useState(null);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertSettingsKeyword, setAlertSettingsKeyword] = useState(null);
  const queryClient = useQueryClient();

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['social-listening'],
    queryFn: () => base44.entities.SocialListening.list('-created_date', 50),
  });

  const { data: mentions = [], isLoading: loadingMentions } = useQuery({
    queryKey: ['listening-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 500),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['listening-alerts'],
    queryFn: () => base44.entities.ListeningAlert.list('-created_date', 100),
  });

  const { data: forumMentions = [] } = useQuery({
    queryKey: ['forum-mentions'],
    queryFn: () => base44.entities.ForumMention.list('-post_date', 500),
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data) => {
      if (data.id) {
        const { id, ...updateData } = data;
        return base44.entities.SocialListening.update(id, updateData);
      }
      return base44.entities.SocialListening.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-listening'] });
      setShowAddModal(false);
      setEditingKeyword(null);
    },
  });

  const toggleKeywordMutation = useMutation({
    mutationFn: (keyword) =>
      base44.entities.SocialListening.update(keyword.id, {
        is_active: !keyword.is_active,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-listening'] }),
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id) => {
      const keywordMentions = mentions.filter((m) => m.listening_id === id);
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

  const markAlertReadMutation = useMutation({
    mutationFn: (id) => base44.entities.ListeningAlert.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listening-alerts'] }),
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.ListeningAlert.update(id, { is_dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listening-alerts'] }),
  });

  const updateMentionStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.ListeningMention.update(id, { response_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listening-mentions'] }),
  });

  const generateResponseMutation = useMutation({
    mutationFn: async (mention) => {
      setGeneratingResponseFor(mention.id);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, helpful response to this social media mention:

Platform: ${mention.platform}
Author: @${mention.author}
Sentiment: ${mention.sentiment}
Content: "${mention.content}"

Create a response that:
1. Is appropriate for ${mention.platform} (length, tone)
2. Addresses any concerns if sentiment is negative
3. Thanks or acknowledges if positive
4. Is professional but friendly
5. Does not use hashtags unless necessary`,
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string' },
          },
        },
      });

      await base44.entities.ListeningMention.update(mention.id, {
        suggested_response: result.response,
      });

      return result.response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listening-mentions'] });
      setGeneratingResponseFor(null);
    },
    onError: () => setGeneratingResponseFor(null),
  });

  const scanKeywordMutation = useMutation({
    mutationFn: async (keyword) => {
      setScanningId(keyword.id);

      const platformsToScan = keyword.platforms?.join(', ') || 'Twitter, LinkedIn';
      const searchTerm =
        keyword.type === 'hashtag'
          ? `#${keyword.keyword}`
          : keyword.type === 'mention'
            ? `@${keyword.keyword}`
            : keyword.keyword;

      const previousMentionCount = mentions.filter((m) => m.listening_id === keyword.id).length;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for social media posts about "${searchTerm}" on ${platformsToScan}.

Find 10 posts from 2022-2025. For each post provide:
- platform, content, author username, author_followers, likes, comments, shares, sentiment (positive/neutral/negative), influence_score (0-100), is_influencer, country, post_date, hashtags, topics

Also provide: trending_score (0-100), sentiment_breakdown counts, has_spike, negative_shift`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            trending_score: { type: 'number' },
            sentiment_breakdown: {
              type: 'object',
              properties: {
                positive: { type: 'number' },
                neutral: { type: 'number' },
                negative: { type: 'number' },
              },
            },
            has_spike: { type: 'boolean' },
            negative_shift: { type: 'boolean' },
            mentions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  content: { type: 'string' },
                  post_date: { type: 'string' },
                  author: { type: 'string' },
                  author_followers: { type: 'number' },
                  likes: { type: 'number' },
                  comments: { type: 'number' },
                  shares: { type: 'number' },
                  views: { type: 'number' },
                  sentiment: { type: 'string' },
                  influence_score: { type: 'number' },
                  is_influencer: { type: 'boolean' },
                  country: { type: 'string' },
                  hashtags: { type: 'array', items: { type: 'string' } },
                  topics: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      });

      // Update keyword with new stats
      await base44.entities.SocialListening.update(keyword.id, {
        last_scanned: new Date().toISOString(),
        trending_score: analysis.trending_score || 0,
        sentiment_breakdown: analysis.sentiment_breakdown || {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        total_mentions: (keyword.total_mentions || 0) + (analysis.mentions?.length || 0),
      });

      // Track alerts to avoid duplicates
      const alertsToCreate = [];
      const seenAlerts = new Set();

      // Save new mentions and detect per-mention alerts
      if (analysis.mentions?.length > 0) {
        for (const mention of analysis.mentions) {
          const savedMention = await base44.entities.ListeningMention.create({
            listening_id: keyword.id,
            platform: mention.platform || 'twitter',
            content: mention.content,
            post_url: mention.post_url || '',
            post_id: mention.post_id || '',
            post_type: mention.post_type || 'text',
            post_date: mention.post_date
              ? new Date(mention.post_date).toISOString()
              : new Date().toISOString(),
            author: mention.author,
            author_display_name: mention.author_display_name || '',
            author_followers: mention.author_followers || 0,
            author_verified: mention.author_verified || false,
            author_bio: mention.author_bio || '',
            likes: mention.likes || 0,
            comments: mention.comments || 0,
            shares: mention.shares || 0,
            views: mention.views || 0,
            saves: mention.saves || 0,
            engagement_rate: mention.engagement_rate || 0,
            sentiment: mention.sentiment || 'neutral',
            sentiment_score: mention.sentiment_score || 0,
            influence_score: mention.influence_score || 0,
            virality_score: mention.virality_score || 0,
            is_influencer: mention.is_influencer || false,
            is_reply: mention.is_reply || false,
            location: mention.location || '',
            country: mention.country || '',
            language: mention.language || 'en',
            hashtags: mention.hashtags || [],
            mentions: mention.mentions || [],
            topics: mention.topics || [],
            keywords: mention.keywords || [],
            brand_mentions: mention.brand_mentions || [],
            competitor_mentioned: mention.competitor_mentioned || false,
            business_impact: mention.business_impact || 'none',
            action_required: mention.action_required || false,
          });

          // Influencer Detection
          if (
            mention.is_influencer ||
            mention.author_followers > 10000 ||
            mention.influence_score >= 70
          ) {
            const alertKey = `influencer-${mention.author}`;
            if (!seenAlerts.has(alertKey)) {
              seenAlerts.add(alertKey);
              alertsToCreate.push({
                listening_id: keyword.id,
                type: 'influencer',
                severity:
                  mention.author_followers > 100000
                    ? 'critical'
                    : mention.influence_score >= 85
                      ? 'high'
                      : 'medium',
                title: `Influencer mention: @${mention.author}`,
                description: `${mention.author} (${(mention.author_followers || 0).toLocaleString()} followers) mentioned "${searchTerm}": "${mention.content?.slice(0, 100)}..."`,
                mention_id: savedMention.id,
              });
            }
          }

          // Viral Post Detection
          const totalEngagement =
            (mention.likes || 0) + (mention.comments || 0) + (mention.shares || 0);
          if (totalEngagement > 1000) {
            const alertKey = `viral-${mention.author}-${totalEngagement}`;
            if (!seenAlerts.has(alertKey)) {
              seenAlerts.add(alertKey);
              alertsToCreate.push({
                listening_id: keyword.id,
                type: 'viral',
                severity:
                  totalEngagement > 10000 ? 'critical' : totalEngagement > 5000 ? 'high' : 'medium',
                title: `Potentially viral post detected`,
                description: `A post about "${searchTerm}" by @${mention.author} is gaining traction with ${totalEngagement.toLocaleString()} total engagements.`,
                mention_id: savedMention.id,
              });
            }
          }

          // Competitor Mention Detection
          const competitorKeywords = [
            'competitor',
            'vs',
            'versus',
            'alternative',
            'better than',
            'switch from',
            'moved to',
            'compared to',
            'instead of',
          ];
          const contentLower = (mention.content || '').toLowerCase();
          if (competitorKeywords.some((kw) => contentLower.includes(kw))) {
            const alertKey = `competitor-${savedMention.id}`;
            if (!seenAlerts.has(alertKey)) {
              seenAlerts.add(alertKey);
              alertsToCreate.push({
                listening_id: keyword.id,
                type: 'competitor',
                severity: 'medium',
                title: `Competitor comparison detected`,
                description: `A post comparing or mentioning competitors was found: "${mention.content?.slice(0, 100)}..."`,
                mention_id: savedMention.id,
              });
            }
          }
        }
      }

      // Spike Detection
      if (analysis.has_spike) {
        alertsToCreate.push({
          listening_id: keyword.id,
          type: 'spike',
          severity: analysis.trending_score > 80 ? 'critical' : 'high',
          title: `Mention spike detected for "${searchTerm}"`,
          description: `There's been a significant increase in mentions of "${searchTerm}". Current trending score: ${analysis.trending_score || 0}. This could indicate viral content or breaking news.`,
        });
      }

      // Negative Sentiment Shift Detection
      if (analysis.negative_shift) {
        const negativePercent = analysis.sentiment_breakdown?.negative || 0;
        alertsToCreate.push({
          listening_id: keyword.id,
          type: 'negative_sentiment',
          severity: negativePercent > 50 ? 'critical' : negativePercent > 35 ? 'high' : 'medium',
          title: `Negative sentiment shift for "${searchTerm}"`,
          description: `Sentiment has shifted negative with ${negativePercent}% negative mentions. Review recent posts for potential reputation issues.`,
        });
      }

      // Create all alerts
      for (const alert of alertsToCreate) {
        await base44.entities.ListeningAlert.create(alert);
      }

      // AI Anomaly Detection (if enabled)
      if (keyword.ai_alerts_enabled !== false) {
        await runAIAnomalyDetection(keyword, analysis, previousMentionCount);
      }

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-listening'] });
      queryClient.invalidateQueries({ queryKey: ['listening-mentions'] });
      queryClient.invalidateQueries({ queryKey: ['listening-alerts'] });
      setScanningId(null);
    },
    onError: () => setScanningId(null),
  });

  // AI Anomaly Detection Function
  const runAIAnomalyDetection = async (keyword, analysis, previousMentionCount) => {
    const sensitivity = keyword.alert_sensitivity || 'medium';
    const thresholds = {
      low: { spike: 3.0, sentiment: 40, impact: 80 },
      medium: { spike: 2.0, sentiment: 25, impact: 60 },
      high: { spike: 1.5, sentiment: 15, impact: 40 },
    }[sensitivity];

    const searchTerm =
      keyword.type === 'hashtag'
        ? `#${keyword.keyword}`
        : keyword.type === 'mention'
          ? `@${keyword.keyword}`
          : keyword.keyword;

    // Get baseline metrics
    const baseline = keyword.baseline_metrics || {
      avg_mentions: 5,
      avg_negative_ratio: 0.2,
      avg_engagement: 100,
    };

    // Analyze with AI for deeper anomalies
    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this social media data for "${searchTerm}" and detect any anomalies or potential brand risks.

Current scan data:
- New mentions found: ${analysis.mentions?.length || 0}
- Previous total mentions: ${previousMentionCount}
- Trending score: ${analysis.trending_score || 0}
- Sentiment: Positive ${analysis.sentiment_breakdown?.positive || 0}, Neutral ${analysis.sentiment_breakdown?.neutral || 0}, Negative ${analysis.sentiment_breakdown?.negative || 0}
- Has spike detected: ${analysis.has_spike}
- Negative shift detected: ${analysis.negative_shift}

Historical baseline (approximate):
- Average mentions per scan: ${baseline.avg_mentions}
- Average negative ratio: ${(baseline.avg_negative_ratio * 100).toFixed(1)}%
- Average engagement: ${baseline.avg_engagement}

Recent mentions content:
${analysis.mentions
  ?.slice(0, 10)
  .map(
    (m) =>
      `- ${m.sentiment}: "${m.content?.slice(0, 100)}..." by @${m.author} (${m.author_followers} followers)`
  )
  .join('\n')}

Detection sensitivity: ${sensitivity.toUpperCase()}
Thresholds: Spike ${thresholds.spike}x, Sentiment shift ${thresholds.sentiment}%, Impact ${thresholds.impact}+

Identify:
1. Unusual patterns not caught by basic rules (velocity changes, coordinated activity, unusual timing)
2. Potential PR crises or reputation risks
3. Emerging trends that could go viral
4. High-impact mentions that need immediate attention
5. Sentiment patterns indicating deeper issues

For each anomaly found, provide:
- Type: anomaly, sentiment_shift, or brand_risk
- Severity: low, medium, high, or critical
- Impact score 0-100 (considering reach, sentiment, virality potential)
- Clear title and description
- Recommended action`,
      response_json_schema: {
        type: 'object',
        properties: {
          anomalies_detected: { type: 'boolean' },
          anomalies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string' },
                impact_score: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                recommended_action: { type: 'string' },
                related_mention_index: { type: 'number' },
              },
            },
          },
          updated_baseline: {
            type: 'object',
            properties: {
              avg_mentions: { type: 'number' },
              avg_negative_ratio: { type: 'number' },
              avg_engagement: { type: 'number' },
            },
          },
        },
      },
    });

    // Create AI-detected alerts
    if (aiAnalysis.anomalies?.length > 0) {
      for (const anomaly of aiAnalysis.anomalies) {
        // Skip if below threshold
        if (anomaly.impact_score < thresholds.impact && anomaly.severity === 'low') {
          continue;
        }

        await base44.entities.ListeningAlert.create({
          listening_id: keyword.id,
          type: anomaly.type || 'anomaly',
          severity: anomaly.severity || 'medium',
          title: anomaly.title,
          description: anomaly.description,
          is_ai_generated: true,
          impact_score: anomaly.impact_score,
          recommended_action: anomaly.recommended_action,
          anomaly_data: {
            sensitivity,
            thresholds,
            detected_at: new Date().toISOString(),
          },
        });
      }
    }

    // Update baseline metrics
    if (aiAnalysis.updated_baseline) {
      await base44.entities.SocialListening.update(keyword.id, {
        baseline_metrics: aiAnalysis.updated_baseline,
      });
    }
  };

  // Update alert settings mutation
  const updateAlertSettingsMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.SocialListening.update(data.id, {
        ai_alerts_enabled: data.ai_alerts_enabled,
        alert_sensitivity: data.alert_sensitivity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-listening'] });
      setShowAlertSettings(false);
      setAlertSettingsKeyword(null);
    },
  });

  // Deep scan for forums/communities (goes back to 2009)
  const deepScanMutation = useMutation({
    mutationFn: async (keyword) => {
      setDeepScanningId(keyword.id);

      const searchTerm =
        keyword.type === 'hashtag'
          ? `#${keyword.keyword}`
          : keyword.type === 'mention'
            ? `@${keyword.keyword}`
            : keyword.keyword;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the internet comprehensively for ALL discussions, forums, group chats, and community posts about "${searchTerm}" from 2009 to 2025 (going back at least 16 years).

Search these types of sources:
- Reddit (subreddits, posts, comments)
- Aviation forums (like AvWeb, AOPA forums, Pilots of America, etc.)
- Discord servers (aviation communities)
- Quora questions and answers
- Blog comment sections
- News article comments
- Telegram groups
- Specialized forums related to the topic
- Any other online communities discussing this topic

Find 20 historical discussions/posts spanning from 2009 to 2025 and for each provide:
1. Source type (forum, reddit, discord, slack, telegram, quora, blog_comments, news_comments, other)
2. Source name (e.g., "r/aviation", "AvWeb Forum", "Pilots of America")
3. Source URL if known
4. Thread/discussion title
5. Content excerpt (the relevant post or comment)
6. Author username
7. Post date (IMPORTANT: include posts from different years spanning 2009-2025)
8. Number of replies in the thread
9. Number of views (estimate if unknown)
10. Upvotes/likes
11. Sentiment (positive, neutral, negative)
12. Topics/tags (array of relevant keywords)

Prioritize finding older historical discussions from 2009-2015 as well as recent ones.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            total_found: { type: 'number' },
            mentions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source_type: { type: 'string' },
                  source_name: { type: 'string' },
                  source_url: { type: 'string' },
                  thread_title: { type: 'string' },
                  content: { type: 'string' },
                  author: { type: 'string' },
                  post_date: { type: 'string' },
                  replies_count: { type: 'number' },
                  views_count: { type: 'number' },
                  upvotes: { type: 'number' },
                  sentiment: { type: 'string' },
                  topics: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      });

      // Save forum mentions
      if (analysis.mentions?.length > 0) {
        for (const mention of analysis.mentions) {
          await base44.entities.ForumMention.create({
            listening_id: keyword.id,
            source_type: mention.source_type || 'forum',
            source_name: mention.source_name,
            source_url: mention.source_url,
            thread_title: mention.thread_title,
            content: mention.content,
            author: mention.author,
            post_date: mention.post_date
              ? new Date(mention.post_date).toISOString()
              : new Date().toISOString(),
            replies_count: mention.replies_count || 0,
            views_count: mention.views_count || 0,
            upvotes: mention.upvotes || 0,
            sentiment: mention.sentiment || 'neutral',
            topics: mention.topics || [],
          });
        }
      }

      // Create alert for deep scan completion
      await base44.entities.ListeningAlert.create({
        listening_id: keyword.id,
        type: 'spike',
        severity: 'medium',
        title: `Deep scan complete for "${searchTerm}"`,
        description: `Found ${analysis.mentions?.length || 0} forum/community discussions spanning 2009-2025.`,
      });

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-mentions'] });
      queryClient.invalidateQueries({ queryKey: ['listening-alerts'] });
      setDeepScanningId(null);
    },
    onError: () => setDeepScanningId(null),
  });

  // Filter mentions
  const filteredMentions = mentions.filter((m) => {
    if (selectedKeyword && m.listening_id !== selectedKeyword.id) {
      return false;
    }
    if (platformFilter !== 'all' && m.platform !== platformFilter) {
      return false;
    }
    if (sentimentFilter !== 'all' && m.sentiment !== sentimentFilter) {
      return false;
    }
    return true;
  });

  // Get mentions needing response (negative or from influencers)
  const mentionsNeedingResponse = mentions.filter(
    (m) =>
      m.response_status !== 'responded' &&
      m.response_status !== 'ignored' &&
      (m.sentiment === 'negative' || m.is_influencer || m.influence_score >= 70)
  );

  // Stats
  const totalMentions = mentions.length;
  const activeTracks = keywords.filter((k) => k.is_active).length;
  const avgTrendScore =
    keywords.length > 0
      ? Math.round(keywords.reduce((sum, k) => sum + (k.trending_score || 0), 0) / keywords.length)
      : 0;
  const sentimentCounts = {
    positive: mentions.filter((m) => m.sentiment === 'positive').length,
    neutral: mentions.filter((m) => m.sentiment === 'neutral').length,
    negative: mentions.filter((m) => m.sentiment === 'negative').length,
  };
  const unreadAlerts = alerts.filter((a) => !a.is_read && !a.is_dismissed).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Social Listening</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Track keywords, hashtags, and mentions across social media
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2 bg-violet-600 hover:bg-violet-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Keyword
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
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
            <Bell
              className={`w-6 h-6 mx-auto mb-2 ${unreadAlerts > 0 ? 'text-red-500' : 'text-gray-400'}`}
            />
            <p
              className={`text-2xl font-bold ${unreadAlerts > 0 ? 'text-red-600' : 'text-gray-900'}`}
            >
              {unreadAlerts}
            </p>
            <p className="text-sm text-gray-500">Alerts</p>
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
        <TabsList className="flex-wrap h-auto gap-1 p-1 w-full overflow-x-auto">
          <TabsTrigger value="keywords" className="text-xs sm:text-sm">
            Keywords
          </TabsTrigger>
          <TabsTrigger value="mentions" className="text-xs sm:text-sm">
            Mentions ({totalMentions})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="relative text-xs sm:text-sm">
            Alerts
            {unreadAlerts > 0 && (
              <Badge className="ml-1 bg-red-500 text-white border-0 text-xs h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center">
                {unreadAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="influencers" className="text-xs sm:text-sm">
            Influencers
          </TabsTrigger>
          <TabsTrigger value="responses" className="text-xs sm:text-sm hidden sm:flex">
            Responses
          </TabsTrigger>
          <TabsTrigger value="forums" className="text-xs sm:text-sm hidden md:flex">
            Forums
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">
            Trends
          </TabsTrigger>
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
            <>
              {selectedKeyword && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-violet-100 text-violet-700 border-0">
                      Showing mentions for:{' '}
                      {selectedKeyword.type === 'hashtag'
                        ? '#'
                        : selectedKeyword.type === 'mention'
                          ? '@'
                          : ''}
                      {selectedKeyword.keyword}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedKeyword(null)}
                      className="text-xs h-6"
                    >
                      Clear
                    </Button>
                  </div>
                  {/* Show mentions for selected keyword */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                    {mentions.filter((m) => m.listening_id === selectedKeyword.id).length === 0 ? (
                      <Card className="p-6 text-center border-0 shadow-sm">
                        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          No mentions found. Click "Scan" to search for mentions.
                        </p>
                      </Card>
                    ) : (
                      mentions
                        .filter((m) => m.listening_id === selectedKeyword.id)
                        .map((mention) => (
                          <ListeningMentionCard
                            key={mention.id}
                            mention={mention}
                            onClick={() => setSelectedMention(mention)}
                          />
                        ))
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {keywords.map((keyword) => (
                  <ListeningKeywordCard
                    key={keyword.id}
                    keyword={keyword}
                    onClick={() =>
                      setSelectedKeyword(selectedKeyword?.id === keyword.id ? null : keyword)
                    }
                    onToggle={(kw) => toggleKeywordMutation.mutate(kw)}
                    onScan={(kw) => scanKeywordMutation.mutate(kw)}
                    onDelete={(id) => deleteKeywordMutation.mutate(id)}
                    onEdit={(kw) => {
                      setEditingKeyword(kw);
                      setShowAddModal(true);
                    }}
                    isScanning={scanningId === keyword.id}
                    isSelected={selectedKeyword?.id === keyword.id}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Mentions Tab */}
        <TabsContent value="mentions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select
                value={selectedKeyword?.id || 'all'}
                onValueChange={(v) =>
                  setSelectedKeyword(v === 'all' ? null : keywords.find((k) => k.id === v))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Keywords" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Keywords</SelectItem>
                  {keywords.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.type === 'hashtag' ? '#' : k.type === 'mention' ? '@' : ''}
                      {k.keyword}
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
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
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
                onClick={() => {
                  setSelectedKeyword(null);
                  setPlatformFilter('all');
                  setSentimentFilter('all');
                }}
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
              description={
                keywords.length === 0
                  ? 'Add keywords to start tracking social mentions.'
                  : 'Scan your tracked keywords to find social media mentions.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredMentions.map((mention) => (
                <ListeningMentionCard
                  key={mention.id}
                  mention={mention}
                  onClick={() => setSelectedMention(mention)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* AI Settings Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setAlertSettingsKeyword(keywords[0] || null);
                setShowAlertSettings(true);
              }}
            >
              <Brain className="w-4 h-4" />
              AI Alert Settings
            </Button>
          </div>
          <AlertsPanel
            alerts={alerts}
            mentions={mentions}
            onMarkRead={(id) => markAlertReadMutation.mutate(id)}
            onDismiss={(id) => dismissAlertMutation.mutate(id)}
            onViewMention={(mentionId) => {
              const mention = mentions.find((m) => m.id === mentionId);
              if (mention) {
                setSelectedMention(mention);
              }
            }}
          />
        </TabsContent>

        {/* Influencers Tab */}
        <TabsContent value="influencers" className="space-y-4">
          <InfluencersPanel mentions={mentions} onViewMention={(m) => setSelectedMention(m)} />
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          {mentionsNeedingResponse.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No responses needed"
              description="All high-priority mentions have been addressed."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mentionsNeedingResponse.map((mention) => (
                <ResponseSuggestionCard
                  key={mention.id}
                  mention={mention}
                  onGenerateResponse={(m) => generateResponseMutation.mutateAsync(m)}
                  onUpdateStatus={(id, status) =>
                    updateMentionStatusMutation.mutate({ id, status })
                  }
                  isGenerating={generatingResponseFor === mention.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Forums & Communities Tab */}
        <TabsContent value="forums" className="space-y-4">
          <Card className="border-0 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Deep Scan for Forums & Communities</h3>
                <p className="text-sm text-gray-500">
                  Search Reddit, forums, Discord, Quora, and more going back to 2009
                </p>
              </div>
              <div className="flex gap-2">
                {keywords.length > 0 && (
                  <Select
                    value={selectedKeyword?.id || ''}
                    onValueChange={(v) =>
                      setSelectedKeyword(keywords.find((k) => k.id === v) || null)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select keyword to scan" />
                    </SelectTrigger>
                    <SelectContent>
                      {keywords.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.type === 'hashtag' ? '#' : k.type === 'mention' ? '@' : ''}
                          {k.keyword}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  onClick={() => selectedKeyword && deepScanMutation.mutate(selectedKeyword)}
                  disabled={!selectedKeyword || deepScanningId}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  {deepScanningId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessagesSquare className="w-4 h-4" />
                  )}
                  {deepScanningId ? 'Scanning...' : 'Deep Scan (2009-2025)'}
                </Button>
              </div>
            </div>
          </Card>

          {forumMentions.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No forum mentions found"
              description="Run a deep scan to find discussions in forums, Reddit, Discord, and other communities."
            />
          ) : (
            <div className="space-y-3">
              {forumMentions
                .filter((m) => !selectedKeyword || m.listening_id === selectedKeyword.id)
                .sort((a, b) => new Date(b.post_date) - new Date(a.post_date))
                .map((mention) => (
                  <ForumMentionCard
                    key={mention.id}
                    mention={mention}
                    onClick={() => setSelectedMention({ ...mention, isForumMention: true })}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentTrendsChart mentions={mentions} />
            <GeographicInsights mentions={mentions} />
            <ListeningTrendsCard keywords={keywords} mentions={mentions} />

            {/* Platform Distribution */}
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
                      const count = mentions.filter((m) => m.platform === platform).length;
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

      {/* Add/Edit Modal */}
      <AddListeningModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingKeyword(null);
        }}
        onSave={(data) => createKeywordMutation.mutate(data)}
        isLoading={createKeywordMutation.isPending}
        editingKeyword={editingKeyword}
      />

      {/* AI Alert Settings Modal */}
      <AlertSettingsModal
        open={showAlertSettings}
        onClose={() => {
          setShowAlertSettings(false);
          setAlertSettingsKeyword(null);
        }}
        keyword={alertSettingsKeyword}
        onSave={(data) => updateAlertSettingsMutation.mutate(data)}
        isLoading={updateAlertSettingsMutation.isPending}
      />

      {/* Mention Detail Modal */}
      <Dialog open={!!selectedMention} onOpenChange={() => setSelectedMention(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mention Details</DialogTitle>
          </DialogHeader>
          {selectedMention && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    selectedMention.platform === 'twitter'
                      ? 'bg-gray-900 text-white'
                      : selectedMention.platform === 'linkedin'
                        ? 'bg-blue-600 text-white'
                        : selectedMention.platform === 'facebook'
                          ? 'bg-blue-500 text-white'
                          : selectedMention.platform === 'instagram'
                            ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white'
                            : 'bg-red-600 text-white'
                  }
                >
                  {platformLabels[selectedMention.platform]}
                </Badge>
                <Badge
                  className={
                    selectedMention.sentiment === 'positive'
                      ? 'bg-emerald-100 text-emerald-700'
                      : selectedMention.sentiment === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                  }
                >
                  {selectedMention.sentiment}
                </Badge>
                {selectedMention.is_influencer && (
                  <Badge className="bg-purple-100 text-purple-700">Influencer</Badge>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Author</p>
                <p className="font-medium">@{selectedMention.author}</p>
                <p className="text-sm text-gray-500">
                  {(selectedMention.author_followers || 0).toLocaleString()} followers
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Content</p>
                <p className="text-gray-900 mt-1">{selectedMention.content}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold">{selectedMention.likes || 0}</p>
                  <p className="text-xs text-gray-500">Likes</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold">{selectedMention.comments || 0}</p>
                  <p className="text-xs text-gray-500">Comments</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold">{selectedMention.shares || 0}</p>
                  <p className="text-xs text-gray-500">Shares</p>
                </div>
              </div>

              {selectedMention.location && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {selectedMention.location}{' '}
                    {selectedMention.country && `(${selectedMention.country})`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Influence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${selectedMention.influence_score || 0}%` }}
                    />
                  </div>
                  <span className="font-medium">{selectedMention.influence_score || 0}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
