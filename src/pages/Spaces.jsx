import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FolderOpen, FileText, Users, ArrowRight, Zap } from 'lucide-react';
import RecentPagesWidget from '@/components/wiki/RecentPagesWidget';
import QuickNavigationDialog from '@/components/wiki/QuickNavigationDialog';
import FullTextSearch from '@/components/wiki/FullTextSearch';
import EmptyState from '@/components/ui/EmptyState';
import SpaceModal from '@/components/modals/SpaceModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Spaces() {
  const [searchTerm, _setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const queryClient = useQueryClient();

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickNav(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => base44.entities.Space.list('-created_date'),
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['wiki-pages'],
    queryFn: () => base44.entities.WikiPage.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Space.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setShowModal(false);
      setEditingSpace(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Space.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setShowModal(false);
      setEditingSpace(null);
    },
  });

  const handleSave = (data) => {
    if (editingSpace) {
      updateMutation.mutate({ id: editingSpace.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSpaces = spaces.filter(
    (space) => !searchTerm || space.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getSpacePageCount = (spaceId) => {
    return pages.filter((p) => p.space_id === spaceId).length;
  };

  const totalPages = pages.length;
  const totalCollaborators = new Set(spaces.flatMap((s) => s.members || [])).size;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Spaces</h1>
          <p className="text-gray-500 mt-1">Organize your documentation and knowledge base</p>
        </div>
        <Button
          onClick={() => {
            setEditingSpace(null);
            setShowModal(true);
          }}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          New Space
        </Button>
      </div>

      {/* Search & Quick Actions */}
      {spaces.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <FullTextSearch spaceId={null} />
          </div>
          <Button variant="outline" onClick={() => setShowQuickNav(true)} className="gap-2">
            <Zap className="w-4 h-4" />
            Quick Nav (Cmd+K)
          </Button>
        </div>
      )}

      {/* Recent Pages Widget */}
      {spaces.length > 0 && <RecentPagesWidget spaceId={null} limit={5} />}

      {/* Stats Cards */}
      {spaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Spaces</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {spaces.length}
                </p>
              </div>
              <FolderOpen className="w-8 h-8 text-violet-600" />
            </div>
          </Card>
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {totalPages}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collaborators</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {totalCollaborators}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Spaces Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredSpaces.length === 0 && searchTerm ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No spaces found matching "{searchTerm}"</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No spaces yet"
          description="Create your first space to start organizing documentation and knowledge."
          actionLabel="Create Space"
          onAction={() => {
            setEditingSpace(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpaces.map((space) => (
            <Link key={space.id} to={`${createPageUrl('SpaceDetail')}?id=${space.id}`}>
              <Card className="p-5 glass-card hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg ${colorClasses[space.color]} flex items-center justify-center text-2xl flex-shrink-0`}
                  >
                    {space.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-violet-600">
                      {space.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {space.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {getSpacePageCount(space.id)} pages
                      </span>
                      {space.is_public && <span className="text-green-600">Public</span>}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modals */}
      <SpaceModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSpace(null);
        }}
        space={editingSpace}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <QuickNavigationDialog
        open={showQuickNav}
        onClose={() => setShowQuickNav(false)}
        spaceId={null}
      />
    </div>
  );
}
