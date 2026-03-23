import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Upload, AlertCircle } from 'lucide-react';

export default function DocumentUploadModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', fileName || file.name);

      const response = await base44.functions.invoke('uploadAndShareDocument', formData);

      if (response.data.success) {
        const shareLink = `${window.location.origin}${createPageUrl('PublicDocumentViewerWrapper')}?token=${response.data.trackingCode}`;
        setShareLink(shareLink);
        if (onSuccess) {
          onSuccess({ ...response.data, shareLink });
        }
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileName('');
    setShareLink(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a file and get a shareable link for secure access
          </DialogDescription>
        </DialogHeader>

        {!shareLink ? (
          <div className="space-y-4">
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Document Name</label>
              <Input
                type="text"
                placeholder="e.g., Contract_2024.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={!!shareLink}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select File</label>
              <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {file ? file.name : 'Click to upload or drag'}
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS up to 50MB</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1">
                {uploading ? 'Uploading...' : 'Generate Share Link'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-700">
                ✓ Document uploaded successfully!
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Share this link with anyone to let them view and download the document
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
