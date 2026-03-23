import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function EmailTrackingPanel({ contactId }) {
  const { data: emailLogs = [], isLoading } = useQuery({
    queryKey: ['email-logs', contactId],
    queryFn: async () => {
      if (!contactId) {
        return [];
      }
      const logs = await base44.entities.EmailLog.filter(
        { contact_id: contactId },
        '-created_date',
        100
      );
      return logs;
    },
    enabled: !!contactId,
  });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'opened':
        return <CheckCircle2 className="w-4 h-4 text-violet-500" />;
      case 'clicked':
        return <ExternalLink className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'opened':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
      case 'clicked':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {emailLogs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No emails sent yet</p>
        ) : (
          <div className="space-y-3">
            {emailLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="mt-1">{getStatusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                        {log.subject || 'No subject'}
                      </p>
                      {log.message_preview && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                          {log.message_preview}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs capitalize ${getStatusColor(log.status)}`}>
                          {log.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {log.created_date &&
                            format(new Date(log.created_date), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {log.sent_at && <div>Sent: {format(new Date(log.sent_at), 'MMM d HH:mm')}</div>}
                    {log.opened_at && (
                      <div className="text-violet-600 dark:text-violet-400">
                        Opened: {format(new Date(log.opened_at), 'MMM d HH:mm')}
                      </div>
                    )}
                    {log.clicked_at && (
                      <div className="text-emerald-600 dark:text-emerald-400">
                        Link clicked: {format(new Date(log.clicked_at), 'MMM d HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
