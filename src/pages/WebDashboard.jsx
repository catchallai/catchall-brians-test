import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, BarChart3, FileSearch, Activity, ArrowRight } from 'lucide-react';

export default function WebDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: websites = [], isLoading: loadingWebsites } = useQuery({
    queryKey: ['websites', user?.current_business_id],
    queryFn: () => base44.entities.Website.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: traffic = [], isLoading: loadingTraffic } = useQuery({
    queryKey: ['traffic-data'],
    queryFn: () => base44.entities.TrafficData.list('-date', 30),
  });

  const { data: audits = [], isLoading: loadingAudits } = useQuery({
    queryKey: ['seo-audits'],
    queryFn: () => base44.entities.SEOAudit.list('-created_date', 50),
  });

  const isLoading = loadingWebsites || loadingTraffic || loadingAudits;

  const stats = {
    websites: websites.length,
    totalVisitors: traffic.reduce((sum, t) => sum + (t.visitors || 0), 0),
    avgSEOScore:
      websites.length > 0
        ? (websites.reduce((sum, w) => sum + (w.seo_score || 0), 0) / websites.length).toFixed(0)
        : 0,
    audits: audits.length,
  };

  const quickLinks = [
    { name: 'Web Analytics', icon: BarChart3, page: 'TrafficAnalytics', color: 'violet' },
    { name: 'Web Audits', icon: FileSearch, page: 'SEOAudit', count: stats.audits, color: 'blue' },
    { name: 'Web Crawler', icon: Globe, page: 'WebCrawler', color: 'emerald' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
          Web
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Web analytics and performance overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Websites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.websites}</p>
              </div>
              <Globe className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Visitors (30d)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVisitors > 1000
                    ? `${(stats.totalVisitors / 1000).toFixed(1)}k`
                    : stats.totalVisitors}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg. SEO Score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgSEOScore}/100
                </p>
              </div>
              <FileSearch className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Audits Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.audits}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.page} to={createPageUrl(link.page)}>
                <Card className="glass-card hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-${link.color}-100 dark:bg-${link.color}-900/40 flex items-center justify-center`}
                        >
                          <Icon className={`w-6 h-6 text-${link.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {link.name}
                          </h3>
                          {link.count !== undefined && (
                            <p className="text-sm text-gray-500">{link.count} items</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
