import { useState } from 'react';
import { CATEGORY_FILTER } from '@/constants/hashtagManager';
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
  ChevronDown,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function HashtagManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: 'violet' });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // New pool form state
  const [newHashtag, setNewHashtag] = useState('');
  const [newPoolHashtags, setNewPoolHashtags] = useState('');
  const [newPoolCategories, setNewPoolCategories] = useState(/** @type {string[]} */ ([]));
  const [newPoolIsFavorite, setNewPoolIsFavorite] = useState(false);
  const [customCategories, setCustomCategories] = useState(/** @type {string[]} */ ([]));
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [pendingNewCategory, setPendingNewCategory] = useState('');
  const [deletingPoolId, setDeletingPoolId] = useState(/** @type {string|null} */ (null));
  const queryClient = useQueryClient();

  // TODO: Add a TypeScript type for the HashtagPool object shape so the UI has
  // a known structure to rely on rather than inferring it from runtime data.
  const { data: hashtags = [], isLoading } = useQuery({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.HashtagPool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setNewHashtag('');
      setNewPoolHashtags('');
      setNewPoolCategories([]);
      setNewPoolIsFavorite(false);
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

  const togglePoolCategory = (cat) => {
    if (cat === CATEGORY_FILTER.FAVORITES) {
      setNewPoolIsFavorite((prev) => !prev);
      return;
    }
    setNewPoolCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddHashtag = () => {
    if (!newHashtag.trim() || !newPoolHashtags.trim()) {
      return;
    }
    // Discard any uncommitted new-category input
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
    const nonFavoriteCategories = newPoolCategories.filter((c) => c !== CATEGORY_FILTER.FAVORITES);
    const isFavorite = newPoolIsFavorite || newPoolCategories.includes(CATEGORY_FILTER.FAVORITES);
    // Normalize each token to start with #
    const normalizedHashtags = newPoolHashtags
      .trim()
      .split(/\s+/)
      .map((w) => (w.startsWith('#') ? w : `#${w}`))
      .join(' ');
    addMutation.mutate({
      hashtag: newHashtag.trim().replace(/^#+/, ''),
      category: nonFavoriteCategories.join(' | ') || null,
      hashtags: normalizedHashtags,
      is_favorite: isFavorite,
      usage_count: 0,
    });
  };

  const confirmNewCategory = () => {
    const name = pendingNewCategory.trim().toLowerCase();
    if (!name) {
      return;
    }
    setCustomCategories((prev) => [...new Set([...prev, name])]);
    setNewPoolCategories((prev) => [...new Set([...prev, name])]);
    setShowNewCategoryInput(false);
    setPendingNewCategory('');
  };

  const handleBulkAdd = () => {
    const tags = bulkInput
      .split(/[\n,]/)
      .map((t) => t.replace('#', '').trim())
      .filter((t) => t && !hashtags.some((h) => h.hashtag.toLowerCase() === t.toLowerCase()));

    tags.forEach((tag) => {
      addMutation.mutate({
        hashtag: tag,
        category:
          selectedCategory === CATEGORY_FILTER.ALL ||
          selectedCategory === CATEGORY_FILTER.UNCATEGORIZED ||
          selectedCategory === CATEGORY_FILTER.FAVORITES
            ? null
            : selectedCategory,
        is_favorite: selectedCategory === CATEGORY_FILTER.FAVORITES,
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

  // Get unique individual categories by splitting pipe-separated values
  const splitCategories = (/** @type {string|null|undefined} */ cat) =>
    cat
      ? cat
          .split(' | ')
          .map((/** @type {string} */ c) => c.trim().toLowerCase())
          .filter(Boolean)
      : [];
  const categories = [...new Set(hashtags.flatMap((h) => splitCategories(h.category)))];
  const allCategories = [...new Set([...categories, ...customCategories])];

  const filteredHashtags = hashtags.filter((h) => {
    const matchesSearch =
      !searchQuery || h.hashtag.toLowerCase().includes(searchQuery.toLowerCase());
    const poolCategories = splitCategories(h.category);
    const matchesCategory =
      selectedCategory === CATEGORY_FILTER.ALL ||
      (selectedCategory === CATEGORY_FILTER.FAVORITES && h.is_favorite) ||
      (selectedCategory === CATEGORY_FILTER.UNCATEGORIZED && poolCategories.length === 0) ||
      poolCategories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

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

            {/* TODO: Add a delete control per category row so users can remove categories they no longer need */}
            {allCategories.map((cat) => (
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
                  {hashtags.filter((h) => splitCategories(h.category).includes(cat)).length}
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
          {/* Search */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hashtags..."
                  className="pl-10 w-full"
                />
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

          {/* Create New Hashtag Pool */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Create New Hashtag Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-[3]">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    placeholder="Hashtag pool name..."
                  />
                </div>
                <div className="flex-[2]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                        {newPoolCategories.length === 0 ? (
                          <span className="text-muted-foreground">Add to category...</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {newPoolCategories.map((cat) => (
                              <span
                                key={cat}
                                className="bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded capitalize"
                              >
                                {cat === 'favorites' ? '★ Favorites' : cat}
                              </span>
                            ))}
                          </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                      {allCategories
                        .map((cat) => ({ value: cat, label: cat }))
                        .map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => togglePoolCategory(value)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent capitalize"
                          >
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded border ${
                                newPoolCategories.includes(value)
                                  ? 'bg-violet-600 border-violet-600 text-white'
                                  : 'border-input'
                              }`}
                            >
                              {newPoolCategories.includes(value) && <Check className="h-3 w-3" />}
                            </span>
                            {label}
                          </button>
                        ))}
                      <div className="border-t mt-1 pt-1">
                        <button
                          onClick={() => setShowNewCategoryInput(true)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-violet-600 font-medium"
                        >
                          <Plus className="h-4 w-4" />
                          New Category
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {showNewCategoryInput && (
                <div className="flex gap-2">
                  <Input
                    value={pendingNewCategory}
                    onChange={(e) => setPendingNewCategory(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        confirmNewCategory();
                      }
                      if (e.key === 'Escape') {
                        setShowNewCategoryInput(false);
                        setPendingNewCategory('');
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={confirmNewCategory}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setPendingNewCategory('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <Textarea
                value={newPoolHashtags}
                onChange={(e) => setNewPoolHashtags(e.target.value)}
                placeholder="e.g. #marketing #brand #social (# will be added automatically)"
                rows={4}
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => togglePoolCategory('favorites')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-500 transition-colors"
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      newPoolIsFavorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400'
                    }`}
                  />
                  Add to favorites
                </button>
                <Button
                  onClick={handleAddHashtag}
                  disabled={!newHashtag.trim() || !newPoolHashtags.trim() || addMutation.isPending}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hashtag Pools List */}
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
                <Badge variant="secondary">{filteredHashtags.length} pools</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredHashtags.length === 0 ? (
                <div className="text-center py-12">
                  <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hashtag pools found</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first pool above</p>
                </div>
              ) : (
                <div>
                  {filteredHashtags.map((pool) => {
                    const displayCategories = pool.category
                      ? pool.category
                          .split(' | ')
                          .map((/** @type {string} */ c) => c.trim())
                          .filter(Boolean)
                      : [];
                    return (
                      <div
                        key={pool.id}
                        className="group flex items-start gap-3 px-6 py-4 border-b last:border-b-0"
                      >
                        <button onClick={() => toggleFavorite(pool)} className="mt-0.5 shrink-0">
                          {pool.is_favorite ? (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          ) : (
                            <Star className="w-4 h-4 text-gray-300 hover:text-amber-400 transition-colors" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-violet-600">{pool.hashtag}</span>
                            {displayCategories.length > 0 && (
                              <span className="text-sm text-gray-400">
                                {displayCategories.join(' | ')}
                              </span>
                            )}
                          </div>
                          {pool.hashtags && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                              {pool.hashtags}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* TODO: Add an Edit option here to allow updating the pool's name and hashtags in-place */}
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(pool.hashtags || pool.hashtag)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingPoolId(pool.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPoolId} onOpenChange={(open) => !open && setDeletingPoolId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hashtag Pool</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            Are you sure you want to delete this hashtag pool? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeletingPoolId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingPoolId) {
                  deleteMutation.mutate(deletingPoolId);
                }
                setDeletingPoolId(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
