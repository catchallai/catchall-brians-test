import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, Globe, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ContentExporter({ article, open, onClose }) {
  const [platform, setPlatform] = useState('wordpress');
  const [exporting, setExporting] = useState(false);

  const PLATFORMS = [
    { id: 'wordpress', label: 'WordPress', icon: Globe },
    { id: 'medium', label: 'Medium', icon: FileText },
    { id: 'ghost', label: 'Ghost', icon: FileText },
    { id: 'markdown', label: 'Markdown File', icon: Download },
    { id: 'html', label: 'HTML File', icon: Download },
  ];

  const handleExport = async () => {
    setExporting(true);

    try {
      if (platform === 'markdown' || platform === 'html') {
        const content =
          platform === 'markdown'
            ? `# ${article.title}\n\n${article.content}`
            : `<!DOCTYPE html><html><head><title>${article.title}</title></head><body><h1>${article.title}</h1><div>${article.content}</div></body></html>`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${article.title}.${platform === 'markdown' ? 'md' : 'html'}`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('File downloaded');
      } else {
        toast.success(`Export to ${platform} - Integration coming soon`);
      }

      // Log export
      const exportHistory = article.export_history || [];
      await base44.entities.GeneratedArticle.update(article.id, {
        export_history: [
          ...exportHistory,
          {
            platform,
            exported_at: new Date().toISOString(),
          },
        ],
      });

      onClose();
    } catch (_error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (!article) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Article</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <p className="text-blue-800 dark:text-blue-300">
              <strong>{article.title}</strong>
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
              {article.word_count} words • SEO Score: {article.seo_score}%
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
