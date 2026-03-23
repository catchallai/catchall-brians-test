import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, ExternalLink, RefreshCw, Loader2, Eye, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CompetitorCard({
  competitor,
  onAnalyze,
  isAnalyzing,
  onView,
  onUpdateTier,
}) {
  const totalFollowers =
    competitor.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
  const avgEngagement =
    competitor.social_accounts?.length > 0
      ? (
          competitor.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) /
          competitor.social_accounts.length
        ).toFixed(1)
      : 0;

  const tierColors = {
    tier_1:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    tier_2:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    tier_3:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  const tierLabels = {
    tier_1: 'Tier 1',
    tier_2: 'Tier 2',
    tier_3: 'Tier 3',
  };

  return (
    <Card className="p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {competitor.logo_url && (
            <img
              src={competitor.logo_url}
              alt={`${competitor.name} logo`}
              className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-gray-700 p-1 border border-gray-200 dark:border-gray-600"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">{competitor.name}</h4>
              {competitor.tier ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${tierColors[competitor.tier]}`}
                    >
                      <Shield className="w-3 h-3" />
                      {tierLabels[competitor.tier]}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_1');
                      }}
                    >
                      Tier 1 - Direct Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_2');
                      }}
                    >
                      Tier 2 - Indirect Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_3');
                      }}
                    >
                      Tier 3 - Potential Threat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors">
                      <Shield className="w-3 h-3" />
                      Set Tier
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_1');
                      }}
                    >
                      Tier 1 - Direct Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_2');
                      }}
                    >
                      Tier 2 - Indirect Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_3');
                      }}
                    >
                      Tier 3 - Potential Threat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
            {totalFollowers >= 1000
              ? `${(totalFollowers / 1000).toFixed(1)}K`
              : totalFollowers || '—'}
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
