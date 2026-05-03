import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import FolderApprovalsManager from './FolderApprovalsManager';

/**
 * FolderDetail
 * Displays detailed view of a project media folder
 * - Shows folder metadata
 * - Displays and manages approval workflows
 * - Lists items in the folder
 */

export default function FolderDetail({ folder, onClose }) {
  if (!folder) return null;

  const folderTypeColors = {
    drafts: 'bg-amber-100 text-amber-800',
    assets: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    final: 'bg-purple-100 text-purple-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge className={folderTypeColors[folder.folder_type]}>
                {folder.folder_type}
              </Badge>
              {folder.name}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">{folder.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Folder Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Created By
              </p>
              <p className="text-sm mt-1">{folder.created_by || 'System'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Created Date
              </p>
              <p className="text-sm mt-1">
                {new Date(folder.created_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Folder Type
            </p>
            <Badge className={folderTypeColors[folder.folder_type]}>
              {folder.folder_type}
            </Badge>
          </div>

          {folder.description && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Description
              </p>
              <p className="text-sm text-gray-700">{folder.description}</p>
            </div>
          )}

          {/* Approval Workflow */}
          <div className="border-t pt-4">
            <FolderApprovalsManager folder={folder} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}