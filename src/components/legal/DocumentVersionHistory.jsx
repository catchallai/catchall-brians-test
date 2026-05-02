import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { History, Plus, RotateCcw, Eye, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentVersionHistory({ document, open, onClose, onRevert }) {
  const qc = useQueryClient();
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [form, setForm] = useState({ content: document?.content || '', change_summary: '', file_url: '' });
  const [uploading, setUploading] = useState(false);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['doc-versions', document?.id],
    queryFn: () => base44.entities.LegalDocumentVersion.filter({ document_id: document.id }, '-version_number'),
    enabled: !!document?.id && open,
  });

  const inv = () => qc.invalidateQueries({ queryKey: ['doc-versions', document?.id] });

  const createVersion = useMutation({
    mutationFn: async (data) => {
      // Mark all existing versions as not current
      await Promise.all(versions.map(v => base44.entities.LegalDocumentVersion.update(v.id, { is_current: false })));
      const nextNum = (versions[0]?.version_number || 0) + 1;
      return base44.entities.LegalDocumentVersion.create({
        document_id: document.id,
        version_number: nextNum,
        title: document.title,
        content: data.content,
        file_url: data.file_url,
        change_summary: data.change_summary,
        is_current: true,
      });
    },
    onSuccess: async (newVersion) => {
      // Update the parent document's content
      await base44.entities.LegalDocument.update(document.id, { content: newVersion.content });
      inv();
      qc.invalidateQueries({ queryKey: ['legal-documents'] });
      setShowNewVersion(false);
      setForm({ content: document?.content || '', change_summary: '', file_url: '' });
      toast.success(`Version ${newVersion.version_number} created`);
    },
  });

  const revertToVersion = useMutation({
    mutationFn: async (version) => {
      // Mark all as not current, then mark this one current
      await Promise.all(versions.map(v => base44.entities.LegalDocumentVersion.update(v.id, { is_current: v.id === version.id })));
      await base44.entities.LegalDocument.update(document.id, { content: version.content });
      return version;
    },
    onSuccess: (version) => {
      inv();
      qc.invalidateQueries({ queryKey: ['legal-documents'] });
      onRevert?.(version.content);
      toast.success(`Reverted to version ${version.version_number}`);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
    toast.success('File uploaded');
  };

  // Seed initial version if none exist
  const seedInitialVersion = useMutation({
    mutationFn: () => base44.entities.LegalDocumentVersion.create({
      document_id: document.id,
      version_number: 1,
      title: document.title,
      content: document.content,
      change_summary: 'Initial version',
      is_current: true,
    }),
    onSuccess: () => { inv(); toast.success('Version history initialized'); },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Version History — {document?.title}
          </DialogTitle>
        </DialogHeader>

        {/* New Version Form */}
        {showNewVersion ? (
          <div className="border rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">New Version</h3>
            <div>
              <Label className="text-xs mb-1 block">Change Summary</Label>
              <Input placeholder="What changed in this version?" value={form.change_summary} onChange={e => setForm(f => ({ ...f, change_summary: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Document Content</Label>
              <Textarea rows={10} className="font-mono text-xs" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Upload File (optional)</Label>
              <div className="flex gap-2 items-center">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                  <Button type="button" variant="outline" size="sm" asChild={false} disabled={uploading}>
                    <span><Upload className="w-3.5 h-3.5 mr-1" />{uploading ? 'Uploading…' : 'Choose File'}</span>
                  </Button>
                </label>
                {form.file_url && <span className="text-xs text-green-600 truncate max-w-[200px]">✓ File attached</span>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowNewVersion(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createVersion.mutate(form)} disabled={createVersion.isPending}>
                {createVersion.isPending ? 'Saving…' : 'Save Version'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{versions.length} version{versions.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              {versions.length === 0 && !isLoading && (
                <Button variant="outline" size="sm" onClick={() => seedInitialVersion.mutate()} disabled={seedInitialVersion.isPending}>
                  Initialize History
                </Button>
              )}
              <Button size="sm" onClick={() => { setForm({ content: document?.content || '', change_summary: '', file_url: '' }); setShowNewVersion(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1" /> New Version
              </Button>
            </div>
          </div>
        )}

        {/* Version List */}
        <div className="space-y-2 mt-2">
          {isLoading && <p className="text-sm text-gray-400 text-center py-4">Loading…</p>}
          {!isLoading && versions.length === 0 && !showNewVersion && (
            <p className="text-sm text-gray-400 text-center py-6">No versions tracked yet. Click "Initialize History" or create a new version.</p>
          )}
          {versions.map(v => (
            <div key={v.id} className={`rounded-xl border p-4 ${v.is_current ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-700 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Version {v.version_number}</span>
                    {v.is_current && <Badge className="bg-indigo-100 text-indigo-700 text-xs">Current</Badge>}
                    <span className="text-xs text-gray-400">{new Date(v.created_date).toLocaleString()}</span>
                    {v.created_by_name && <span className="text-xs text-gray-400">by {v.created_by_name}</span>}
                  </div>
                  {v.change_summary && <p className="text-sm text-gray-600 dark:text-gray-300">{v.change_summary}</p>}
                  {v.file_url && (
                    <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1">
                      <FileText className="w-3 h-3" /> View attached file
                    </a>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreviewVersion(v)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                  </Button>
                  {!v.is_current && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => revertToVersion.mutate(v)} disabled={revertToVersion.isPending}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version {previewVersion?.version_number} — Preview</DialogTitle>
          </DialogHeader>
          <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg whitespace-pre-wrap border border-gray-100 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
            {previewVersion?.content || '(No text content)'}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}