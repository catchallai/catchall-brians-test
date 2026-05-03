import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, Lock, CheckCircle2 } from 'lucide-react';
import FolderDetail from './FolderDetail';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ProjectFoldersList
 * Displays all media folders for a project
 * - Auto-generated based on project type
 * - Click to view and manage approvals
 */

export default function ProjectFoldersList({ projectId }) {
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Fetch folders for this project
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['project-folders', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await base44.entities.MediaFolder.filter({
        project_id: projectId,
      }, '-created_date', 50);
    },
    enabled: !!projectId,
  });

  // Fetch approval counts for each folder
  const { data: approvalCounts = {} } = useQuery({
    queryKey: ['folder-approval-counts', projectId],
    queryFn: async () => {
      if (!projectId) return {};
      
      const counts = {};
      for (const folder of folders) {
        const approvals = await base44.entities.ApprovalRequest.filter({
          folder_id: folder.id,
        });
        counts[folder.id] = {
          total: approvals.length,
          pending: approvals.filter(a => a.status === 'pending').length,
          approved: approvals.filter(a => a.status === 'approved').length,
        };
      }
      return counts;
    },
    enabled: !!projectId && folders.length > 0,
  });

  const folderTypeIcons = {
    drafts: FolderOpen,
    assets: FolderOpen,
    approved: CheckCircle2,
    final: Lock,
    archived: Lock,
  };

  const folderTypeColors = {
    drafts: 'bg-amber-50 border-amber-200',
    assets: 'bg-blue-50 border-blue-200',
    approved: 'bg-green-50 border-green-200',
    final: 'bg-purple-50 border-purple-200',
    archived: 'bg-gray-50 border-gray-200',
  };

  const folderBadgeColors = {
    drafts: 'bg-amber-100 text-amber-800',
    assets: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    final: 'bg-purple-100 text-purple-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No folders generated for this project yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => {
          const Icon = folderTypeIcons[folder.folder_type] || FolderOpen;
          const counts = approvalCounts[folder.id] || {};

          return (
            <Button
              key={folder.id}
              variant="outline"
              onClick={() => setSelectedFolder(folder)}
              className={`h-auto p-4 justify-start border-2 ${folderTypeColors[folder.folder_type]} hover:shadow-md transition-all`}
            >
              <div className="w-full text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <Badge className={folderBadgeColors[folder.folder_type]}>
                    {folder.folder_type}
                  </Badge>
                </div>
                <p className="font-medium text-sm text-gray-900 truncate">
                  {folder.name}
                </p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {folder.description}
                </p>

                {/* Approval Status */}
                {counts.total > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {counts.pending > 0 && (
                      <Badge variant="outline" className="bg-amber-50">
                        {counts.pending} pending
                      </Badge>
                    )}
                    {counts.approved > 0 && (
                      <Badge variant="outline" className="bg-green-50">
                        {counts.approved} approved
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Folder Detail Modal */}
      {selectedFolder && (
        <FolderDetail
          folder={selectedFolder}
          onClose={() => setSelectedFolder(null)}
        />
      )}
    </>
  );
}