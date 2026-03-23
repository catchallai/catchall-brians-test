import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, MessageSquare, CheckCircle, Clock, Link2 } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-700', icon: Mail },
  scheduled: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  sent: { color: 'bg-amber-100 text-amber-700', icon: Mail },
  opened: { color: 'bg-violet-100 text-violet-700', icon: Eye },
  replied: { color: 'bg-emerald-100 text-emerald-700', icon: MessageSquare },
  published: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function OutreachCampaignCard({ campaign, journalist, linkedMention }) {
  const status = statusConfig[campaign.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{campaign.subject}</h4>
              <Badge className={`${status.color} gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {campaign.status}
              </Badge>
              {campaign.ai_generated && (
                <Badge variant="outline" className="text-xs">
                  AI
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              To: {journalist?.name || 'Unknown'} at {journalist?.outlet || 'Unknown outlet'}
            </p>
            {campaign.sent_date && (
              <p className="text-xs text-gray-400 mt-1">
                Sent {format(new Date(campaign.sent_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          {linkedMention && (
            <Badge className="bg-pink-100 text-pink-700 gap-1">
              <Link2 className="w-3 h-3" />
              Published
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
