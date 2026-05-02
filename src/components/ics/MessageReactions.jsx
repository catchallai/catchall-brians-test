import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Smile } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '✅', '🙌'];

export default function MessageReactions({ message, currentUser, channelId }) {
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();

  const reactions = message.reactions || {};

  const toggleReaction = async (emoji) => {
    const current = reactions[emoji] || [];
    const hasReacted = current.includes(currentUser.email);
    const updated = hasReacted
      ? current.filter((e) => e !== currentUser.email)
      : [...current, currentUser.email];

    const newReactions = { ...reactions, [emoji]: updated };
    // Remove empty
    if (newReactions[emoji].length === 0) delete newReactions[emoji];

    await base44.entities.Message.update(message.id, { reactions: newReactions });
    queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    setShowPicker(false);
  };

  return (
    <div className="relative flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {Object.entries(reactions).map(([emoji, users]) =>
        users.length > 0 ? (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
              users.includes(currentUser.email)
                ? 'bg-violet-100 border-violet-300 text-violet-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{emoji}</span>
            <span className="font-medium">{users.length}</span>
          </button>
        ) : null
      )}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Smile className="w-4 h-4" />
        </button>
        {showPicker && (
          <div className="absolute bottom-8 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 flex gap-1 flex-wrap w-52">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}