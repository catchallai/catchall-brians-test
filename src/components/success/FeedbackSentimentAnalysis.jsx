import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444',
};

const SENTIMENT_ICONS = {
  positive: ThumbsUp,
  neutral: Minus,
  negative: ThumbsDown,
};

export default function FeedbackSentimentAnalysis({ surveys, interactions }) {
  const [filterSentiment, setFilterSentiment] = useState('all');

  // Aggregate all feedback sources
  const allFeedback = useMemo(() => {
    const feedback = [];

    // Add surveys
    surveys.forEach((s) => {
      let sentiment = 'neutral';
      if (s.survey_type === 'nps') {
        sentiment =
          s.nps_category === 'promoter'
            ? 'positive'
            : s.nps_category === 'detractor'
              ? 'negative'
              : 'neutral';
      } else if (s.score) {
        sentiment = s.score >= 8 ? 'positive' : s.score <= 5 ? 'negative' : 'neutral';
      }

      feedback.push({
        type: 'survey',
        date: s.completed_date || s.sent_date,
        sentiment,
        score: s.score,
        text: s.feedback,
        contact_id: s.contact_id,
        company_id: s.company_id,
        survey_type: s.survey_type,
      });
    });

    // Add interaction feedback
    interactions.forEach((i) => {
      if (i.summary) {
        feedback.push({
          type: 'interaction',
          date: i.interaction_date,
          sentiment: i.sentiment || 'neutral',
          text: i.summary,
          contact_id: i.contact_id,
          company_id: i.company_id,
          interaction_type: i.interaction_type,
        });
      }
    });

    return feedback.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [surveys, interactions]);

  // Calculate sentiment distribution
  const sentimentDistribution = useMemo(() => {
    const distribution = {
      positive: allFeedback.filter((f) => f.sentiment === 'positive').length,
      neutral: allFeedback.filter((f) => f.sentiment === 'neutral').length,
      negative: allFeedback.filter((f) => f.sentiment === 'negative').length,
    };

    return [
      { name: 'Positive', value: distribution.positive, color: SENTIMENT_COLORS.positive },
      { name: 'Neutral', value: distribution.neutral, color: SENTIMENT_COLORS.neutral },
      { name: 'Negative', value: distribution.negative, color: SENTIMENT_COLORS.negative },
    ];
  }, [allFeedback]);

  // Sentiment over time (last 30 days)
  const sentimentTrend = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayFeedback = allFeedback.filter((f) => {
        const feedbackDate = new Date(f.date).toISOString().split('T')[0];
        return feedbackDate === dateStr;
      });

      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        positive: dayFeedback.filter((f) => f.sentiment === 'positive').length,
        neutral: dayFeedback.filter((f) => f.sentiment === 'neutral').length,
        negative: dayFeedback.filter((f) => f.sentiment === 'negative').length,
      });
    }
    return last30Days;
  }, [allFeedback]);

  // NPS Score calculation
  const npsScore = useMemo(() => {
    const npsResponses = surveys.filter((s) => s.survey_type === 'nps' && s.nps_category);
    if (npsResponses.length === 0) {
      return null;
    }

    const promoters = npsResponses.filter((s) => s.nps_category === 'promoter').length;
    const detractors = npsResponses.filter((s) => s.nps_category === 'detractor').length;
    const total = npsResponses.length;

    return Math.round(((promoters - detractors) / total) * 100);
  }, [surveys]);

  // Filter feedback
  const filteredFeedback =
    filterSentiment === 'all'
      ? allFeedback
      : allFeedback.filter((f) => f.sentiment === filterSentiment);

  const totalPositive = allFeedback.filter((f) => f.sentiment === 'positive').length;
  const totalNegative = allFeedback.filter((f) => f.sentiment === 'negative').length;
  const sentimentRatio =
    totalPositive + totalNegative > 0
      ? ((totalPositive / (totalPositive + totalNegative)) * 100).toFixed(1)
      : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Customer Feedback & Sentiment
          </CardTitle>
          {npsScore !== null && (
            <Badge
              variant={npsScore >= 50 ? 'default' : npsScore >= 0 ? 'secondary' : 'destructive'}
              className="text-lg px-3 py-1"
            >
              NPS: {npsScore}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Positive</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {totalPositive}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-600 dark:text-red-400">Negative</p>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{totalNegative}</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Sentiment Ratio</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{sentimentRatio}%</p>
          </div>
          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">Total Feedback</p>
            <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              {allFeedback.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="distribution">
          <TabsList>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="positive"
                    stackId="a"
                    fill={SENTIMENT_COLORS.positive}
                    name="Positive"
                  />
                  <Bar
                    dataKey="neutral"
                    stackId="a"
                    fill={SENTIMENT_COLORS.neutral}
                    name="Neutral"
                  />
                  <Bar
                    dataKey="negative"
                    stackId="a"
                    fill={SENTIMENT_COLORS.negative}
                    name="Negative"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterSentiment === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterSentiment('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterSentiment === 'positive' ? 'default' : 'outline'}
                onClick={() => setFilterSentiment('positive')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Positive
              </Button>
              <Button
                size="sm"
                variant={filterSentiment === 'neutral' ? 'default' : 'outline'}
                onClick={() => setFilterSentiment('neutral')}
              >
                Neutral
              </Button>
              <Button
                size="sm"
                variant={filterSentiment === 'negative' ? 'default' : 'outline'}
                onClick={() => setFilterSentiment('negative')}
                className="bg-red-600 hover:bg-red-700"
              >
                Negative
              </Button>
            </div>

            {/* Feedback List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredFeedback.slice(0, 20).map((item, idx) => {
                const SentimentIcon = SENTIMENT_ICONS[item.sentiment];
                return (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <SentimentIcon
                        className={`w-5 h-5 mt-0.5 ${
                          item.sentiment === 'positive'
                            ? 'text-emerald-500'
                            : item.sentiment === 'negative'
                              ? 'text-red-500'
                              : 'text-gray-400'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type === 'survey'
                              ? item.survey_type?.toUpperCase()
                              : item.interaction_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
                        {item.score && (
                          <p className="text-xs text-gray-500 mt-1">Score: {item.score}/10</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
