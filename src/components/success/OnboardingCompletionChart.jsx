import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

export default function OnboardingCompletionChart({ onboardings }) {
  const chartData = React.useMemo(() => {
    const statusCounts = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      stalled: 0,
    };

    onboardings.forEach((o) => {
      statusCounts[o.status]++;
    });

    const progressBuckets = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-99%': 0,
      '100%': 0,
    };

    onboardings.forEach((o) => {
      const progress = o.progress_percentage || 0;
      if (progress === 0) {
        progressBuckets['0-25%']++;
      } else if (progress <= 25) {
        progressBuckets['0-25%']++;
      } else if (progress <= 50) {
        progressBuckets['26-50%']++;
      } else if (progress <= 75) {
        progressBuckets['51-75%']++;
      } else if (progress < 100) {
        progressBuckets['76-99%']++;
      } else {
        progressBuckets['100%']++;
      }
    });

    return [
      { name: '0-25%', count: progressBuckets['0-25%'] },
      { name: '26-50%', count: progressBuckets['26-50%'] },
      { name: '51-75%', count: progressBuckets['51-75%'] },
      { name: '76-99%', count: progressBuckets['76-99%'] },
      { name: '100%', count: progressBuckets['100%'] },
    ];
  }, [onboardings]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Onboarding Progress Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Customers" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
