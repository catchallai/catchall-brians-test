import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Archive, RotateCcw, Hash, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ArchivedList({ channels, onSelectChannel }) {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const filteredChannels = useMemo(() => {
    if (!searchTerm.trim()) return channels;
    const term = searchTerm.toLowerCase();
    return channels.filter(
      (c) => c.name?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term)
    );
  }, [channels, searchTerm]);

  const unarchiveMutation = useMutation({
    mutationFn: (channelId) => base44.entities.Channel.update(channelId, { is_archived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['archived-channels'] });
    },
  });

  return (
    <div className="w-96 border-r bg-white border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Archive className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-slate-900">Archived</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search archived..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChannels.length === 0 ? (
            <div className="p-6 text-center">
              <Archive className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">No archived channels</p>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <div
                key={channel.id}
                className="p-3 rounded-lg group transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-slate-200">
                      <div className="flex items-center justify-center">
                        {channel.type === 'private' ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Hash className="w-5 h-5" />
                        )}
                      </div>
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectChannel(channel)}>
                    <div className="font-medium text-sm text-slate-900">{channel.name}</div>
                    {channel.description && (
                      <p className="text-xs truncate text-slate-500">{channel.description}</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => unarchiveMutation.mutate(channel.id)}
                    disabled={unarchiveMutation.isPending}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 text-center text-xs border-t border-slate-200 text-slate-500">
        {filteredChannels.length} archived
      </div>
    </div>
  );
}