import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function NotificationsView({ user, darkMode }) {
  return (
    <div className={`w-full h-full ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col`}>
      {/* Header */}
      <div
        className={`p-6 border-b ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}
      >
        <div className="flex items-center gap-3">
          <Bell className={`w-6 h-6 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Notifications
          </h2>
        </div>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Stay updated with messages, mentions, and activity
        </p>
      </div>

      {/* Content */}
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
