import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function NotificationsView({ user }) {
  return (
    <div className="w-full h-full bg-slate-50 flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-violet-600" />
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
        </div>
        <p className="text-sm mt-2 text-slate-500">
          Stay updated with messages, mentions, and activity
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <NotificationCenter user={user} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}