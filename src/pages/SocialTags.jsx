import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Tag, Plus, Pencil, Trash2, X, Check, GripVertical } from 'lucide-react';
import { TAG_COLORS } from '@/constants/tags';
import COPY from '@/lib/copy';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

function TagFormModal({ open, onClose, tag }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || TAG_COLORS[0]);
  const [description, setDescription] = useState(tag?.description || '');
  const [nameError, setNameError] = useState('');

  React.useEffect(() => {
    if (open) {
      setName(tag?.name || '');
      setColor(tag?.color || TAG_COLORS[0]);
      setDescription(tag?.description || '');
      setNameError('');
    }
  }, [open, tag]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      tag ? base44.entities.SocialTag.update(tag.id, data) : base44.entities.SocialTag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-tags'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    const existingTags = queryClient.getQueryData(['social-tags']) || [];
    const normalised = name.trim().toLowerCase();
    const duplicate = existingTags.find(
      (t) => t.name.toLowerCase() === normalised && t.id !== tag?.id
    );
    if (duplicate) {
      setNameError(COPY.socialTags.duplicateNameError);
      return;
    }
    setNameError('');
    saveMutation.mutate({ name: name.trim(), color, description });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-sm rounded-2xl overflow-hidden" style={{ gap: 0 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{tag ? 'Edit Tag' : 'New Tag'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-3.5 h-3.5" />
              {name || 'Tag preview'}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Tag Name</label>
            <Input
              placeholder="e.g. Campaign, Product Launch"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) {
                  setNameError('');
                }
              }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className={nameError ? 'border-red-400 focus-visible:ring-red-400' : ''}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Description (optional)
            </label>
            <Input
              placeholder="What is this tag for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!name.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : tag ? 'Save Changes' : 'Create Tag'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DroppableTab({ id, label, count, isActive, onClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
      } ${isOver ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 !text-amber-700' : ''}`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-xs font-semibold ${
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        } ${isOver ? '!bg-amber-100 !text-amber-800' : ''}`}
      >
        {count}
      </span>
    </button>
  );
}

function DraggableTagRow({ tag, activeTab, onEdit, onDelete, isDeletePending }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tag.id,
    data: { tagId: tag.id, currentTab: activeTab },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-5 py-4 group ${isDragging ? 'opacity-40 z-50 relative' : ''}`}
      {...attributes}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 flex-shrink-0"
          aria-label="Drag to archive or unarchive"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white flex-shrink-0 ${tag.is_archived ? 'opacity-60' : ''}`}
          style={{ backgroundColor: tag.color || '#6366f1' }}
        >
          <Tag className="w-3.5 h-3.5" />
          {tag.name}
        </span>
        {tag.description && (
          <span className="text-sm text-gray-400 truncate">{tag.description}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {tag.usage_count > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">
            {COPY.socialTags.postCount(tag.usage_count)}
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(tag)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tag)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            disabled={isDeletePending}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SocialTags() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['social-tags'],
    queryFn: () => base44.entities.SocialTag.list('-created_date', 100),
  });

  const activeTags = tags.filter((t) => !t.is_archived);
  const archivedTags = tags.filter((t) => t.is_archived);
  const visibleTags = activeTab === 'active' ? activeTags : archivedTags;

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialTag.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-tags'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, is_archived }) => base44.entities.SocialTag.update(id, { is_archived }),
    onSuccess: (_, { is_archived, name }) => {
      queryClient.invalidateQueries({ queryKey: ['social-tags'] });
      setActiveTab(is_archived ? 'archived' : 'active');
      toast.success(
        is_archived ? COPY.socialTags.archiveSuccess(name) : COPY.socialTags.unarchiveSuccess(name)
      );
    },
    onError: () => {
      toast.error(COPY.socialTags.archiveError);
    },
  });

  const handleDragEnd = ({ active, over }) => {
    if (!over || archiveMutation.isPending) {
      return;
    }
    const tag = tags.find((t) => t.id === active.id);
    if (!tag) {
      return;
    }
    const droppingOnArchived = over.id === 'archived';
    if (Boolean(tag.is_archived) === droppingOnArchived) {
      return;
    }
    archiveMutation.mutate({ id: tag.id, is_archived: droppingOnArchived, name: tag.name });
  };

  const openNew = () => {
    setEditingTag(null);
    setShowModal(true);
  };
  const openEdit = (tag) => {
    setEditingTag(tag);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
              <p className="text-sm text-gray-500 mt-1">
                Tags are visible to everyone in your organization.
              </p>
            </div>
            {activeTab === 'active' && (
              <Button
                onClick={openNew}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4"
              >
                <Plus className="w-4 h-4" />
                New Tag
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 -mb-px">
            <DroppableTab
              id="active"
              label={COPY.socialTags.activeTab}
              count={activeTags.length}
              isActive={activeTab === 'active'}
              onClick={() => setActiveTab('active')}
            />
            <DroppableTab
              id="archived"
              label={COPY.socialTags.archivedTab}
              count={archivedTags.length}
              isActive={activeTab === 'archived'}
              onClick={() => setActiveTab('archived')}
            />
          </div>

          {/* Tag list */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl m-2"
                />
              ))}
            </div>
          ) : visibleTags.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-16 flex flex-col items-center gap-3 text-center px-6">
              <Tag className="w-7 h-7 text-gray-300" />
              <p className="text-sm text-gray-500">
                {activeTab === 'active'
                  ? COPY.socialTags.noActiveTags
                  : COPY.socialTags.noArchivedTags}
              </p>
              {activeTab === 'active' && (
                <Button
                  onClick={openNew}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-1"
                >
                  <Plus className="w-4 h-4" /> New Tag
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              {visibleTags.map((tag) => (
                <DraggableTagRow
                  key={tag.id}
                  tag={tag}
                  activeTab={activeTab}
                  onEdit={openEdit}
                  onDelete={setTagToDelete}
                  isDeletePending={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </DndContext>

      <TagFormModal open={showModal} onClose={closeModal} tag={editingTag} />
      <ConfirmDialog
        open={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={() => tagToDelete && deleteMutation.mutate(tagToDelete.id)}
        title="Delete Tag"
        description={`Are you sure you want to delete "${tagToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
