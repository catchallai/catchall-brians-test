import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Hash,
  Trash2,
  Copy,
  Check,
  Search,
  Folder,
  FolderPlus,
  MoreVertical,
  Star,
  StarOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function HashtagManager() {
  const [newHashtag, setNewHashtag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: 'violet' });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: hashtags = [], isLoading } = useQuery({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.HashtagPool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setNewHashtag('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HashtagPool.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HashtagPool.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const handleAddHashtag = () => {
    if (!newHashtag.trim()) {
      return;
    }
    const cleanTag = newHashtag.replace('#', '').trim();
    if (hashtags.some((h) => h.hashtag.toLowerCase() === cleanTag.toLowerCase())) {
      return; // Already exists
    }
    addMutation.mutate({
      hashtag: cleanTag,
      category: selectedCategory === 'all' ? null : selectedCategory,
      usage_count: 0,
    });
  };

  const handleBulkAdd = () => {
    const tags = bulkInput
      .split(/[\n,]/)
      .map((t) => t.replace('#', '').trim())
      .filter((t) => t && !hashtags.some((h) => h.hashtag.toLowerCase() === t.toLowerCase()));

    tags.forEach((tag) => {
      addMutation.mutate({
        hashtag: tag,
        category: selectedCategory === 'all' ? null : selectedCategory,
        usage_count: 0,
      });
    });
    setBulkInput('');
    setShowBulkModal(false);
  };

  const toggleFavorite = (hashtag) => {
    updateMutation.mutate({
      id: hashtag.id,
      data: { is_favorite: !hashtag.is_favorite },
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllHashtags = () => {
    const allTags = filteredHashtags.map((h) => `#${h.hashtag}`).join(' ');
    navigator.clipboard.writeText(allTags);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Get unique categories
  const categories = [...new Set(hashtags.map((h) => h.category).filter(Boolean))];

  const filteredHashtags = hashtags.filter((h) => {
    const matchesSearch =
      !searchQuery || h.hashtag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'favorites' && h.is_favorite) ||
      (selectedCategory === 'uncategorized' && !h.category) ||
      h.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryColors = {
    brand: 'bg-violet-100 text-violet-700 border-violet-200',
    product: 'bg-blue-100 text-blue-700 border-blue-200',
    campaign: 'bg-pink-100 text-pink-700 border-pink-200',
    trending: 'bg-amber-100 text-amber-700 border-amber-200',
    industry: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    location: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[600px] rounded-2xl" />
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hashtag Pool</h1>
          <p className="text-gray-500 mt-1">Manage and organize your hashtag collections</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowBulkModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Bulk Add
          </Button>
          <Button variant="outline" onClick={copyAllHashtags} className="gap-2">
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedAll ? 'Copied!' : 'Copy All'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <Card className="border-0 shadow-sm rounded-2xl h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Categories
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCategoryModal(true)}
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                All Hashtags
              </span>
              <Badge variant="secondary" className="text-xs">
                {hashtags.length}
              </Badge>
            </button>

            <button
              onClick={() => setSelectedCategory('favorites')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                selectedCategory === 'favorites'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Favorites
              </span>
              <Badge variant="secondary" className="text-xs">
                {hashtags.filter((h) => h.is_favorite).length}
              </Badge>
            </button>

            <div className="border-t my-3" />

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  {cat}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {hashtags.filter((h) => h.category === cat).length}
                </Badge>
              </button>
            ))}

            <button
              onClick={() => setSelectedCategory('uncategorized')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                selectedCategory === 'uncategorized'
                  ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Uncategorized
              </span>
              <Badge variant="secondary" className="text-xs">
                {hashtags.filter((h) => !h.category).length}
              </Badge>
            </button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Add & Search */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hashtags..."
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    placeholder="Add new hashtag"
                    className="w-48"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                  />
                  <Button
                    onClick={handleAddHashtag}
                    disabled={!newHashtag.trim() || addMutation.isPending}
                    className="gap-2 bg-violet-600 hover:bg-violet-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-violet-600">{hashtags.length}</p>
                <p className="text-xs text-gray-500">Total Hashtags</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {hashtags.filter((h) => h.is_favorite).length}
                </p>
                <p className="text-xs text-gray-500">Favorites</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{categories.length}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {hashtags.reduce((acc, h) => acc + (h.usage_count || 0), 0)}
                </p>
                <p className="text-xs text-gray-500">Total Uses</p>
              </CardContent>
            </Card>
          </div>

          {/* Hashtags Grid */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>
                  {selectedCategory === 'all'
                    ? 'All Hashtags'
                    : selectedCategory === 'favorites'
                      ? 'Favorite Hashtags'
                      : selectedCategory === 'uncategorized'
                        ? 'Uncategorized'
                        : `${selectedCategory} Hashtags`}
                </span>
                <Badge variant="secondary">{filteredHashtags.length} hashtags</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredHashtags.length === 0 ? (
                <div className="text-center py-12">
                  <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hashtags found</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first hashtag above</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredHashtags.map((hashtag) => (
                    <div
                      key={hashtag.id}
                      className={`group relative flex items-center gap-2 px-3 py-2 rounded-full border transition-all hover:shadow-md ${
                        hashtag.category && categoryColors[hashtag.category]
                          ? categoryColors[hashtag.category]
                          : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleFavorite(hashtag)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {hashtag.is_favorite ? (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>

                      <span className="font-medium text-sm">#{hashtag.hashtag}</span>

                      {hashtag.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {hashtag.usage_count}
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyToClipboard(`#${hashtag.hashtag}`)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(hashtag.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Add Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Hashtags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Hashtags (one per line or comma-separated)</Label>
              <Textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="#marketing, #social, #brand&#10;#growth&#10;#business"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAdd} className="bg-violet-600 hover:bg-violet-700">
                Add Hashtags
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., brand, campaign, product"
              />
            </div>
            <p className="text-sm text-gray-500">
              Categories help organize your hashtags. You can assign hashtags to categories when
              editing them.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Categories are implicit - just close and user can assign to hashtags
                  setShowCategoryModal(false);
                  setNewCategory({ name: '', color: 'violet' });
                }}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Save Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
