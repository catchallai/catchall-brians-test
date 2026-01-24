import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Sparkles, Clock, FileText, MessageSquare } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import VersionHistory from '@/components/wiki/VersionHistory';
import TemplateSelector from '@/components/wiki/TemplateSelector';
import CommentsPanel from '@/components/wiki/CommentsPanel';
import ActiveEditors from '@/components/wiki/ActiveEditors';

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
  const [aiSummary, setAiSummary] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

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

  const { data: templates = [] } = useQuery({
    queryKey: ['wiki-templates', spaceId],
    queryFn: async () => {
      if (!spaceId) return [];
      const pages = await base44.entities.WikiPage.list();
      return pages.filter(p => p.space_id === spaceId && p.template === true);
    },
    enabled: !!spaceId && !pageId,
  });

  const { data: activeEditors = [] } = useQuery({
    queryKey: ['wiki-presence', pageId],
    queryFn: async () => {
      const allPresence = await base44.entities.WikiPagePresence.list();
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      return allPresence.filter(p => 
        p.page_id === pageId && 
        p.last_seen > oneMinuteAgo && 
        p.user_email !== user?.email
      );
    },
    enabled: !!pageId && !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content || '');
      setStatus(page.status || 'published');
      setParentPageId(page.parent_page_id || '');
      setAiSummary(page.ai_summary || '');
      setIsTemplate(page.template || false);
    }
  }, [page]);

  useEffect(() => {
    if (!pageId && templates.length > 0) {
      setShowTemplateSelector(true);
    }
  }, [pageId, templates]);

  // Track user presence
  useEffect(() => {
    if (!pageId || !user) return;

    let presenceId = null;

    const updatePresence = async () => {
      const presence = {
        page_id: pageId,
        user_email: user.email,
        user_name: user.full_name,
        is_editing: isEditing,
        last_seen: new Date().toISOString(),
      };

      if (presenceId) {
        await base44.entities.WikiPagePresence.update(presenceId, presence);
      } else {
        const created = await base44.entities.WikiPagePresence.create(presence);
        presenceId = created.id;
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 10000);

    return () => {
      clearInterval(interval);
      if (presenceId) {
        base44.entities.WikiPagePresence.delete(presenceId).catch(() => {});
      }
    };
  }, [pageId, user, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const currentVersion = page?.version_number || 0;
      
      if (pageId) {
        // Save version history
        await base44.entities.WikiPageVersion.create({
          page_id: pageId,
          version_number: currentVersion,
          title: page.title,
          content: page.content,
          edited_by: user?.email,
          change_summary: changeSummary || undefined,
        });

        return await base44.entities.WikiPage.update(pageId, {
          ...data,
          last_edited_by: user?.email,
          version_number: currentVersion + 1,
        });
      } else {
        return await base44.entities.WikiPage.create({
          ...data,
          space_id: spaceId,
          version_number: 1,
        });
      }
    },
    onSuccess: (savedPage) => {
      queryClient.invalidateQueries({ queryKey: ['space-pages'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-page'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-versions'] });
      setChangeSummary('');
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
      ai_summary: aiSummary,
      template: isTemplate,
    });
  };

  const generateSummary = async () => {
    if (!content) return;
    setGeneratingSummary(true);
    try {
      const plainText = content.replace(/<[^>]*>/g, '');
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this wiki page in 2-3 concise sentences:\n\n${plainText}`,
      });
      setAiSummary(response);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleRevert = async (version) => {
    setTitle(version.title);
    setContent(version.content);
    await handleSave();
  };

  const handleSelectTemplate = (template) => {
    setTitle('');
    setContent(template.content);
    setShowTemplateSelector(false);
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
            
            {pageId && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setShowVersionHistory(true)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  History
                </Button>

                <Sheet open={showComments} onOpenChange={setShowComments}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:w-96 p-0 flex flex-col">
                    <CommentsPanel pageId={pageId} spaceId={spaceId} user={user} />
                  </SheetContent>
                </Sheet>

                <ActiveEditors editors={activeEditors} />
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Options</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={generateSummary} disabled={generatingSummary}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatingSummary ? 'Generating...' : 'Generate AI Summary'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 flex items-center justify-between">
                  <Label htmlFor="template-toggle" className="text-sm cursor-pointer">Mark as Template</Label>
                  <Switch
                    id="template-toggle"
                    checked={isTemplate}
                    onCheckedChange={setIsTemplate}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
        <div className="w-full mx-auto p-8 space-y-6">
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

          {/* Change Summary */}
          {pageId && (
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                What changed? (Optional)
              </Label>
              <Textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Describe your changes (e.g., 'Updated pricing information', 'Fixed typos')"
                className="h-16"
              />
            </div>
          )}

          {/* AI Summary */}
          {aiSummary && (
            <Card className="p-4 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-violet-900 dark:text-violet-300 mb-1">
                    AI Summary
                  </p>
                  <p className="text-sm text-violet-700 dark:text-violet-400">
                    {aiSummary}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Rich Text Editor */}
          <div className="min-h-[500px]">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={(value) => {
                setContent(value);
                setIsEditing(true);
              }}
              onBlur={() => setIsEditing(false)}
              modules={modules}
              className="h-full"
              placeholder="Start writing..."
            />
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      <VersionHistory
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        pageId={pageId}
        onRevert={handleRevert}
      />

      {/* Template Selector Modal */}
      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
        onCreateBlank={() => setShowTemplateSelector(false)}
      />
    </div>
  );
}