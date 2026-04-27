import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GoogleCalendarCallback() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Connecting your Google Calendar...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authorization was denied or cancelled');
        setTimeout(() => navigate(createPageUrl('Settings')), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => navigate(createPageUrl('Settings')), 3000);
        return;
      }

      try {
        const response = await base44.functions.invoke('googleCalendarAuth', {
          action: 'callback',
          code,
          state,
        });

        if (response.data.success) {
          setStatus('success');
          setMessage(`Successfully connected Google Calendar: ${response.data.email}`);
          setTimeout(() => navigate(createPageUrl('MeetingScheduler')), 2000);
        } else {
          throw new Error('Connection failed');
        }
      } catch (_err) {
        setStatus('error');
        setMessage('Failed to connect Google Calendar');
        setTimeout(() => navigate(createPageUrl('Settings')), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connecting...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Success!</h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Redirecting to Meeting Scheduler...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">Redirecting...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
