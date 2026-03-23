import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReferralDetailsCard({ data, onRefresh, isRefreshing }) {
  // SyberJet referral sources - aviation industry focused
  const referrals = data || [
    { domain: 'google.com', visits: 14280, type: 'search', percentage: 38 },
    { domain: 'linkedin.com', visits: 5640, type: 'social', percentage: 15 },
    { domain: 'bjtonline.com', visits: 3420, type: 'referral', percentage: 9 },
    { domain: 'ainonline.com', visits: 2890, type: 'referral', percentage: 8 },
    { domain: 'flyingmag.com', visits: 2340, type: 'referral', percentage: 6 },
    { domain: 'avweb.com', visits: 1950, type: 'referral', percentage: 5 },
    { domain: 'bing.com', visits: 1420, type: 'search', percentage: 4 },
    { domain: 'nbaa.org', visits: 980, type: 'referral', percentage: 3 },
  ];

  const typeColors = {
    search: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    social: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    referral: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-500" />
          Top Referrers
        </CardTitle>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {referrals.map((ref, index) => (
            <div
              key={ref.domain}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="w-5 text-xs font-medium text-gray-400">{index + 1}</span>
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Globe className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {ref.domain}
                </p>
                <p className="text-xs text-gray-400">{ref.visits.toLocaleString()} visits</p>
              </div>
              <Badge className={`text-xs ${typeColors[ref.type]}`}>{ref.type}</Badge>
              <span className="text-sm font-medium text-gray-500 w-10 text-right">
                {ref.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
