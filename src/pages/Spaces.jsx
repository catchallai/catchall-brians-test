import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderOpen, FileText, Users, ArrowRight, Zap, Search, ChevronRight, MoreHorizontal, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceModal from '@/components/modals/SpaceModal';

export default function Spaces() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => base44.entities.Space.list('-created_date'),
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['wiki-pages'],
    queryFn: () => base44.entities.WikiPage.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Space.create(data),
    onSuccess: (newSpace) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setShowModal(false);
      setEditingSpace(null);
      setSelectedSpace(newSpace.id);
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

  const getSpacePageCount = (spaceId) => {
    return pages.filter((p) => p.space_id === spaceId).length;
  };

  const filteredPages = selectedSpace
    ? pages.filter((p) => p.space_id === selectedSpace)
    : [];

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

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
            <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Workspace</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          <div className="px-2 py-1.5">
            <p className="text-xs text-gray-500 uppercase font-semibold">Quick Links</p>
          </div>

          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
            <Search className="w-4 h-4" />
            For you
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
            <FileText className="w-4 h-4" />
            Recent
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
            <Zap className="w-4 h-4" />
            Starred
          </button>

          <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

          <div className="px-2 py-1.5">
            <p className="text-xs text-gray-500 uppercase font-semibold">Spaces</p>
          </div>

          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => setSelectedSpace(space.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                selectedSpace === space.id
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <div className={`w-5 h-5 rounded text-xs flex items-center justify-center text-white ${colorClasses[space.color]}`}>
                {space.icon}
              </div>
              <span className="truncate text-left">{space.name}</span>
            </button>
          ))}

          <button
            onClick={() => {
              setEditingSpace(null);
              setShowModal(true);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 mt-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Untitled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Saved</span>
            <Button size="sm" className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700">
              Publish
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
              Close
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {!selectedSpace ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a space</h2>
              <p className="text-sm text-gray-500">Choose a space from the sidebar to get started</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              {/* Editor Toolbar */}
              <div className="flex items-center gap-1 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <FileText className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Write</span>
                <span className="text-sm text-gray-400 ml-2">Tt Normal text</span>
                <div className="ml-auto flex items-center gap-1">
                  {/* Toolbar buttons would go here */}
                </div>
              </div>

              {/* Title */}
              <Input
                placeholder="Give this page a title"
                className="text-2xl font-semibold border-0 p-0 focus-visible:ring-0 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-600 h-auto mb-4"
              />

              {/* Meta info */}
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <span>By {base44?.auth?.me?.()?.full_name || 'Me'}</span>
                <span>•</span>
                <span>Hardy Page Status</span>
                <span>•</span>
                <span>Classification: Error Retrieving Data</span>
              </div>

              {/* Editor placeholder */}
              <p className="text-sm text-gray-500 dark:text-gray-400">Press space to Ask Rovo or / to insert elements</p>

              {/* Templates footer */}
              <div className="mt-12 flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Synerjkai Project Te...
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Meeting notes
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Project plan
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  All templates
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Table
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Info panel
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Table of contents
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  More elements
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}