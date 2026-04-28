import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Upload,
  Image,
  FileVideo,
  FileText,
  Folder,
  Download,
  Copy,
  Trash2,
  Loader2,
  X,
  Check,
  Grid,
  List,
  Star,
  Filter,
  CheckSquare,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import BulkAssetActions from '@/components/assets/BulkAssetActions';
import FolderManager from '@/components/assets/FolderManager';

const FILE_TYPES = [
  { id: 'logo', label: 'Logos', icon: Star },
  { id: 'icon', label: 'Icons', icon: Grid },
  { id: 'image', label: 'Images', icon: Image },
  { id: 'video', label: 'Videos', icon: FileVideo },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'other', label: 'Other', icon: Folder },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export default function MediaLibrary() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [uploading, setUploading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    file_type: 'image',
    category: '',
    tags: [],
    description: '',
    folder_id: null,
  });
  const [tagInput, setTagInput] = useState('');
  const [duplicateUploadFile, setDuplicateUploadFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['media-assets'],
    queryFn: () => base44.entities.MediaAsset.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setShowUploadModal(false);
      resetForm();
      toast.success('Asset uploaded successfully');
    },
    onError: () => toast.error('Failed to upload asset'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setSelectedAsset(null);
      toast.success('Asset deleted');
    },
  });

  const resetForm = () => {
    setNewAsset({ name: '', file_type: 'image', category: '', tags: [], description: '' });
    setTagInput('');
  };

  const performFileUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create audit log
      const newAssetData = {
        ...newAsset,
        file_url,
        name: newAsset.name || file.name.split('.')[0],
        file_size: formatFileSize(file.size),
        file_hash: file.name + file.size, // Simple hash
        folder_id: currentFolderId,
      };

      setNewAsset(newAssetData);
    } catch (_error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return;
    }

    // Check for duplicates using file name as simple hash
    const existingAssets = assets.filter((a) => a.name === file.name);
    if (existingAssets.length > 0) {
      setDuplicateUploadFile(file);
      return;
    }

    await performFileUpload(file);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newAsset.tags.includes(tagInput.trim())) {
      setNewAsset((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setNewAsset((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    if (!newAsset.file_url || !newAsset.name) {
      return;
    }

    const asset = await createMutation.mutateAsync(newAsset);

    // Create audit log
    await base44.entities.AssetAuditLog.create({
      asset_id: asset.id,
      action: 'uploaded',
      user_email: (await base44.auth.me()).email,
      details: { file_type: newAsset.file_type, file_size: newAsset.file_size },
    });
  };

  const toggleSelectAsset = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !searchQuery ||
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      asset.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.file_type === filterType;
    const matchesFolder = currentFolderId === null || asset.folder_id === currentFolderId;
    return matchesSearch && matchesType && matchesFolder;
  });

  const categories = [...new Set(assets.map((a) => a.category).filter(Boolean))];

  const getFileIcon = (type) => {
    const config = FILE_TYPES.find((t) => t.id === type);
    return config?.icon || Folder;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white dark:bg-gray-900 p-4 hidden lg:block">
        <FolderManager onFolderSelect={setCurrentFolderId} currentFolderId={currentFolderId} />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8 space-y-6 bg-gray-50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media Library</h1>
            <p className="text-gray-500 mt-1">
              Store and organize logos, icons, and brand assets • Max {MAX_FILE_SIZE / 1024 / 1024}
              MB per file
            </p>
          </div>
          <div className="flex gap-2">
            {selectedAssets.length > 0 && (
              <Button variant="outline" onClick={() => setSelectedAssets([])} className="gap-2">
                <CheckSquare className="w-4 h-4" />
                {selectedAssets.length} Selected
              </Button>
            )}
            <Button
              onClick={() => setShowUploadModal(true)}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Upload className="w-4 h-4" />
              Upload Asset
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {FILE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {FILE_TYPES.map((type) => {
            const count = assets.filter((a) => a.file_type === type.id).length;
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  filterType === type.id ? 'ring-2 ring-violet-500' : ''
                }`}
                onClick={() => setFilterType(filterType === type.id ? 'all' : type.id)}
              >
                <CardContent className="p-3 text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1 text-violet-500" />
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{type.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Assets Grid/List */}
        {filteredAssets.length === 0 ? (
          <EmptyState
            icon={Image}
            title="No assets found"
            description={
              searchQuery ? 'Try adjusting your search' : 'Upload your first asset to get started'
            }
            actionLabel="Upload Asset"
            onAction={() => setShowUploadModal(true)}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className={`glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group relative ${
                  selectedAssets.includes(asset.id) ? 'ring-2 ring-violet-500' : ''
                }`}
                onClick={(e) => {
                  if (e.shiftKey) {
                    toggleSelectAsset(asset.id);
                  } else {
                    setSelectedAsset(asset);
                  }
                }}
              >
                {selectedAssets.includes(asset.id) && (
                  <div className="absolute top-2 left-2 z-10 bg-violet-600 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div className="aspect-square bg-gray-100 relative">
                  {['logo', 'icon', 'image'].includes(asset.file_type) ? (
                    <img
                      src={asset.file_url}
                      alt={asset.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {React.createElement(getFileIcon(asset.file_type), {
                        className: 'w-12 h-12 text-gray-400',
                      })}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(asset.file_url);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <a href={asset.file_url} download onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {asset.file_type}
                    </Badge>
                    {asset.category && (
                      <Badge className="text-xs bg-violet-100 text-violet-700">
                        {asset.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    {['logo', 'icon', 'image'].includes(asset.file_type) ? (
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className="w-full h-full object-contain p-1 rounded-lg"
                      />
                    ) : (
                      React.createElement(getFileIcon(asset.file_type), {
                        className: 'w-8 h-8 text-gray-400',
                      })
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {asset.file_type}
                      </Badge>
                      {asset.category && (
                        <Badge className="text-xs bg-violet-100 text-violet-700">
                          {asset.category}
                        </Badge>
                      )}
                      {asset.file_size && (
                        <span className="text-xs text-gray-500">{asset.file_size}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(asset.file_url);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <a href={asset.file_url} download onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed rounded-xl p-6 text-center">
                {newAsset.file_url ? (
                  <div className="space-y-2">
                    <img
                      src={newAsset.file_url}
                      alt="Preview"
                      className="max-h-32 mx-auto object-contain"
                    />
                    <p className="text-sm text-emerald-600 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> File uploaded
                    </p>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,video/*,.pdf,.doc,.docx"
                    />
                    {uploading ? (
                      <Loader2 className="w-10 h-10 mx-auto text-violet-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, PDF, MP4</p>
                      </>
                    )}
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newAsset.name}
                    onChange={(e) => setNewAsset((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Asset name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newAsset.file_type}
                    onValueChange={(v) => setNewAsset((prev) => ({ ...prev, file_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newAsset.category}
                  onChange={(e) => setNewAsset((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Brand, Marketing, Social"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {newAsset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newAsset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newAsset.description}
                  onChange={(e) =>
                    setNewAsset((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!newAsset.file_url || !newAsset.name || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Upload Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Asset Detail Modal */}
        <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedAsset?.name}</DialogTitle>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[200px]">
                  {['logo', 'icon', 'image'].includes(selectedAsset.file_type) ? (
                    <img
                      src={selectedAsset.file_url}
                      alt={selectedAsset.name}
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    React.createElement(getFileIcon(selectedAsset.file_type), {
                      className: 'w-20 h-20 text-gray-400',
                    })
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedAsset.file_type}</Badge>
                    {selectedAsset.category && (
                      <Badge className="bg-violet-100 text-violet-700">
                        {selectedAsset.category}
                      </Badge>
                    )}
                    {selectedAsset.file_size && (
                      <span className="text-sm text-gray-500">{selectedAsset.file_size}</span>
                    )}
                  </div>

                  {selectedAsset.description && (
                    <p className="text-sm text-gray-600">{selectedAsset.description}</p>
                  )}

                  {selectedAsset.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedAsset.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>File URL</Label>
                  <div className="flex gap-2">
                    <Input value={selectedAsset.file_url} readOnly className="text-xs" />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(selectedAsset.file_url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(selectedAsset.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                  <a href={selectedAsset.file_url} download>
                    <Button className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Actions Bar */}
        <BulkAssetActions
          selectedAssets={selectedAssets}
          onClear={() => setSelectedAssets([])}
          onComplete={() => {
            setSelectedAssets([]);
            queryClient.invalidateQueries({ queryKey: ['media-assets'] });
          }}
        />

        {/* Duplicate Upload Confirm */}
        <ConfirmDialog
          open={!!duplicateUploadFile}
          onClose={() => {
            if (!uploading) {
              setDuplicateUploadFile(null);
            }
          }}
          onConfirm={async () => {
            const file = duplicateUploadFile;
            if (file) {
              await performFileUpload(file);
            }
            setDuplicateUploadFile(null);
          }}
          title="Asset already exists"
          description="An asset with this name already exists. Upload anyway?"
          confirmLabel="Upload"
          isLoading={uploading}
        />
      </div>
    </div>
  );
}
