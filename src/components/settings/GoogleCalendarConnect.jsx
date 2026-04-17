import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleCalendarConnect() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const disconnectMutation = useMutation({
    mutationFn: () =>
      base44.auth.updateMe({
        google_calendar_connected: false,
        google_calendar_email: null,
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Google Calendar has been disconnected');
    },
  });

  const handleConnect = async () => {
    try {
      const response = await base44.functions.invoke('googleCalendarAuth', { action: 'authorize' });
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (_error) {
      toast.error('Failed to start authorization');
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Google Calendar Integration
            </CardTitle>
            <CardDescription className="mt-2">
              Connect your Google Calendar to automatically sync meetings and receive calendar
              invites
            </CardDescription>
          </div>
          {user?.google_calendar_connected && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.google_calendar_connected ? (
          <>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Calendar Connected
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {user.google_calendar_email}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Your meetings will automatically sync with Google Calendar and attendees will
                    receive calendar invites.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Disconnect Calendar
            </Button>
          </>
        ) : (
          <>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Connect your calendar for better meeting management
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Automatic meeting sync to your Google Calendar</li>
                    <li>Send calendar invites to attendees</li>
                    <li>Check availability in real-time</li>
                    <li>Prevent double bookings</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleConnect} className="w-full bg-blue-600 hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Connect Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
