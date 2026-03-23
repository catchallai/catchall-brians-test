import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Image, Video, FileText, Loader2, ExternalLink } from 'lucide-react';

export default function FolderContentModal({ folder, open, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['folder-assets', folder?.id],
    queryFn: () => base44.entities.MediaAsset.filter({ folder_id: folder.id }),
    enabled: !!folder?.id,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['folder-logs', folder?.id],
    queryFn: () =>
      base44.entities.MediaFileLog.filter({ folder_id: folder.id }, '-created_date', 20),
    enabled: !!folder?.id,
  });

  const logMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.MediaFileLog.create({
        ...data,
        user_email: user?.email,
        user_name: user?.full_name,
      }),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MediaFolder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media-folders'] }),
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-assets'] });
      setUploading(false);
    },
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    if (!files.length || !folder) {
      return;
    }

    setUploading(true);

    for (const file of files) {
      try {
        // Upload file
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = uploadResponse.file_url;

        // Create asset record
        await createAssetMutation.mutateAsync({
          name: file.name,
          file_type: file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
              ? 'video'
              : 'document',
          file_url: fileUrl,
          file_size: file.size,
          folder_id: folder.id,
          folder_name: folder.name,
        });

        // Log the upload
        await logMutation.mutateAsync({
          folder_id: folder.id,
          folder_name: folder.name,
          file_name: file.name,
          file_url: fileUrl,
          action: 'upload',
          file_size: file.size,
        });

        // Update folder stats
        await updateFolderMutation.mutateAsync({
          id: folder.id,
          data: {
            file_count: (folder.file_count || 0) + 1,
            total_size: (folder.total_size || 0) + file.size,
          },
        });
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
  };

  const handleDownload = async (asset) => {
    try {
      // Log the download
      await logMutation.mutateAsync({
        folder_id: folder.id,
        folder_name: folder.name,
        file_name: asset.name,
        file_url: asset.file_url,
        asset_id: asset.id,
        action: 'download',
        file_size: asset.file_size,
      });

      // Trigger download
      const a = document.createElement('a');
      a.href = asset.file_url;
      a.download = asset.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) {
      return '0 KB';
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const getFileIcon = (type) => {
    if (type === 'image') {
      return Image;
    }
    if (type === 'video') {
      return Video;
    }
    return FileText;
  };

  if (!folder) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {folder.name}
            <Badge>{assets.length} files</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragging
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                <p className="text-sm text-gray-600">Uploading files...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Drag & drop files here
                  </p>
                  <p className="text-xs text-gray-500">or</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
              </div>
            )}
          </div>

          {/* Files Grid */}
          {assets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const Icon = getFileIcon(asset.file_type);
                return (
                  <div
                    key={asset.id}
                    className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-all"
                  >
                    {asset.file_type === 'image' ? (
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatSize(asset.file_size)}</p>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(asset)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" asChild>
                        <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No files in this folder yet</p>
            </div>
          )}

          {/* Activity Log */}
          {logs.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <span className="truncate flex-1">
                      {log.user_name || log.user_email} {log.action}ed {log.file_name}
                    </span>
                    <span className="text-gray-400">
                      {new Date(log.created_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
