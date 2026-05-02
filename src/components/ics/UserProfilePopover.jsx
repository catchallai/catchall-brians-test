import { useState, useEffect } from 'react';
import { X, MessageSquare, Video, Hash } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const STATUS_COLORS = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  busy: 'bg-red-500',
  offline: 'bg-slate-300',
};

export default function UserProfilePopover({ userEmail, userName, allChannels = [], currentUser, onClose, onDirectMessage }) {
  const [profile, setProfile] = useState(null);
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.User.filter({ email: userEmail }).then((res) => {
      if (res.length > 0) setProfile(res[0]);
    });
    base44.entities.Presence.filter({ user_email: userEmail }).then((res) => {
      if (res.length > 0) setPresence(res[0]);
    });
  }, [userEmail]);

  const sharedChannels = allChannels.filter(
    (c) => c.type !== 'dm' && c.members?.includes(userEmail) && c.members?.includes(currentUser?.email)
  );

  const statusKey = presence?.status || 'offline';
  const displayName = profile?.full_name || userName || userEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="h-20 bg-gradient-to-br from-violet-500 to-violet-700" />

        {/* Avatar */}
        <div className="px-5 pb-4 -mt-10">
          <div className="flex items-end justify-between mb-3">
            <div className="relative">
              <Avatar className="w-16 h-16 border-4 border-white shadow">
                <AvatarFallback className="bg-violet-600 text-white text-xl font-bold">
                  {displayName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${STATUS_COLORS[statusKey]}`} />
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          <h3 className="font-bold text-slate-900 text-lg leading-tight">{displayName}</h3>
          <p className="text-sm text-slate-400">{userEmail}</p>
          <span className="inline-block mt-1 text-xs font-medium capitalize text-slate-500">
            {statusKey}
            {presence?.status_message ? ` · ${presence.status_message}` : ''}
          </span>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs"
              onClick={() => { onDirectMessage?.(); onClose(); }}
            >
              <MessageSquare size={14} className="mr-1" />
              Message
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <Video size={14} className="mr-1" />
              Call
            </Button>
          </div>

          {/* Shared Channels */}
          {sharedChannels.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {sharedChannels.length} shared channel{sharedChannels.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {sharedChannels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2 text-sm text-slate-700 py-1 px-2 rounded-lg hover:bg-slate-50">
                    <Hash size={13} className="text-slate-400" />
                    <span>{ch.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}