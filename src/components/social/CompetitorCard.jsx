import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ExternalLink, RefreshCw, Loader2, Eye } from "lucide-react";

export default function CompetitorCard({ competitor, onAnalyze, isAnalyzing, onView }) {
  const totalFollowers = competitor.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
  const avgEngagement = competitor.social_accounts?.length > 0
    ? (competitor.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / competitor.social_accounts.length).toFixed(1)
    : 0;

  return (
    <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{competitor.name}</h4>
          {competitor.website && (
            <a 
              href={competitor.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-violet-600 flex items-center gap-1"
            >
              {competitor.website.replace(/https?:\/\//, '').slice(0, 25)}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {competitor.last_analyzed && (
          <Badge variant="outline" className="text-xs text-gray-400">
            Analyzed
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="font-medium">
            {totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(1)}K` : totalFollowers || '—'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-emerald-600">{avgEngagement || 0}%</span>
        </div>
        {competitor.social_accounts?.length > 0 && (
          <span className="text-gray-400">{competitor.social_accounts.length} platforms</span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex-1 gap-1"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Analyze
        </Button>
        <Button
          size="sm"
          onClick={onView}
          className="flex-1 gap-1 bg-violet-600 hover:bg-violet-700"
        >
          <Eye className="w-3 h-3" />
          View
        </Button>
      </div>
    </Card>
  );
}