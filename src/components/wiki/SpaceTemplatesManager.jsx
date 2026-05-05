import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, FileText, Pencil, Trash2, Eye, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const STARTER_TEMPLATES = [
  {
    title: 'Meeting Notes',
    content: `<h2>Meeting Notes</h2><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><p><strong>Facilitator:</strong> </p><hr/><h3>Agenda</h3><ol><li></li></ol><h3>Discussion Points</h3><ul><li></li></ul><h3>Action Items</h3><ul><li><strong>Owner:</strong>  | <strong>Due:</strong>  | <strong>Task:</strong> </li></ul><h3>Next Steps</h3><p></p>`,
  },
  {
    title: 'Project Specification',
    content: `<h2>Project Specification</h2><p><strong>Project Name:</strong> </p><p><strong>Owner:</strong> </p><p><strong>Date:</strong> </p><hr/><h3>Overview</h3><p>Brief description of the project.</p><h3>Goals &amp; Objectives</h3><ul><li></li></ul><h3>Scope</h3><p><strong>In Scope:</strong></p><ul><li></li></ul><p><strong>Out of Scope:</strong></p><ul><li></li></ul><h3>Requirements</h3><h4>Functional</h4><ul><li></li></ul><h4>Non-Functional</h4><ul><li></li></ul><h3>Timeline</h3><p></p><h3>Risks &amp; Mitigations</h3><ul><li></li></ul>`,
  },
  {
    title: 'Company Policy',
    content: `<h2>Company Policy</h2><p><strong>Policy Name:</strong> </p><p><strong>Effective Date:</strong> </p><p><strong>Owner:</strong> </p><p><strong>Version:</strong> 1.0</p><hr/><h3>Purpose</h3><p></p><h3>Scope</h3><p>This policy applies to:</p><ul><li></li></ul><h3>Policy Statement</h3><p></p><h3>Responsibilities</h3><ul><li></li></ul><h3>Compliance</h3><p></p><h3>Review Cycle</h3><p>This policy will be reviewed annually.</p>`,
  },
  {
    title: 'How-To Guide',
    content: `<h2>How-To Guide</h2><p><strong>Topic:</strong> </p><p><strong>Author:</strong> </p><hr/><h3>Overview</h3><p>What this guide covers and who it's for.</p><h3>Prerequisites</h3><ul><li></li></ul><h3>Step-by-Step Instructions</h3><ol><li><p><strong>Step 1:</strong> </p></li><li><p><strong>Step 2:</strong> </p></li><li><p><strong>Step 3:</strong> </p></li></ol><h3>Tips &amp; Troubleshooting</h3><ul><li></li></ul><h3>Related Resources</h3><ul><li></li></ul>`,
  },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['clean'],
  ],
};

function TemplateEditorModal({ open, onClose, template, spaceId, onSaved }) {
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.ai_summary || '');
  const [content, setContent] = useState(template?.content || '');
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        content,
        ai_summary: description,
        space_id: spaceId,
        template: true,
        status: 'published',
      };
      if (template?.id) {
        return base44.entities.WikiPage.update(template.id, payload);
      }
      return base44.entities.WikiPage.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-templates', spaceId] });
      onSaved?.();
      onClose();
    },
  });

  // Reset when modal opens
  useState(() => {
    setTitle(template?.title || '');
    setDescription(template?.ai_summary || '');
    setContent(template?.content || '');
    setPreview(false);
  }, [template, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit Template' : 'Create Template'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Template Name <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Meeting Notes, Project Spec…"
              />
            </div>
            <div className="space-y-1">
              <Label>Short Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One-line description for users"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Template Content</Label>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {preview ? (
              <div
                className="min-h-64 border rounded-lg p-4 prose dark:prose-invert max-w-none text-sm bg-gray-50 dark:bg-gray-900"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="min-h-64 border rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  className="h-64"
                  placeholder="Define your template layout…"
                />
              </div>
            )}
          </div>

          {/* Quick-start from a starter */}
          {!template?.id && (
            <div className="space-y-2">
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Or start from a built-in layout</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STARTER_TEMPLATES.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => { setTitle(s.title); setContent(s.content); }}
                    className="text-left px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!title.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : template?.id ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SpaceTemplatesManager({ spaceId }) {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['space-templates', spaceId],
    queryFn: async () => {
      const pages = await base44.entities.WikiPage.list();
      return pages.filter((p) => p.space_id === spaceId && p.template === true);
    },
    enabled: !!spaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WikiPage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['space-templates', spaceId] }),
  });

  const openNew = () => { setEditingTemplate(null); setEditorOpen(true); };
  const openEdit = (t) => { setEditingTemplate(t); setEditorOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Page Templates</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define standard layouts users can pick when creating a new page.
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-3">No templates yet. Create one to get started.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {STARTER_TEMPLATES.map((s) => (
              <Badge
                key={s.title}
                variant="outline"
                className="cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-400"
                onClick={() => { setEditingTemplate({ title: s.title, content: s.content }); setEditorOpen(true); }}
              >
                + {s.title}
              </Badge>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={openNew}>Create Custom Template</Button>
        </Card>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-200 dark:hover:border-violet-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
              {t.ai_summary && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.ai_summary}</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewTemplate(t)}
              >
                <Eye className="w-3.5 h-3.5 text-gray-500" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7"
                onClick={() => openEdit(t)}
              >
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7"
                onClick={() => deleteMutation.mutate(t.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        template={editingTemplate}
        spaceId={spaceId}
      />

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{previewTemplate?.title}</DialogTitle>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>
          <div
            className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none text-sm p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            dangerouslySetInnerHTML={{ __html: previewTemplate?.content }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewTemplate(null); openEdit(previewTemplate); }}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}