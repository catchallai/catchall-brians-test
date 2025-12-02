import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReferralDetailsCard({ data }) {
  const referrals = data || [
    { domain: 'google.com', visits: 4520, type: 'search', percentage: 32 },
    { domain: 'facebook.com', visits: 2180, type: 'social', percentage: 15 },
    { domain: 'twitter.com', visits: 1850, type: 'social', percentage: 13 },
    { domain: 'linkedin.com', visits: 1420, type: 'social', percentage: 10 },
    { domain: 'medium.com', visits: 980, type: 'referral', percentage: 7 },
    { domain: 'reddit.com', visits: 750, type: 'social', percentage: 5 },
    { domain: 'bing.com', visits: 620, type: 'search', percentage: 4 },
    { domain: 'producthunt.com', visits: 480, type: 'referral', percentage: 3 },
  ];

  const typeColors = {
    search: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    social: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    referral: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-500" />
          Top Referrers
        </CardTitle>
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
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ref.domain}</p>
                <p className="text-xs text-gray-400">{ref.visits.toLocaleString()} visits</p>
              </div>
              <Badge className={`text-xs ${typeColors[ref.type]}`}>
                {ref.type}
              </Badge>
              <span className="text-sm font-medium text-gray-500 w-10 text-right">{ref.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}