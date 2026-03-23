import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GitBranch, Plus, Loader2, FileText, CheckCircle, Clock, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import moment from 'moment';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  published: 'bg-blue-100 text-blue-700',
};

export default function VersionHistory({ project, user }) {
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newVersion, setNewVersion] = useState({
    content_title: '',
    content: '',
    change_summary: '',
  });
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['content-versions', project.id],
    queryFn: () =>
      base44.entities.ContentVersion.filter({ project_id: project.id }, '-created_date', 100),
  });

  const createVersionMutation = useMutation({
    mutationFn: async (data) => {
      const existingVersions = versions.filter((v) => v.content_title === data.content_title);
      const versionNumber = existingVersions.length + 1;

      return base44.entities.ContentVersion.create({
        ...data,
        project_id: project.id,
        version_number: versionNumber,
        author: user?.email,
        author_name: user?.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-versions'] });
      setShowAddVersion(false);
      setNewVersion({ content_title: '', content: '', change_summary: '' });
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ContentVersion.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-versions'] }),
  });

  const groupedVersions = versions.reduce((acc, v) => {
    if (!acc[v.content_title]) {
      acc[v.content_title] = [];
    }
    acc[v.content_title].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddVersion(true)}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          New Version
        </Button>
      </div>

      {Object.keys(groupedVersions).length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No content versions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedVersions).map(([title, contentVersions]) => (
            <Card key={title} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" />
                  {title}
                  <Badge variant="outline">{contentVersions.length} versions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contentVersions
                    .sort((a, b) => b.version_number - a.version_number)
                    .map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600">
                            v{version.version_number}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {version.change_summary || 'No summary'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="w-4 h-4">
                                <AvatarFallback className="text-xs">
                                  {version.author_name?.[0] || version.author?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-400">
                                {version.author_name} • {moment(version.created_date).fromNow()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[version.status]}>{version.status}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVersion(version)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Version Modal */}
      <Dialog open={showAddVersion} onOpenChange={setShowAddVersion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Content Title</Label>
              <Input
                value={newVersion.content_title}
                onChange={(e) => setNewVersion({ ...newVersion, content_title: e.target.value })}
                placeholder="e.g., Homepage SEO Guide"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newVersion.content}
                onChange={(e) => setNewVersion({ ...newVersion, content: e.target.value })}
                placeholder="Content outline or draft..."
                className="min-h-[200px]"
              />
            </div>
            <div>
              <Label>Change Summary</Label>
              <Input
                value={newVersion.change_summary}
                onChange={(e) => setNewVersion({ ...newVersion, change_summary: e.target.value })}
                placeholder="Brief description of changes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddVersion(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createVersionMutation.mutate(newVersion)}
                disabled={
                  !newVersion.content_title ||
                  !newVersion.content ||
                  createVersionMutation.isPending
                }
              >
                {createVersionMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Version
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Version Modal */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedVersion?.content_title}
              <Badge className="ml-2">v{selectedVersion?.version_number}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-80 p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{selectedVersion?.content}</pre>
            </ScrollArea>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateVersionMutation.mutate({ id: selectedVersion?.id, status: 'review' })
                  }
                >
                  <Clock className="w-4 h-4 mr-1" /> Send to Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateVersionMutation.mutate({ id: selectedVersion?.id, status: 'approved' })
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
              <Badge className={statusColors[selectedVersion?.status]}>
                {selectedVersion?.status}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
