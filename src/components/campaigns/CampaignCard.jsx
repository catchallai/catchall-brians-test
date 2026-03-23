import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, Users, Target } from 'lucide-react';
import { format } from 'date-fns';

const typeIcons = {
  email: '📧',
  social_media: '📱',
  ppc: '💰',
  content: '📝',
  seo: '🔍',
  event: '🎪',
  referral: '🤝',
  other: '📌',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
};

const typeColors = {
  email: 'bg-violet-100 text-violet-700',
  social_media: 'bg-pink-100 text-pink-700',
  ppc: 'bg-amber-100 text-amber-700',
  content: 'bg-blue-100 text-blue-700',
  seo: 'bg-emerald-100 text-emerald-700',
  event: 'bg-orange-100 text-orange-700',
  referral: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function CampaignCard({ campaign, leadsCount, dealsCount, revenue, onClick }) {
  const budgetProgress = campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0;
  const leadsProgress = campaign.target_leads > 0 ? (leadsCount / campaign.target_leads) * 100 : 0;

  const formatCurrency = (value) => {
    if (!value) {
      return '$0';
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card
      className="p-5 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[campaign.type]}</span>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
              {campaign.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${typeColors[campaign.type]} text-xs border-0`}>
                {campaign.type?.replace('_', ' ')}
              </Badge>
              <Badge className={`${statusColors[campaign.status]} text-xs border`}>
                {campaign.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{leadsCount}</p>
          <p className="text-xs text-gray-500">Leads</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <Target className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{dealsCount}</p>
          <p className="text-xs text-gray-500">Deals</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(revenue)}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
      </div>

      {/* Budget Progress */}
      {campaign.budget > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Budget Used</span>
            <span>
              {formatCurrency(campaign.spent || 0)} / {formatCurrency(campaign.budget)}
            </span>
          </div>
          <Progress value={budgetProgress} className="h-1.5" />
        </div>
      )}

      {/* Leads Progress */}
      {campaign.target_leads > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Leads Target</span>
            <span>
              {leadsCount} / {campaign.target_leads}
            </span>
          </div>
          <Progress value={Math.min(leadsProgress, 100)} className="h-1.5" />
        </div>
      )}

      {/* Date Range */}
      {(campaign.start_date || campaign.end_date) && (
        <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <Calendar className="w-3 h-3" />
          <span>
            {campaign.start_date && format(new Date(campaign.start_date), 'MMM d')}
            {campaign.start_date && campaign.end_date && ' - '}
            {campaign.end_date && format(new Date(campaign.end_date), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </Card>
  );
}
