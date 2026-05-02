import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Hash, Users, Plus, Check, X } from 'lucide-react';

export default function ChannelBrowser({ currentUser, onSelectChannel, onClose }) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: allChannels = [] } = useQuery({
    queryKey: ['all-channels-browser'],
    queryFn: () => base44.entities.Channel.list(),
  });

  const joinMutation = useMutation({
    mutationFn: async (channel) => {
      const members = [...(channel.members || []), currentUser.email];
      return base44.entities.Channel.update(channel.id, { members });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['all-channels-browser'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (channel) => {
      const members = (channel.members || []).filter((m) => m !== currentUser.email);
      return base44.entities.Channel.update(channel.id, { members });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['all-channels-browser'] });
    },
  });

  const publicChannels = allChannels.filter(
    (c) => (c.type === 'public' || !c.type) && !c.is_archived
  );

  const filtered = publicChannels.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Browse Channels</h2>
          <p className="text-sm text-slate-500">{publicChannels.length} public channels</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="px-6 py-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filtered.map((channel) => {
            const isMember = channel.members?.includes(currentUser.email);
            const memberCount = channel.members?.length || 0;

            return (
              <div
                key={channel.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">#{channel.name}</p>
                      {isMember && (
                        <Badge className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0">Joined</Badge>
                      )}
                    </div>
                    {channel.description && (
                      <p className="text-sm text-slate-500 truncate">{channel.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                      <Users className="w-3 h-3" />
                      <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-3">
                  {isMember ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { onSelectChannel(channel); onClose(); }}
                        className="text-violet-600 border-violet-200"
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => leaveMutation.mutate(channel)}
                        className="text-slate-500 hover:text-red-500"
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => joinMutation.mutate(channel)}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Hash className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No channels found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}