import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Search, Link2, TrendingUp } from "lucide-react";

export default function SEOOverviewStats({ websites, keywords, backlinks }) {
  const totalTraffic = websites.reduce((sum, w) => sum + (w.organic_traffic || 0), 0);
  const avgDa = websites.length > 0 
    ? Math.round(websites.reduce((sum, w) => sum + (w.domain_authority || 0), 0) / websites.length)
    : 0;
  const top10Keywords = keywords.filter(k => k.current_position && k.current_position <= 10).length;
  const activeBacklinks = backlinks.filter(b => b.status === 'active').length;

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const stats = [
    {
      label: 'Websites',
      value: websites.length,
      subtext: `Avg DA: ${avgDa}`,
      icon: Globe,
      color: 'bg-emerald-500'
    },
    {
      label: 'Keywords',
      value: keywords.length,
      subtext: `${top10Keywords} in top 10`,
      icon: Search,
      color: 'bg-violet-500'
    },
    {
      label: 'Backlinks',
      value: backlinks.length,
      subtext: `${activeBacklinks} active`,
      icon: Link2,
      color: 'bg-blue-500'
    },
    {
      label: 'Monthly Traffic',
      value: formatNumber(totalTraffic),
      subtext: 'estimated',
      icon: TrendingUp,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color} text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xs text-emerald-600">{stat.subtext}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}