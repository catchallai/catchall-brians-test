import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tag, Plus, Pencil, Trash2, X, Check } from "lucide-react";

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#64748b', '#000000',
];

function TagFormModal({ open, onClose, tag }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || TAG_COLORS[0]);
  const [description, setDescription] = useState(tag?.description || '');

  React.useEffect(() => {
    if (open) {
      setName(tag?.name || '');
      setColor(tag?.color || TAG_COLORS[0]);
      setDescription(tag?.description || '');
    }
  }, [open, tag]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      tag
        ? base44.entities.SocialTag.update(tag.id, data)
        : base44.entities.SocialTag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-tags'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!name.trim()) return;
    saveMutation.mutate({ name: name.trim(), color, description });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-sm rounded-2xl overflow-hidden" style={{ gap: 0 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{tag ? 'Edit Tag' : 'New Tag'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
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
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
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
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Description (optional)</label>
            <Input
              placeholder="What is this tag for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
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

export default function SocialTags() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['social-tags'],
    queryFn: () => base44.entities.SocialTag.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialTag.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-tags'] }),
  });

  const openNew = () => { setEditingTag(null); setShowModal(true); };
  const openEdit = (tag) => { setEditingTag(tag); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingTag(null); };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
            <p className="text-sm text-gray-500 mt-1">Tags are visible to everyone in your organization.</p>
          </div>
          <Button onClick={openNew} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4">
            <Plus className="w-4 h-4" />
            New Tag
          </Button>
        </div>

        {/* Tags list */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50 dark:bg-gray-700 rounded-xl m-2" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-20 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Tag className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">No tags yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Create tags to organize and categorize your social media content. Tags help you track campaigns and analyze performance across your posts.
              </p>
            </div>
            <Button onClick={openNew} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-2">
              <Plus className="w-4 h-4" />
              New Tag
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-5 py-4 group">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: tag.color || '#6366f1' }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {tag.name}
                  </span>
                  {tag.description && (
                    <span className="text-sm text-gray-400 truncate">{tag.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(tag)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete tag "${tag.name}"?`)) deleteMutation.mutate(tag.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TagFormModal open={showModal} onClose={closeModal} tag={editingTag} />
    </div>
  );
}