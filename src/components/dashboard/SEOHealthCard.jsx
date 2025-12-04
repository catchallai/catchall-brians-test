import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Link2, Globe, Target } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SEOHealthCard({ websites, keywords, backlinks }) {
  // Normalize SEO scores - handle both 0-1 and 0-100 formats
  const normalizeScore = (score) => {
    if (!score) return 0;
    // If score is between 0-1, convert to 0-100
    if (score > 0 && score <= 1) return Math.round(score * 100);
    return Math.round(score);
  };

  const avgSEOScore = websites.length > 0 
    ? Math.round(websites.reduce((sum, w) => sum + normalizeScore(w.seo_score), 0) / websites.length)
    : 0;

  const top10Keywords = keywords.filter(k => k.current_position && k.current_position <= 10).length;
  const top3Keywords = keywords.filter(k => k.current_position && k.current_position <= 3).length;
  
  const totalBacklinks = backlinks.length;
  const activeBacklinks = backlinks.filter(b => b.status === 'active').length;

  const scoreColor = avgSEOScore >= 80 ? 'text-emerald-500' : 
                     avgSEOScore >= 60 ? 'text-yellow-500' : 
                     avgSEOScore >= 40 ? 'text-orange-500' : 'text-red-500';

  const scoreRingColor = avgSEOScore >= 80 ? '#10b981' : 
                         avgSEOScore >= 60 ? '#eab308' : 
                         avgSEOScore >= 40 ? '#f97316' : '#ef4444';

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Search className="w-4 h-4 text-blue-500" />
          SEO Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SEO Score Ring */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-100 dark:text-gray-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={scoreRingColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${avgSEOScore * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>{avgSEOScore}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Websites</span>
              <span className="font-semibold text-gray-900 dark:text-white">{websites.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Keywords</span>
              <span className="font-semibold text-gray-900 dark:text-white">{keywords.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Backlinks</span>
              <span className="font-semibold text-gray-900 dark:text-white">{activeBacklinks}</span>
            </div>
          </div>
        </div>

        {/* Keyword Rankings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{top3Keywords}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Top 3 Rankings</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{top10Keywords}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Top 10 Rankings</p>
          </div>
        </div>

        <Link 
          to={createPageUrl('SEODashboard')}
          className="block text-center text-sm text-violet-600 dark:text-violet-400 hover:underline py-2"
        >
          View Full SEO Dashboard →
        </Link>
      </CardContent>
    </Card>
  );
}