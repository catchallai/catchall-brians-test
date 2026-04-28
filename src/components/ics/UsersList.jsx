import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare } from 'lucide-react';
import PresenceIndicator from './PresenceIndicator';

export default function UsersList({ users, allPresence, darkMode, currentUser, onViewProfile }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div
      className={`w-80 border-r ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: darkMode ? '#1e293b' : '#f0f0f0' }}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Contacts
        </h2>
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200'}`}
          />
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <div
              className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => {
              const presence = allPresence[user.email];
              const isCurrentUser = user.email === currentUser?.email;

              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    darkMode
                      ? 'hover:bg-slate-800 active:bg-slate-700'
                      : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <div
                    className="flex items-start gap-3 flex-1 cursor-pointer"
                    onClick={() => onViewProfile?.(user)}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback
                          className={`${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`}
                        >
                          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <PresenceIndicator presence={presence} size="sm" showLabel={false} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {user.full_name || 'User'}{' '}
                        {isCurrentUser && (
                          <span
                            className={`text-xs ml-1 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}
                          >
                            (You)
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {user.email}
                      </div>
                      {presence?.custom_status && (
                        <div
                          className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {presence.status_emoji} {presence.custom_status}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                      onClick={() => onViewProfile?.(user)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Users Count */}
      <div
        className={`p-3 text-center text-xs border-t ${darkMode ? 'border-slate-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}
      >
        {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
