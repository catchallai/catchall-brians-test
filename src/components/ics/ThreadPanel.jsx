import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, Send } from 'lucide-react';

export default function ThreadPanel({ parentMessage, user, onClose }) {
  const [reply, setReply] = useState('');
  const endRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: replies = [] } = useQuery({
    queryKey: ['thread', parentMessage?.id],
    queryFn: () =>
      base44.entities.Message.filter({ thread_parent_id: parentMessage.id }),
    enabled: !!parentMessage?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const sendReply = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', parentMessage.id] });
      setReply('');
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    sendReply.mutate({
      channel_id: parentMessage.channel_id,
      thread_parent_id: parentMessage.id,
      content: reply,
      sender_email: user.email,
      sender_name: user.full_name,
    });
  };

  if (!parentMessage) return null;

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Thread</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Parent message */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-start gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-violet-600 text-white text-xs">
              {parentMessage.sender_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-semibold text-slate-700">{parentMessage.sender_name}</p>
            <p className="text-sm text-slate-700 mt-0.5">{parentMessage.content}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {replies.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No replies yet. Start the thread!
              </p>
            )}
            {replies.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className={`text-white text-xs ${msg.sender_email === user.email ? 'bg-violet-600' : 'bg-slate-500'}`}>
                    {msg.sender_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xs font-semibold text-slate-700">{msg.sender_name}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 mt-0.5">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="p-3 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply in thread..."
              className="flex-1 text-sm px-3 py-2 bg-slate-100 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-violet-400 transition-all"
            />
            <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700 px-3" disabled={!reply.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}