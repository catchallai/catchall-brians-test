import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  FileText,
  ArrowLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  List,
  BookOpen,
  GripVertical,
  Folder as FolderIcon,
  CheckSquare,
  Zap,
} from 'lucide-react';
import FolderTree from '@/components/wiki/FolderTree';
import BulkPageActions from '@/components/wiki/BulkPageActions';
import QuickNavigationDialog from '@/components/wiki/QuickNavigationDialog';
import FullTextSearch from '@/components/wiki/FullTextSearch';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TableOfContents from '@/components/wiki/TableOfContents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SpaceDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spaceId = searchParams.get('id');
  const [searchTerm, _setSearchTerm] = useState('');
  const [selectedPages, setSelectedPages] = useState([]);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [_showFolderModal, setShowFolderModal] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState(null);
  const queryClient = useQueryClient();

  // Cmd+K shortcut
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickNav(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: space, isLoading: spaceLoading } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: async () => {
      if (!spaceId) {
        return null;
      }
      const spaces = await base44.entities.Space.list();
      return spaces.find((s) => s.id === spaceId) || null;
    },
    enabled: !!spaceId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['space-pages', spaceId],
    queryFn: async () => {
      if (!spaceId) {
        return [];
      }
      const allPages = await base44.entities.WikiPage.list();
      return allPages.filter((p) => p.space_id === spaceId && !p.template);
    },
    enabled: !!spaceId,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['space-folders', spaceId],
    queryFn: async () => {
      if (!spaceId) {
        return [];
      }
      const allFolders = await base44.entities.WikiPageFolder.list();
      return allFolders.filter((f) => f.space_id === spaceId);
    },
    enabled: !!spaceId && space?.enable_folders,
  });

  const deleteMutation = useMutation({
    mutationFn: (pageId) => base44.entities.WikiPage.delete(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ pageId, order }) => {
      return await base44.entities.WikiPage.update(pageId, { order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;
    if (source.index === destination.index) {
      return;
    }

    const sourceParentId = source.droppableId === 'root' ? null : source.droppableId;
    const destParentId = destination.droppableId === 'root' ? null : destination.droppableId;

    // Get pages from the destination parent
    const siblingPages = pages
      .filter((p) => (destParentId ? p.parent_page_id === destParentId : !p.parent_page_id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const draggedPage = pages.find((p) => p.id === result.draggableId);

    // Remove from old position
    const filteredPages = siblingPages.filter((p) => p.id !== draggedPage.id);

    // Insert at new position
    filteredPages.splice(destination.index, 0, draggedPage);

    // Update order for all affected pages
    filteredPages.forEach((page, index) => {
      if (page.order !== index) {
        updateOrderMutation.mutate({ pageId: page.id, order: index });
      }
    });

    // If parent changed, update parent
    if (sourceParentId !== destParentId) {
      base44.entities.WikiPage.update(draggedPage.id, { parent_page_id: destParentId });
    }
  };

  if (spaceLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (!space) {
    return <div className="p-6 text-center">Space not found</div>;
  }

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

  // Build page hierarchy
  const rootPages = pages
    .filter((p) => !p.parent_page_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getChildPages = (parentId) => {
    return pages
      .filter((p) => p.parent_page_id === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const filteredPages = searchTerm
    ? pages.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : rootPages;

  const PageItem = ({ page, level = 0, index }) => {
    const children = getChildPages(page.id);
    const [expanded, setExpanded] = useState(true);

    return (
      <Draggable draggableId={page.id} index={index}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.draggableProps}>
            <Card
              className={`p-3 glass-card hover:shadow-md transition-all group ${
                snapshot.isDragging ? 'shadow-lg ring-2 ring-violet-500' : ''
              }`}
              style={{
                marginLeft: `${level * 24}px`,
                ...provided.draggableProps.style,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    {...provided.dragHandleProps}
                    className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  <Link
                    to={`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${page.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {children.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setExpanded(!expanded);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    )}
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600">
                      {page.title}
                    </span>
                    {page.status === 'draft' && (
                      <span className="text-xs text-gray-400">Draft</span>
                    )}
                  </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        to={`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${page.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteMutation.mutate(page.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
            {expanded && children.length > 0 && (
              <Droppable droppableId={page.id} type="page">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {children.map((child, idx) => (
                      <PageItem key={child.id} page={child} level={level + 1} index={idx} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Spaces')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div
            className={`w-12 h-12 rounded-lg ${colorClasses[space.color]} flex items-center justify-center text-2xl`}
          >
            {space.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{space.name}</h1>
            {space.description && <p className="text-gray-500 mt-1">{space.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowQuickNav(true)} className="gap-2">
            <Zap className="w-4 h-4" />
            Quick Nav
          </Button>
          {space?.enable_folders && (
            <Button variant="outline" onClick={() => setShowFolderModal(true)} className="gap-2">
              <FolderIcon className="w-4 h-4" />
              New Folder
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`${createPageUrl('SpaceTemplates')}?spaceId=${spaceId}`)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          {selectedPages.length > 0 && (
            <Button variant="outline" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              {selectedPages.length} Selected
            </Button>
          )}
          <Link to={`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}`}>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" />
              New Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      {pages.length > 0 && <FullTextSearch spaceId={spaceId} />}

      {/* Pages List */}
      {pages.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No pages yet"
          description="Create your first page to start documenting."
          actionLabel="Create Page"
          onAction={() => navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}`)}
        />
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="toc" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Table of Contents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {space?.enable_folders ? (
              <FolderTree
                folders={folders}
                pages={pages}
                spaceId={spaceId}
                onAddFolder={(_parentId) => setShowFolderModal(true)}
                onDeleteFolder={(folderId) => setDeleteFolderId(folderId)}
                onAddPage={(folderId) =>
                  navigate(
                    `${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&folderId=${folderId}`
                  )
                }
                currentPageId={null}
              />
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="root" type="page">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {filteredPages.map((page, index) => (
                        <PageItem key={page.id} page={page} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </TabsContent>

          <TabsContent value="toc">
            <TableOfContents pages={pages} spaceId={spaceId} />
          </TabsContent>
        </Tabs>
      )}

      {/* Bulk Actions */}
      <BulkPageActions
        selectedPages={selectedPages}
        onClearSelection={() => setSelectedPages([])}
        folders={folders}
      />

      {/* Quick Navigation */}
      <QuickNavigationDialog
        open={showQuickNav}
        onClose={() => setShowQuickNav(false)}
        spaceId={spaceId}
      />

      {/* Delete Folder Confirm */}
      <ConfirmDialog
        open={!!deleteFolderId}
        onClose={() => setDeleteFolderId(null)}
        onConfirm={() => {
          base44.entities.WikiPageFolder.delete(deleteFolderId);
          queryClient.invalidateQueries({ queryKey: ['space-folders'] });
          setDeleteFolderId(null);
        }}
        title="Delete this folder?"
        description="This will delete the folder and all its contents. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
