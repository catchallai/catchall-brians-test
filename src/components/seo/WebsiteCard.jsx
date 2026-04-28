import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ExternalLink,
  Settings,
  Sparkles,
  Loader2,
  Search,
  Link2,
  TrendingUp,
  Globe,
  Clock,
  Trash2,
} from 'lucide-react';
import SEOScoreGauge from './SEOScoreGauge';
import moment from 'moment';

export default function WebsiteCard({
  website,
  keywords,
  backlinks,
  onEdit,
  onAnalyze,
  onDelete,
  isAnalyzing,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const top10Keywords = keywords.filter(
    (k) => k.current_position && k.current_position <= 10
  ).length;

  // Normalize SEO score - handle both 0-1 and 0-100 formats
  const normalizedScore = (() => {
    const score = website.seo_score;
    if (!score) {
      return 0;
    }
    if (score > 0 && score <= 1) {
      return Math.round(score * 100);
    }
    return Math.round(score);
  })();

  const formatNumber = (num) => {
    if (!num) {
      return '-';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const metrics = [
    {
      icon: Search,
      label: 'Keywords',
      value: keywords.length,
      sub: `${top10Keywords} top 10`,
      color: 'text-violet-500',
    },
    {
      icon: Link2,
      label: 'Backlinks',
      value: backlinks.length,
      sub: `${backlinks.filter((b) => b.status === 'active').length} active`,
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      label: 'Traffic',
      value: formatNumber(website.organic_traffic),
      sub: 'monthly',
      color: 'text-emerald-500',
    },
    {
      icon: Globe,
      label: 'DA',
      value: website.domain_authority || '-',
      sub: 'authority',
      color: 'text-amber-500',
    },
  ];

  return (
    <Card className="group relative overflow-hidden border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
              {website.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{website.name}</h3>
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              >
                {website.url?.replace(/^https?:\/\//, '').slice(0, 25)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={onAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onEdit}
            >
              <Settings className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* SEO Score */}
        <div className="flex justify-center mb-5">
          <SEOScoreGauge score={normalizedScore} label="SEO Score" size="md" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              <p className="text-xs text-gray-400">{metric.sub}</p>
            </div>
          ))}
        </div>

        {/* Last audit */}
        {website.last_audit_date && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Audited {moment(website.last_audit_date).fromNow()}</span>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete?.();
          setShowDeleteConfirm(false);
        }}
        title="Delete this website?"
        description="This will also remove all associated keywords and backlinks."
        confirmLabel="Delete"
      />
    </Card>
  );
}
