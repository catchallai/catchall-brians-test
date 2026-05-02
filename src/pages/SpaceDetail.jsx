import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, FileText, Clock, Eye, Trash2, Edit, Folder } from 'lucide-react';
import { createPageUrl } from '@/utils';
import FolderTree from '@/components/wiki/FolderTree';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function SpaceDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const spaceId = searchParams.get('id');

  const [searchTerm, setSearchTerm] = useState('');
  const [deletePageId, setDeletePageId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tree'

  const { data: space } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: async () => {
      const spaces = await base44.entities.Space.list();
      return spaces.find((s) => s.id === spaceId) || null;
    },
    enabled: !!spaceId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['space-pages', spaceId],
    queryFn: async () => {
      if (!spaceId) return [];
      const allPages = await base44.entities.WikiPage.list();
      return allPages.filter((p) => p.space_id === spaceId);
    },
    enabled: !!spaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (pageId) => base44.entities.WikiPage.delete(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-pages', spaceId] });
      setDeletePageId(null);
    },
  });

  const filteredPages = pages.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ai_summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colorClasses = {
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500',
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!space) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading space...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Spaces'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${colorClasses[space.color]} flex items-center justify-center text-xl`}>
              {space.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{space.name}</h1>
              <p className="text-gray-500 text-sm">{space.description}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}`)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Page
        </Button>
      </div>

      {/* Search and View Mode */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 ml-auto">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            <Folder className="w-4 h-4 mr-2" />
            Tree View
          </Button>
        </div>
      </div>

      {/* Pages Display */}
      {pages.length === 0 ? (
        <Card className="p-12 text-center glass-card">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
          <p className="text-gray-500 mb-4">Create your first page to start documenting</p>
          <Button onClick={() => navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}`)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Page
          </Button>
        </Card>
      ) : viewMode === 'tree' ? (
        <Card className="p-6 glass-card">
          <FolderTree pages={filteredPages} spaceId={spaceId} />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPages.map((page) => (
            <Card
              key={page.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer group glass-card"
              onClick={() => navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${page.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-violet-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold group-hover:text-violet-600 transition-colors">
                        {page.title}
                      </h3>
                      {page.ai_summary && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {page.ai_summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {page.last_viewed_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(page.last_viewed_at)}
                      </span>
                    )}
                    {page.view_count && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {page.view_count} views
                      </span>
                    )}
                    {page.status === 'draft' && (
                      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded text-xs">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${page.id}`);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePageId(page.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePageId}
        onClose={() => setDeletePageId(null)}
        onConfirm={() => deleteMutation.mutate(deletePageId)}
        title="Delete Page"
        description="This will permanently delete this page and all its versions."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}