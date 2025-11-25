import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Share2, ExternalLink, Users } from "lucide-react";

const platformConfig = {
  twitter: { color: "bg-sky-100 text-sky-700", icon: "𝕏" },
  linkedin: { color: "bg-blue-100 text-blue-700", icon: "in" },
  facebook: { color: "bg-indigo-100 text-indigo-700", icon: "f" },
  instagram: { color: "bg-pink-100 text-pink-700", icon: "📷" },
  youtube: { color: "bg-red-100 text-red-700", icon: "▶" },
};

const sentimentConfig = {
  positive: { color: "bg-emerald-100 text-emerald-700" },
  neutral: { color: "bg-gray-100 text-gray-700" },
  negative: { color: "bg-red-100 text-red-700" },
};

export default function ListeningMentionCard({ mention }) {
  const platform = platformConfig[mention.platform] || platformConfig.twitter;
  const sentiment = sentimentConfig[mention.sentiment] || sentimentConfig.neutral;

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-lg font-bold flex-shrink-0`}>
          {platform.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">@{mention.author || 'unknown'}</span>
              {mention.author_followers > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatNumber(mention.author_followers)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${sentiment.color} border-0 text-xs`}>
                {mention.sentiment}
              </Badge>
              {mention.post_url && (
                <a 
                  href={mention.post_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-700 mb-2 line-clamp-3">{mention.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" /> {formatNumber(mention.likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> {formatNumber(mention.comments)}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4" /> {formatNumber(mention.shares)}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {mention.post_date && new Date(mention.post_date).toLocaleDateString()}
            </span>
          </div>

          {mention.influence_score > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Influence:</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${mention.influence_score}%` }}
                />
              </div>
              <span className="text-xs font-medium text-violet-600">{mention.influence_score}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}