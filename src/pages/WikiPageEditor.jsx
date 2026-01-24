import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Eye, MoreVertical } from "lucide-react";
import { createPageUrl } from '@/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'code-block'],
    ['clean']
  ],
};

export default function WikiPageEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spaceId = searchParams.get('spaceId');
  const pageId = searchParams.get('pageId');
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [parentPageId, setParentPageId] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: space } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: async () => {
      if (!spaceId) return null;
      const spaces = await base44.entities.Space.list();
      return spaces.find(s => s.id === spaceId) || null;
    },
    enabled: !!spaceId,
  });

  const { data: page } = useQuery({
    queryKey: ['wiki-page', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const pages = await base44.entities.WikiPage.list();
      return pages.find(p => p.id === pageId) || null;
    },
    enabled: !!pageId,
  });

  const { data: allPages = [] } = useQuery({
    queryKey: ['space-pages', spaceId],
    queryFn: async () => {
      if (!spaceId) return [];
      const pages = await base44.entities.WikiPage.list();
      return pages.filter(p => p.space_id === spaceId && p.id !== pageId);
    },
    enabled: !!spaceId,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content || '');
      setStatus(page.status || 'published');
      setParentPageId(page.parent_page_id || '');
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (pageId) {
        return await base44.entities.WikiPage.update(pageId, {
          ...data,
          last_edited_by: user?.email,
        });
      } else {
        return await base44.entities.WikiPage.create({
          ...data,
          space_id: spaceId,
        });
      }
    },
    onSuccess: (savedPage) => {
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-page'] });
      if (!pageId) {
        navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${savedPage.id}`);
      }
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      title,
      content,
      status,
      parent_page_id: parentPageId || null,
    });
  };

  if (!space) return <div className="p-6">Loading...</div>;

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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50 lg:left-64">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`${createPageUrl('SpaceDetail')}?id=${spaceId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={`w-8 h-8 rounded ${colorClasses[space.color]} flex items-center justify-center text-lg`}>
              {space.icon}
            </div>
            <span className="text-sm text-gray-500">{space.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending || !title}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="pt-16 lg:pl-64">
        <div className="max-w-4xl mx-auto p-8 space-y-6">
          {/* Parent Page Selection */}
          {allPages.length > 0 && (
            <Select value={parentPageId} onValueChange={setParentPageId}>
              <SelectTrigger>
                <SelectValue placeholder="No parent page (root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No parent page (root level)</SelectItem>
                {allPages.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title..."
            className="text-4xl font-bold border-0 px-0 focus-visible:ring-0"
          />

          {/* Rich Text Editor */}
          <div className="min-h-[500px]">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="h-full"
              placeholder="Start writing..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}