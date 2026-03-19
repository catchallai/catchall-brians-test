import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Pencil,
  Sparkles,
  Loader2,
} from 'lucide-react';

const platformConfig = {
  twitter: { color: 'bg-gray-900 text-white', icon: '𝕏' },
  linkedin: { color: 'bg-blue-600 text-white', icon: 'in' },
  facebook: { color: 'bg-blue-500 text-white', icon: 'f' },
  instagram: {
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white',
    icon: 'IG',
  },
  youtube: { color: 'bg-red-600 text-white', icon: '▶' },
};

export default function SocialAccountCard({
  account,
  postsCount,
  onClick,
  onEdit,
  onAnalyze,
  isAnalyzing,
}) {
  const config = platformConfig[account.platform] || platformConfig.twitter;

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-lg font-bold`}
        >
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">@{account.account_name}</h4>
              <Badge className={`${config.color} text-xs mt-1 border-0`}>{account.platform}</Badge>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(account);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onAnalyze && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnalyze(account);
                  }}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              )}
              {account.account_url && (
                <a
                  href={account.account_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Users className="w-3 h-3 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-900">
                {formatNumber(account.followers_count)}
              </p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <MessageSquare className="w-3 h-3 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-900">
                {account.posts_count || postsCount || 0}
              </p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <TrendingUp className="w-3 h-3 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-emerald-600">
                {account.engagement_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500">Engage</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
