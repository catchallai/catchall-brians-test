import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ExternalLink, RefreshCw, Loader2 } from "lucide-react";

export default function CompetitorCard({ competitor, onAnalyze, isAnalyzing, onClick }) {
  const totalFollowers = competitor.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
  const avgEngagement = competitor.social_accounts?.length > 0
    ? (competitor.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / competitor.social_accounts.length).toFixed(1)
    : 0;

  return (
    <Card 
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
          {competitor.website && (
            <a 
              href={competitor.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-violet-600 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {competitor.website.replace(/https?:\/\//, '')}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
          disabled={isAnalyzing}
          className="gap-1"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Analyze
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">
            {totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(1)}K` : totalFollowers}
          </p>
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <TrendingUp className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-600">{avgEngagement}%</p>
          <p className="text-xs text-gray-500">Engagement</p>
        </div>
      </div>

      {competitor.social_accounts?.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {competitor.social_accounts.map((acc, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              @{acc.handle}
            </Badge>
          ))}
        </div>
      )}

      {competitor.strengths?.length > 0 && (
        <div className="text-xs text-gray-500">
          <span className="text-emerald-600 font-medium">Strengths:</span> {competitor.strengths.slice(0, 2).join(', ')}
        </div>
      )}
    </Card>
  );
}