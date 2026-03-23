import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Upload, Youtube, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MediaEmbedModal({ open, onClose, onEmbed }) {
  const [url, setUrl] = useState('');
  const [embedType, setEmbedType] = useState('video');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onEmbed({ type: 'upload', url: file_url, fileName: file.name });
      onClose();
      setUrl('');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmbed = () => {
    if (!url) {
      return;
    }

    let type = embedType;
    // Auto-detect YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      type = 'youtube';
    } else if (url.includes('vimeo.com')) {
      type = 'vimeo';
    }

    onEmbed({ type, url });
    onClose();
    setUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Embed Media</DialogTitle>
        </DialogHeader>

        <Tabs value={embedType} onValueChange={setEmbedType}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="link">Website</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4">
            <div>
              <Label>Video URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube, Vimeo, or direct video URL"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                <Youtube className="w-3 h-3 inline mr-1" />
                Supports YouTube, Vimeo, and direct video links
              </p>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div>
              <Label>Website URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                <Globe className="w-3 h-3 inline mr-1" />
                Embed interactive website or demo
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {isUploading ? 'Uploading...' : 'Click to upload image or video'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {embedType !== 'upload' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleEmbed}
              disabled={!url}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Embed
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
