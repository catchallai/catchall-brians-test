import {
  MessageSquare,
  Users,
  Bell,
  Archive,
  Settings,
  Sun,
  Moon,
  Shield,
  Video,
  Hash,
  Plus,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Sidebar({
  activeView,
  onViewChange,
  darkMode,
  onThemeToggle,
  onSettingsClick,
  user,
  unreadCount = 0,
  onNewChannel,
}) {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Messages' },
    { id: 'contacts', icon: Users, label: 'People' },
    { id: 'meetings', icon: Video, label: 'Meetings' },
    { id: 'browse', icon: Hash, label: 'Channels' },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { id: 'archived', icon: Archive, label: 'Archived' },
    ...(user?.role === 'admin' ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <div
      className={`h-14 flex-shrink-0 flex items-center justify-between px-4 border-b ${
        darkMode
          ? 'bg-slate-950 border-slate-800'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center shadow mr-3 flex-shrink-0">
          <MessageSquare size={16} className="text-white" />
        </div>

        {/* Nav items */}
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === id
                ? 'bg-violet-600 text-white shadow-sm'
                : darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            {badge > 0 && (
              <span className="w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium leading-none">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right: Actions + Avatar */}
      <div className="flex items-center gap-1">
        <button
          onClick={onNewChannel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="New Channel"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New</span>
        </button>

        <button
          onClick={onThemeToggle}
          className={`p-2 rounded-lg transition-all ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={onSettingsClick}
          className={`p-2 rounded-lg transition-all ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings size={16} />
        </button>

        <button onClick={() => onViewChange('account')}>
          <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity cursor-pointer">
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-violet-700 text-white text-xs font-bold">
              {user?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  );
}