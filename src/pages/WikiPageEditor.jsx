import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Clock,
  MessageSquare,
  Star,
  Link2,
  Copy,
  Calendar as CalendarIcon,
  Lock,
  FileText,
  ChevronRight,
  MoreHorizontal,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import PageExportMenu from '@/components/wiki/PageExportMenu';
import RelatedPagesPanel from '@/components/wiki/RelatedPagesPanel';
import PageWatchersPanel from '@/components/wiki/PageWatchersPanel';
import FreshnessIndicator from '@/components/wiki/FreshnessIndicator';
import { createPageUrl } from '@/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/wiki-editor.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import VersionHistory from '@/components/wiki/VersionHistory';
import TemplateSelector from '@/components/wiki/TemplateSelector';
import CommentsPanel from '@/components/wiki/CommentsPanel';
import ActiveEditors from '@/components/wiki/ActiveEditors';
import TagsEditor from '@/components/wiki/TagsEditor';
import PageLockPanel from '@/components/wiki/PageLockPanel';

const modules = {
  toolbar: {
    container: [
      [{ font: [] }, { header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'underline', 'italic', { color: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }, { align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video', 'formula'],
      ['clean'],
    ],
  },
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
  const [tags, setTags] = useState([]);
  const [isTemplate, setIsTemplate] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [scheduledPublishDate, setScheduledPublishDate] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: space } = useQuery({
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

  const { data: page } = useQuery({
    queryKey: ['wiki-page', pageId],
    queryFn: async () => {
      if (!pageId) {
        return null;
      }
      const pages = await base44.entities.WikiPage.list();
      return pages.find((p) => p.id === pageId) || null;
    },
    enabled: !!pageId,
  });

  const { data: allPages = [] } = useQuery({
    queryKey: ['space-pages', spaceId],
    queryFn: async () => {
      if (!spaceId) return [];
      const pages = await base44.entities.WikiPage.list();
      return pages.filter((p) => p.space_id === spaceId && !p.template);
    },
    enabled: !!spaceId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['wiki-templates', spaceId],
    queryFn: async () => {
      if (!spaceId) {
        return [];
      }
      const pages = await base44.entities.WikiPage.list();
      return pages.filter((p) => p.space_id === spaceId && p.template === true);
    },
    enabled: !!spaceId,
  });

  const { data: activeEditors = [] } = useQuery({
    queryKey: ['wiki-presence', pageId],
    queryFn: async () => {
      const allPresence = await base44.entities.WikiPagePresence.list();
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      return allPresence.filter(
        (p) => p.page_id === pageId && p.last_seen > oneMinuteAgo && p.user_email !== user?.email
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
      setTags(page.tags || []);
      setIsTemplate(page.template || false);
    }
  }, [page]);

  useEffect(() => {
    if (!pageId && spaceId && !content) {
      if (space?.require_template || templates.length > 0) {
        setShowTemplateSelector(true);
      }
    }
  }, [pageId, spaceId, templates, content, space]);

  // Track user presence
  useEffect(() => {
    if (!pageId || !user) {
      return;
    }

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

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['user-bookmarks', user?.email],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      const allBookmarks = await base44.entities.WikiPageBookmark.list();
      return allBookmarks.filter((b) => b.user_email === user.email);
    },
    enabled: !!user && !!pageId,
  });

  const isBookmarked = bookmarks.some((b) => b.page_id === pageId);

  const toggleBookmark = async () => {
    const bookmark = bookmarks.find((b) => b.page_id === pageId);
    if (bookmark) {
      await base44.entities.WikiPageBookmark.delete(bookmark.id);
    } else {
      await base44.entities.WikiPageBookmark.create({
        page_id: pageId,
        user_email: user.email,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
  };

  const duplicatePage = async () => {
    if (!page) {
      return;
    }
    const duplicated = await base44.entities.WikiPage.create({
      space_id: spaceId,
      title: `${page.title} (Copy)`,
      content: page.content,
      status: 'draft',
      template: page.template,
      tags: page.tags,
      folder_id: page.folder_id,
      parent_page_id: page.parent_page_id,
    });
    navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${duplicated.id}`);
  };

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
          view_count: (page.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
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

  const isLocked = page?.is_locked;
  const isLockedByOther = isLocked && page?.locked_by !== user?.email && user?.role !== 'admin';

  const handleSave = () => {
    if (isLockedByOther) return;
    saveMutation.mutate({
      title,
      content,
      status,
      parent_page_id: parentPageId || null,
      ai_summary: aiSummary,
      template: isTemplate,
      tags,
      scheduled_publish_date: scheduledPublishDate || null,
    });
  };

  const generateSummary = async () => {
    if (!content) {
      return;
    }
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

  const handleCreateBlank = () => {
    if (space?.require_template) {
      return; // Don't allow blank pages if templates are required
    }
    setShowTemplateSelector(false);
  };

  if (!space) {
    return <div className="p-6">Loading...</div>;
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

  return (
    <div className="flex bg-white dark:bg-gray-950 overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>

      {/* ── Left: pages panel ── */}
      {showLeftPanel && (
        <div className="w-52 shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* panel header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`${createPageUrl('SpaceDetail')}?id=${spaceId}`)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-5 h-5 rounded text-xs flex items-center justify-center ${colorClasses[space.color]}`}>{space.icon}</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{space.name}</span>
            </div>
            <button onClick={() => setShowLeftPanel(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          {/* page list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Pages</p>
            {allPages.length === 0 && <p className="text-xs text-gray-400 px-2 py-1">No pages yet</p>}
            {allPages.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${p.id}`)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                  p.id === pageId
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-50" />
                <span className="truncate">{p.title || 'Untitled'}</span>
                {p.is_locked && <Lock className="w-3 h-3 shrink-0 text-red-400 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Right: editor area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Editor top bar */}
        <div className="shrink-0 h-11 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-2">
            {!showLeftPanel && (
              <button onClick={() => setShowLeftPanel(true)} className="text-gray-400 hover:text-gray-600 transition-colors mr-1">
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            {!showLeftPanel && (
              <>
                <button onClick={() => navigate(`${createPageUrl('SpaceDetail')}?id=${spaceId}`)} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className={`w-5 h-5 rounded text-xs flex items-center justify-center ${colorClasses[space.color]}`}>{space.icon}</div>
                <span className="text-sm text-gray-500">{space.name}</span>
                {title && <><ChevronRight className="w-3 h-3 text-gray-300" /><span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs">{title}</span></>}
              </>
            )}
            {showLeftPanel && title && <span className="text-sm text-gray-500 truncate max-w-sm">{title}</span>}
          </div>

          <div className="flex items-center gap-1.5">
            {pageId && page && <FreshnessIndicator page={page} />}
            {pageId && <ActiveEditors editors={activeEditors} />}
            {isLocked && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${isLockedByOther ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                <Lock className="w-3 h-3" />
                {isLockedByOther ? 'Locked' : 'Locked by you'}
              </div>
            )}
            {saveMutation.isPending && <span className="text-xs text-gray-400">Saving…</span>}

            {pageId && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleBookmark}>
                <Star className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              </Button>
            )}

            <Sheet open={showComments} onOpenChange={setShowComments}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MessageSquare className="w-4 h-4 text-gray-400" /></Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-96 p-0 flex flex-col">
                <CommentsPanel pageId={pageId} spaceId={spaceId} user={user} />
              </SheetContent>
            </Sheet>

            {pageId && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowVersionHistory(true)}>
                <Clock className="w-4 h-4 text-gray-400" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4 text-gray-400" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={generateSummary} disabled={generatingSummary}>
                  <Sparkles className="w-4 h-4 mr-2" />{generatingSummary ? 'Generating…' : 'Generate AI Summary'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {pageId && <DropdownMenuItem onClick={duplicatePage}><Copy className="w-4 h-4 mr-2" />Duplicate page</DropdownMenuItem>}
                {pageId && page && <DropdownMenuItem asChild><div><PageExportMenu page={page} /></div></DropdownMenuItem>}
                <DropdownMenuSeparator />
                {pageId && (
                  <div className="px-2 py-2 space-y-1">
                    <Label className="text-xs text-gray-500">Change summary</Label>
                    <Textarea value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="What changed?" className="h-14 text-xs" />
                  </div>
                )}
                {(!pageId || status === 'draft') && (
                  <div className="px-2 py-2 space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Schedule publish</Label>
                    <Input type="datetime-local" value={scheduledPublishDate} onChange={(e) => setScheduledPublishDate(e.target.value)} className="text-xs h-8" />
                  </div>
                )}
                <DropdownMenuSeparator />
                <div className="px-2 py-2 flex items-center justify-between">
                  <Label htmlFor="template-toggle" className="text-sm cursor-pointer">Mark as Template</Label>
                  <Switch id="template-toggle" checked={isTemplate} onCheckedChange={setIsTemplate} />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowRightSidebar(!showRightSidebar)}>
                  <Link2 className="w-4 h-4 mr-2" />{showRightSidebar ? 'Hide' : 'Show'} page details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                {space?.enable_approval_workflow && <SelectItem value="pending_approval">Pending Approval</SelectItem>}
              </SelectContent>
            </Select>

            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || !title || isLockedByOther} className="h-8 px-4">
              Save
            </Button>
          </div>
        </div>

        {/* Scrollable editor + optional right panel */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="w-full px-12 pt-10 pb-24 space-y-4">

              {/* Parent Page Selection */}
              {allPages.length > 0 && (
                <Select value={parentPageId} onValueChange={setParentPageId}>
                  <SelectTrigger className="w-64 h-7 text-xs border-dashed">
                    <SelectValue placeholder="No parent (root level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No parent page</SelectItem>
                    {allPages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this page a title"
                className="text-4xl font-bold border-0 px-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-700 h-auto py-1"
              />

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-4">
                {user && <span className="text-gray-500 text-xs">By {user.full_name || user.email?.split('@')[0]}</span>}
                <TagsEditor tags={tags} onChange={setTags} />
              </div>

              {/* AI Summary */}
              {aiSummary && (
                <Card className="p-3 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-violet-700 dark:text-violet-400">{aiSummary}</p>
                  </div>
                </Card>
              )}

              {/* Locked Warning */}
              {isLockedByOther && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <Lock className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Locked by <strong>{page.locked_by?.split('@')[0]}</strong>{page.lock_reason ? ` — ${page.lock_reason}` : ''}
                  </p>
                </div>
              )}

              {/* Editor */}
              <div className={isLockedByOther ? 'opacity-60 pointer-events-none' : ''}>
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={(value) => { if (!isLockedByOther) { setContent(value); setIsEditing(true); } }}
                  onBlur={() => setIsEditing(false)}
                  modules={modules}
                  readOnly={isLockedByOther}
                  className="ql-editor-full"
                  placeholder="Start writing…"
                />
              </div>
            </div>
          </div>

          {/* Right panel */}
          {showRightSidebar && pageId && (
            <div className="w-72 shrink-0 border-l border-gray-100 dark:border-gray-800 overflow-y-auto p-5 space-y-6">
              <PageLockPanel page={page} pageId={pageId} user={user} />
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <PageWatchersPanel pageId={pageId} user={user} />
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <RelatedPagesPanel currentPage={page} />
              </div>
            </div>
          )}
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
        onClose={() => !space?.require_template && setShowTemplateSelector(false)}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
        onCreateBlank={handleCreateBlank}
        requireTemplate={space?.require_template}
        defaultTemplateId={space?.default_template_id}
      />
    </div>
  );
}