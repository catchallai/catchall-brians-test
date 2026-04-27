import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Clock, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function WaitingRoomPanel({ waitingUsers, onAdmitUser, onRejectUser, onAdmitAll }) {
  if (!waitingUsers || waitingUsers.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Waiting Room ({waitingUsers.length})
        </h3>
        <Button size="sm" onClick={onAdmitAll} className="bg-green-600 hover:bg-green-700">
          Admit All
        </Button>
      </div>
      <div className="space-y-2">
        {waitingUsers.map((user, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-100 dark:border-yellow-800"
          >
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100">
                  {user.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(user.requested_at), 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => onAdmitUser(user.email, user.name)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onRejectUser(user.email)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
