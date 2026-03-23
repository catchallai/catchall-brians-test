import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Globe, FileSearch, Target, Link2, MapPin, ArrowRight } from 'lucide-react';

export default function SEODashboardPage() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: websites = [], isLoading: loadingWebsites } = useQuery({
    queryKey: ['websites', user?.current_business_id],
    queryFn: () => base44.entities.Website.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 500),
  });

  const { data: backlinks = [], isLoading: loadingBacklinks } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 500),
  });

  const isLoading = loadingWebsites || loadingKeywords || loadingBacklinks;

  const stats = {
    websites: websites.length,
    keywords: keywords.length,
    topRankings: keywords.filter((k) => k.current_position <= 10).length,
    backlinks: backlinks.filter((b) => b.status === 'active').length,
  };

  const quickLinks = [
    { name: 'SEO Analytics', icon: Search, page: 'SEODashboard', color: 'violet' },
    { name: 'SEO Tools', icon: Globe, page: 'SEOTools', color: 'blue' },
    { name: 'SEO Audits', icon: FileSearch, page: 'SEOAudit', color: 'emerald' },
    { name: 'Keywords', icon: Target, page: 'Keywords', count: stats.keywords, color: 'amber' },
    { name: 'Backlinks', icon: Link2, page: 'Backlinks', count: stats.backlinks, color: 'cyan' },
    { name: 'Local SEO', icon: MapPin, page: 'LocalSEO', color: 'pink' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
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
          SEO
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Search engine optimization overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Websites Tracked
                </p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Keywords</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.keywords}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stats.topRankings} in top 10
                </p>
              </div>
              <Target className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Backlinks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.backlinks}
                </p>
              </div>
              <Link2 className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg. Position
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {keywords.length > 0
                    ? (
                        keywords.reduce((sum, k) => sum + (k.current_position || 0), 0) /
                        keywords.length
                      ).toFixed(1)
                    : '0'}
                </p>
              </div>
              <Search className="w-8 h-8 text-blue-500" />
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
