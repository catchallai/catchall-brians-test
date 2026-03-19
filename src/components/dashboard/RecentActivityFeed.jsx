import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Target,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const activityIcons = {
  contact_created: { icon: UserPlus, color: 'text-blue-500 bg-blue-50' },
  deal_created: { icon: Target, color: 'text-violet-500 bg-violet-50' },
  deal_won: { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
  deal_lost: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
  email_sent: { icon: Mail, color: 'text-amber-500 bg-amber-50' },
  call_made: { icon: Phone, color: 'text-cyan-500 bg-cyan-50' },
  ranking_up: { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
  ranking_down: { icon: TrendingDown, color: 'text-red-500 bg-red-50' },
  mention: { icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
};

export default function RecentActivityFeed({
  activities = [],
  contacts = [],
  deals = [],
  mentions = [],
}) {
  // Generate activity items from real data
  const generateActivities = () => {
    const items = [];

    // Recent contacts
    contacts.slice(0, 3).forEach((c) => {
      items.push({
        type: 'contact_created',
        title: `New contact added`,
        description: `${c.first_name || 'Contact'} ${c.last_name || ''} from ${c.company_id ? 'a company' : c.source || 'unknown source'}`,
        date: c.created_date,
      });
    });

    // Recent deals
    deals.slice(0, 3).forEach((d) => {
      items.push({
        type: d.stage === 'won' ? 'deal_won' : d.stage === 'lost' ? 'deal_lost' : 'deal_created',
        title:
          d.stage === 'won' ? 'Deal won!' : d.stage === 'lost' ? 'Deal lost' : 'New deal created',
        description: `${d.title || 'Deal'} - $${d.value?.toLocaleString() || 0}`,
        date: d.created_date,
      });
    });

    // Recent mentions
    mentions.slice(0, 2).forEach((m) => {
      items.push({
        type: 'mention',
        title: `New ${m.platform || 'social'} mention`,
        description: (m.content || '').slice(0, 60) + '...',
        date: m.created_date,
      });
    });

    // Sort by date
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  };

  const activityItems = generateActivities();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activityItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activityItems.map((item, idx) => {
              const config = activityIcons[item.type] || activityIcons.contact_created;
              const Icon = config.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
