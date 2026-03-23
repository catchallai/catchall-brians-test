import { useState } from 'react';
import { Search, Plus, Hash, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ConversationsList({
  channels,
  selectedChannelId,
  onSelectChannel,
  onNewChat,
  darkMode,
  allPresence,
  typingByChannel = {},
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ConversationItem = ({ channel }) => {
    const isSelected = selectedChannelId === channel.id;
    const channelPresence =
      channel.members?.map((email) => allPresence[email]).filter(Boolean) || [];
    const typingUsers = typingByChannel[channel.id] || [];

    return (
      <button
        onClick={() => onSelectChannel(channel)}
        className={`w-full p-3 flex items-start gap-3 transition-colors ${
          isSelected
            ? darkMode
              ? 'bg-slate-800'
              : 'bg-violet-50'
            : darkMode
              ? 'hover:bg-slate-800/50'
              : 'hover:bg-slate-50'
        }`}
      >
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
              {channel.name.split(' ')[0][0]}
            </AvatarFallback>
          </Avatar>
          {channel.members && channelPresence.length > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-medium truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}
              >
                {channel.name}
              </span>
              {channel.type === 'public' ? (
                <Hash size={12} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />
              ) : (
                <Lock size={12} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />
              )}
            </div>
            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {new Date(channel.last_activity || new Date()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p
            className={`text-sm truncate mt-1 ${
              typingUsers.length > 0
                ? 'text-violet-400 font-medium'
                : darkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
            }`}
          >
            {typingUsers.length > 0
              ? `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? '...' : ''} typing`
              : channel.description || 'No messages yet'}
          </p>

          {channel.members && (
            <span
              className={`text-xs mt-1 inline-block ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}
            >
              {channelPresence.length} online
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div
      className={`w-80 flex-shrink-0 ${
        darkMode ? 'bg-slate-900' : 'bg-white'
      } flex flex-col border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-slate-800/50' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Messages
          </h1>
          <Button
            onClick={onNewChat}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/30"
            size="icon"
          >
            <Plus size={18} />
          </Button>
        </div>

        {/* Search */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
            darkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          <Search size={18} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent flex-1 outline-none text-sm ${
              darkMode
                ? 'text-white placeholder:text-slate-500'
                : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {['all', 'direct', 'groups', 'unread'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {filteredChannels.length > 0 ? (
          <div>
            {filteredChannels.map((channel) => (
              <ConversationItem key={channel.id} channel={channel} />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              No channels found
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Connection Status */}
      <div
        className={`p-3 border-t ${
          darkMode ? 'border-slate-800' : 'border-slate-200'
        } flex items-center justify-center gap-2`}
      >
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Connected • Encrypted
        </span>
      </div>
    </div>
  );
}
