import {
  MessageSquare,
  Users,
  Bell,
  Archive,
  Settings,
  Sun,
  Moon,
  Shield,
  User,
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
  notificationButton,
  onAccountClick,
}) {
  const NavButton = ({ icon: Icon, active, onClick, tooltip, badge }) => (
    <button
      onClick={onClick}
      className={`relative p-2.5 rounded-xl transition-all group ${
        active
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
          : darkMode
            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
      }`}
    >
      <Icon size={20} />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full text-xs text-white flex items-center justify-center font-medium">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <span
        className={`absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
          darkMode ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
        }`}
      >
        {tooltip}
      </span>
    </button>
  );

  return (
    <div
      className={`w-16 flex-shrink-0 ${
        darkMode ? 'bg-slate-950' : 'bg-slate-100'
      } flex flex-col items-center py-4 border-r ${
        darkMode ? 'border-slate-800' : 'border-slate-200'
      }`}
    >
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/30">
          <span className="text-white font-bold text-sm">SJ</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        <NavButton
          icon={MessageSquare}
          active={activeView === 'chat'}
          onClick={() => onViewChange('chat')}
          tooltip="Messages"
        />
        <NavButton
          icon={Users}
          active={activeView === 'contacts'}
          onClick={() => onViewChange('contacts')}
          tooltip="Contacts"
        />
        <NavButton
          icon={Bell}
          active={activeView === 'notifications'}
          onClick={() => onViewChange('notifications')}
          tooltip="Notifications"
          badge={unreadCount}
        />
        <NavButton
          icon={Archive}
          active={activeView === 'archived'}
          onClick={() => onViewChange('archived')}
          tooltip="Archived"
        />
        {user?.role === 'admin' && (
          <NavButton
            icon={Shield}
            active={activeView === 'admin'}
            onClick={() => onViewChange('admin')}
            tooltip="Admin"
          />
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onThemeToggle}
          className={`p-2.5 rounded-xl transition-all ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {notificationButton}
        <button
          onClick={onSettingsClick}
          className={`p-2.5 rounded-xl transition-all ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Settings size={20} />
        </button>
        <button
          onClick={onAccountClick}
          className={`p-2.5 rounded-xl transition-all ${
            activeView === 'account'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <User size={20} />
        </button>
        <div className="mt-2 cursor-pointer" onClick={onAccountClick}>
          <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-violet-700 text-white text-xs font-bold">
              {user?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
