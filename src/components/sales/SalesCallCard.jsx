import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';

const callTypeIcons = {
  outbound: PhoneOutgoing,
  inbound: PhoneIncoming,
  missed: PhoneMissed,
};

const callTypeColors = {
  outbound: 'text-blue-500',
  inbound: 'text-emerald-500',
  missed: 'text-red-500',
};

const statusColors = {
  completed: 'bg-emerald-100 text-emerald-700',
  no_answer: 'bg-amber-100 text-amber-700',
  voicemail: 'bg-blue-100 text-blue-700',
  busy: 'bg-red-100 text-red-700',
  scheduled: 'bg-violet-100 text-violet-700',
};

const sentimentIcons = {
  positive: ThumbsUp,
  neutral: Minus,
  negative: ThumbsDown,
};

const sentimentColors = {
  positive: 'text-emerald-500',
  neutral: 'text-gray-500',
  negative: 'text-red-500',
};

export default function SalesCallCard({ call, contactName, dealName, onEdit }) {
  const CallTypeIcon = callTypeIcons[call.call_type];
  const SentimentIcon = sentimentIcons[call.sentiment];

  return (
    <Card className="glass-card hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CallTypeIcon className={`w-5 h-5 ${callTypeColors[call.call_type]}`} />
            <div>
              <p className="font-medium text-gray-900">{contactName}</p>
              {dealName && <p className="text-xs text-gray-500">{dealName}</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${statusColors[call.call_status]} border-0 text-xs`}>
            {call.call_status.replace('_', ' ')}
          </Badge>
          {call.sentiment && (
            <SentimentIcon className={`w-4 h-4 ${sentimentColors[call.sentiment]}`} />
          )}
        </div>

        {call.notes && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{call.notes}</p>}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {call.duration_minutes ? `${call.duration_minutes} min` : 'No duration'}
          </div>
          <span>{format(new Date(call.call_date), 'MMM d, h:mm a')}</span>
        </div>

        {call.next_action && (
          <div className="mt-3 p-2 bg-violet-50 rounded text-xs">
            <p className="text-violet-700 font-medium">Next: {call.next_action}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
