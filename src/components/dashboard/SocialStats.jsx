import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Users, Heart, Share2 } from 'lucide-react';

export default function SocialStats({ mentions = [], posts = [] }) {
  const totalMentions = mentions.length;
  const positiveMentions = mentions.filter((m) => m.sentiment === 'positive').length;
  const negativeMentions = mentions.filter((m) => m.sentiment === 'negative').length;
  const totalEngagement = mentions.reduce(
    (sum, m) => sum + (m.likes || 0) + (m.comments || 0) + (m.shares || 0),
    0
  );
  const totalReach = mentions.reduce((sum, m) => sum + (m.reach || 0), 0);
  const scheduledPosts = posts.filter(
    (p) => p.status === 'scheduled' || p.status === 'draft'
  ).length;

  const sentimentScore =
    totalMentions > 0
      ? Math.round(((positiveMentions - negativeMentions) / totalMentions + 1) * 50)
      : 50;

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    {
      label: 'Mentions',
      value: formatNumber(totalMentions),
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      label: 'Engagement',
      value: formatNumber(totalEngagement),
      icon: Heart,
      color: 'text-pink-600',
    },
    { label: 'Reach', value: formatNumber(totalReach), icon: Users, color: 'text-violet-600' },
    { label: 'Scheduled', value: scheduledPosts, icon: Share2, color: 'text-emerald-600' },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Social Overview</CardTitle>
          <Badge
            className={`${
              sentimentScore >= 60
                ? 'bg-emerald-100 text-emerald-700'
                : sentimentScore >= 40
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {sentimentScore}% Positive
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
