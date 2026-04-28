import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format, eachWeekOfInterval } from 'date-fns';
import { PLATFORM_MAP } from '@/constants/platforms';

export default function SocialEngagementChart({ dateRange }) {
  // Generate mock data
  const generateData = () => {
    const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });

    return weeks.map((date, idx) => ({
      date: format(date, 'MMM d'),
      likes: Math.round(500 + Math.sin(idx * 0.4) * 200 + Math.random() * 150),
      comments: Math.round(80 + Math.sin(idx * 0.5) * 40 + Math.random() * 30),
      shares: Math.round(120 + Math.cos(idx * 0.3) * 60 + Math.random() * 40),
      mentions: Math.round(50 + Math.sin(idx * 0.6) * 25 + Math.random() * 20),
    }));
  };

  const data = generateData();

  // Platform breakdown
  const platformData = [
    { name: 'Twitter', value: 35, color: PLATFORM_MAP.Twitter.bg },
    { name: 'Instagram', value: 28, color: PLATFORM_MAP.Instagram.bg },
    { name: 'LinkedIn', value: 22, color: PLATFORM_MAP.LinkedIn.bg },
    { name: 'Facebook', value: 15, color: PLATFORM_MAP.Facebook.bg },
  ];

  const totalEngagement = data.reduce((sum, d) => sum + d.likes + d.comments + d.shares, 0);
  const avgEngagementRate = '4.8%';

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {(totalEngagement / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Engagement</p>
        </div>
        <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {avgEngagementRate}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Engagement Rate</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:stroke-gray-700"
            />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="likes" fill="#ec4899" radius={[2, 2, 0, 0]} name="Likes" />
            <Bar dataKey="comments" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Comments" />
            <Bar dataKey="shares" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Shares" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Breakdown */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">By Platform</p>
        <div className="flex gap-2 flex-wrap">
          {platformData.map((platform) => (
            <Badge
              key={platform.name}
              style={{
                backgroundColor: platform.color + '20',
                color: platform.color,
                borderColor: platform.color,
              }}
              variant="outline"
              className="text-xs"
            >
              {platform.name} {platform.value}%
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
