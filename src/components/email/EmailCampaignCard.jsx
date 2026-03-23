import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, MousePointer, Eye } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export default function EmailCampaignCard({ emailCampaign, template, onClick }) {
  const openRate =
    emailCampaign.total_sent > 0
      ? ((emailCampaign.total_opened || 0) / emailCampaign.total_sent) * 100
      : 0;
  const clickRate =
    emailCampaign.total_opened > 0
      ? ((emailCampaign.total_clicked || 0) / emailCampaign.total_opened) * 100
      : 0;

  return (
    <Card
      className="p-5 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
            {emailCampaign.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{template?.name || 'No template'}</p>
        </div>
        <Badge className={`${statusColors[emailCampaign.status]} border-0`}>
          {emailCampaign.status}
        </Badge>
      </div>

      {emailCampaign.status === 'sent' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{emailCampaign.total_sent || 0}</p>
              <p className="text-xs text-gray-500">Sent</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-600">{openRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Opened</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <MousePointer className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{clickRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Clicked</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Open Rate</span>
              <span>
                {emailCampaign.total_opened || 0} / {emailCampaign.total_sent || 0}
              </span>
            </div>
            <Progress value={openRate} className="h-1.5" />
          </div>
        </>
      )}

      {emailCampaign.status === 'draft' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{emailCampaign.contact_ids?.length || 0} recipients selected</span>
        </div>
      )}

      {emailCampaign.sent_date && (
        <p className="text-xs text-gray-400 mt-3">
          Sent {format(new Date(emailCampaign.sent_date), 'MMM d, yyyy h:mm a')}
        </p>
      )}
    </Card>
  );
}
