import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhoneOff, Video } from 'lucide-react';

export default function IncomingCallNotification({ call, onAccept, onDecline, darkMode }) {
  if (!call) {
    return null;
  }

  const caller = call.participants?.find((p) => p.email === call.started_by);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } border rounded-2xl shadow-2xl p-6 w-96`}
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-violet-700 text-white text-2xl font-semibold">
            {caller?.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {caller?.name || 'Unknown User'}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Calling...</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onDecline} variant="destructive" className="flex-1 gap-2">
          <PhoneOff className="w-4 h-4" />
          Decline
        </Button>
        <Button
          onClick={() => onAccept('video')}
          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
        >
          <Video className="w-4 h-4" />
          Accept
        </Button>
      </div>
    </div>
  );
}
