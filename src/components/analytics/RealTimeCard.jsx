import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Users, Eye, MousePointer } from 'lucide-react';

export default function RealTimeCard() {
  // SyberJet real-time data
  const [activeUsers, setActiveUsers] = useState(28);
  const [recentPageviews, setRecentPageviews] = useState(84);
  const [activePages, setActivePages] = useState([
    { path: '/sj30i', users: 9 },
    { path: '/', users: 7 },
    { path: '/performance', users: 5 },
    { path: '/interior', users: 4 },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => Math.max(1, prev + Math.floor(Math.random() * 7) - 3));
      setRecentPageviews((prev) => prev + Math.floor(Math.random() * 5) + 1);
      setActivePages((prev) =>
        prev.map((p) => ({
          ...p,
          users: Math.max(1, p.users + Math.floor(Math.random() * 3) - 1),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="glass-card rounded-2xl border-l-4 border-l-emerald-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Real-Time</span>
          </div>
          <span className="text-xs text-gray-400">Live</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
            <p className="text-xs text-gray-500">Active Now</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{recentPageviews}</p>
            <p className="text-xs text-gray-500">Views (30m)</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Active Pages</p>
          <div className="space-y-1.5">
            {activePages.map((page) => (
              <div key={page.path} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                  {page.path}
                </span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <MousePointer className="w-3 h-3" />
                  <span className="font-medium">{page.users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
