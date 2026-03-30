import { useState } from 'react';
import { CATEGORY_FILTER } from '@/constants/hashtagManager';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Copy, Check } from 'lucide-react';
import { CategoriesSidebar } from '@/components/hashtags/CategoriesSidebar';
import { CreateHashtagPoolSection } from '@/components/hashtags/CreateHashtagPoolSection';
import { AllHashtagsSection } from '@/components/hashtags/AllHashtagsSection';

const splitCategories = (cat) =>
  cat
    ? cat
        .split(' | ')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    : [];

export default function HashtagManager() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customCategories, setCustomCategories] = useState(/** @type {string[]} */ ([]));
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

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

  const copyAllHashtags = () => {
    const toExport =
      selectedCategory === CATEGORY_FILTER.ALL
        ? hashtags
        : hashtags.filter((h) => {
            const cats = splitCategories(h.category);
            if (selectedCategory === CATEGORY_FILTER.FAVORITES) {
              return h.is_favorite;
            }
            if (selectedCategory === CATEGORY_FILTER.UNCATEGORIZED) {
              return cats.length === 0;
            }
            return cats.includes(selectedCategory);
          });
    navigator.clipboard.writeText(toExport.map((h) => `#${h.hashtag}`).join(' '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const categories = [...new Set(hashtags.flatMap((h) => splitCategories(h.category)))];

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
        <CategoriesSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={() => setShowCategoryModal(true)}
          customCategories={customCategories}
        />

        <div className="lg:col-span-3 space-y-4">
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

          <CreateHashtagPoolSection
            customCategories={customCategories}
            onNewCategoryAdded={(cat) =>
              setCustomCategories((prev) => [...new Set([...prev, cat])])
            }
          />

          <AllHashtagsSection selectedCategory={selectedCategory} />
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
