import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ChatBubble() {
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!user?.email) {
      return;
    }

    // Subscribe to new messages
    const unsubscribe = base44.entities.Message?.subscribe?.((event) => {
      // Only count messages NOT created by current user
      if (event.type === 'create' && event.data?.created_by !== user.email) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => unsubscribe?.();
  }, [user?.email]);

  const handleClick = () => {
    setUnreadCount(0);
  };

  return (
    <Link to={createPageUrl('ICS')} onClick={handleClick}>
      <button className="fixed bottom-6 right-6 z-40 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group">
        <MessageCircle className="w-6 h-6 lg:w-7 lg:h-7" />

        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center border-2 border-white dark:border-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
      </button>
    </Link>
  );
}
