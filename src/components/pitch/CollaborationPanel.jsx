import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit } from 'lucide-react';

export default function CollaborationPanel({ collaborators = [], currentUser }) {
  // Simulated real-time collaboration
  const activeUsers = collaborators.filter((c) => c.status === 'active');

  return (
    <Card className="p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600" />
          Collaborators
        </h3>
        <Badge variant="outline" className="text-xs">
          {activeUsers.length} online
        </Badge>
      </div>

      <div className="space-y-2">
        {/* Current User */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-violet-600 text-white text-xs">
              {currentUser?.full_name?.[0] || 'Y'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">You</p>
            <p className="text-xs text-gray-500">Editing</p>
          </div>
          <Edit className="w-3 h-3 text-violet-600" />
        </div>

        {/* Other Collaborators */}
        {collaborators.map((collab, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                {collab.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {collab.name}
              </p>
              <p className="text-xs text-gray-500">
                {collab.status === 'active' ? 'Viewing' : 'Offline'}
              </p>
            </div>
            {collab.status === 'active' && <Eye className="w-3 h-3 text-gray-400" />}
          </div>
        ))}

        {collaborators.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">No other collaborators yet</p>
        )}
      </div>

      <button className="w-full mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium">
        + Invite collaborators
      </button>
    </Card>
  );
}
