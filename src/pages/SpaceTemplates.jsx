import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, FileText, Trash2, Edit, Star, Lock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BUILT_IN_TEMPLATES = [
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    content: `<h2>Meeting Information</h2>
<p><strong>Date:</strong> [Date]</p>
<p><strong>Attendees:</strong> [Names]</p>
<p><strong>Facilitator:</strong> [Name]</p>

<h2>Agenda</h2>
<ol>
  <li>Topic 1</li>
  <li>Topic 2</li>
  <li>Topic 3</li>
</ol>

<h2>Discussion Points</h2>
<p>[Notes from discussion]</p>

<h2>Action Items</h2>
<ul>
  <li>[ ] Action item 1 - [Owner]</li>
  <li>[ ] Action item 2 - [Owner]</li>
</ul>

<h2>Next Steps</h2>
<p>[Next meeting date and agenda]</p>`,
    tags: ['meetings', 'notes'],
    builtin: true,
  },
  {
    id: 'project-spec',
    title: 'Project Specification',
    content: `<h1>Project Overview</h1>
<p><strong>Project Name:</strong> [Name]</p>
<p><strong>Owner:</strong> [Owner]</p>
<p><strong>Status:</strong> [Status]</p>

<h2>Objectives</h2>
<p>[What are we trying to achieve?]</p>

<h2>Requirements</h2>
<h3>Functional Requirements</h3>
<ul>
  <li>Requirement 1</li>
  <li>Requirement 2</li>
</ul>

<h3>Non-Functional Requirements</h3>
<ul>
  <li>Performance</li>
  <li>Security</li>
  <li>Scalability</li>
</ul>

<h2>Timeline</h2>
<p><strong>Start Date:</strong> [Date]</p>
<p><strong>End Date:</strong> [Date]</p>

<h2>Resources</h2>
<p>[Team, budget, tools]</p>

<h2>Risks</h2>
<ul>
  <li>Risk 1 - [Mitigation]</li>
  <li>Risk 2 - [Mitigation]</li>
</ul>`,
    tags: ['project', 'specification'],
    builtin: true,
  },
  {
    id: 'how-to-guide',
    title: 'How-To Guide',
    content: `<h1>[Process/Task Name]</h1>

<h2>Overview</h2>
<p>[Brief description of what this guide covers]</p>

<h2>Prerequisites</h2>
<ul>
  <li>Prerequisite 1</li>
  <li>Prerequisite 2</li>
</ul>

<h2>Steps</h2>

<h3>Step 1: [Title]</h3>
<p>[Detailed instructions]</p>

<h3>Step 2: [Title]</h3>
<p>[Detailed instructions]</p>

<h3>Step 3: [Title]</h3>
<p>[Detailed instructions]</p>

<h2>Troubleshooting</h2>
<p><strong>Issue:</strong> [Problem]</p>
<p><strong>Solution:</strong> [Fix]</p>

<h2>Additional Resources</h2>
<ul>
  <li>[Link or reference]</li>
</ul>`,
    tags: ['documentation', 'guide'],
    builtin: true,
  },
  {
    id: 'decision-record',
    title: 'Decision Record',
    content: `<h1>Decision: [Title]</h1>

<p><strong>Date:</strong> [Date]</p>
<p><strong>Status:</strong> [Proposed / Accepted / Rejected / Superseded]</p>
<p><strong>Decision Makers:</strong> [Names]</p>

<h2>Context</h2>
<p>[What is the issue we're trying to solve?]</p>

<h2>Decision</h2>
<p>[What we decided to do]</p>

<h2>Options Considered</h2>
<h3>Option 1</h3>
<p><strong>Pros:</strong></p>
<ul><li>Pro 1</li></ul>
<p><strong>Cons:</strong></p>
<ul><li>Con 1</li></ul>

<h3>Option 2</h3>
<p><strong>Pros:</strong></p>
<ul><li>Pro 1</li></ul>
<p><strong>Cons:</strong></p>
<ul><li>Con 1</li></ul>

<h2>Consequences</h2>
<p>[What are the implications of this decision?]</p>

<h2>Follow-up Actions</h2>
<ul>
  <li>[ ] Action 1</li>
  <li>[ ] Action 2</li>
</ul>`,
    tags: ['decision', 'architecture'],
    builtin: true,
  },
];

export default function SpaceTemplates() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const spaceId = searchParams.get('spaceId');

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    tags: [],
  });

  const { data: space } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => base44.entities.Space.filter({ id: spaceId }).then((r) => r[0]),
    enabled: !!spaceId,
  });

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['wiki-templates', spaceId],
    queryFn: async () => {
      const pages = await base44.entities.WikiPage.list();
      return pages.filter((p) => p.space_id === spaceId && p.template);
    },
    enabled: !!spaceId,
  });

  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        return await base44.entities.WikiPage.update(editingTemplate.id, {
          ...data,
          template: true,
          space_id: spaceId,
        });
      } else {
        return await base44.entities.WikiPage.create({
          ...data,
          template: true,
          space_id: spaceId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-templates'] });
      setShowCreateModal(false);
      setEditingTemplate(null);
      setNewTemplate({ title: '', content: '', tags: [] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.WikiPage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-templates'] });
    },
  });

  const updateSpaceSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.Space.update(spaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space'] });
    },
  });

  const filteredTemplates = allTemplates.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplate({
      title: template.title,
      content: template.content,
      tags: template.tags || [],
    });
    setShowCreateModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`${createPageUrl('SpaceDetail')}?id=${spaceId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Space
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Templates</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage templates for {space?.name}
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Space Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Template Enforcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Require Template for New Pages</Label>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, all new pages must use a template
              </p>
            </div>
            <Switch
              checked={space?.require_template || false}
              onCheckedChange={(checked) =>
                updateSpaceSettingsMutation.mutate({ require_template: checked })
              }
            />
          </div>

          {space?.require_template && (
            <div>
              <Label>Default Template</Label>
              <select
                className="w-full mt-2 p-2 border rounded-lg bg-white dark:bg-gray-800"
                value={space?.default_template_id || ''}
                onChange={(e) =>
                  updateSpaceSettingsMutation.mutate({ default_template_id: e.target.value })
                }
              >
                <option value="">Select default template...</option>
                {allTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This template will be pre-selected when creating new pages
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-8 h-8 text-violet-600" />
                <div className="flex gap-2">
                  {space?.default_template_id === template.id && (
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  )}
                  {template.builtin && <Badge variant="outline">Built-in</Badge>}
                </div>
              </div>
              <CardTitle className="text-lg mt-3">{template.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                {template.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {!template.builtin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                placeholder="e.g., Product Requirements Document"
              />
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={newTemplate.tags?.join(', ') || ''}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g., product, requirements, documentation"
              />
            </div>

            <div>
              <Label>Template Content</Label>
              <ReactQuill
                theme="snow"
                value={newTemplate.content}
                onChange={(content) => setNewTemplate({ ...newTemplate, content })}
                className="h-64 mb-12"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
                setNewTemplate({ title: '', content: '', tags: [] });
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => createTemplateMutation.mutate(newTemplate)}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
