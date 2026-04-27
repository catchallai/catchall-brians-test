import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Target, Trash2, Download, RefreshCw, Loader2 } from 'lucide-react';
import KeywordRankCard from '@/components/seo/KeywordRankCard';
import KeywordModal from '@/components/modals/KeywordModal';
import EmptyState from '@/components/ui/EmptyState';
import LiveDataIntegration from '@/components/seo/LiveDataIntegration';
import { toast } from 'sonner';

export default function Keywords() {
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showLiveData, setShowLiveData] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['keywords', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) {
        return [];
      }
      return await base44.entities.Keyword.filter(
        { business_id: user.current_business_id },
        '-created_date',
        500
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) {
        return [];
      }
      return await base44.entities.Website.filter(
        { business_id: user.current_business_id },
        '-created_date',
        50
      );
    },
    enabled: !!user?.current_business_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Keyword.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Keyword.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      setShowModal(false);
      setEditingKeyword(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Keyword.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      setSelectedIds([]);
    },
  });

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }
    if (confirm(`Delete ${selectedIds.length} keywords?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Keyword', 'Position', 'Search Volume', 'Difficulty', 'CPC', 'Target URL'];
    const rows = filteredKeywords.map((k) => [
      k.keyword,
      k.current_position || '',
      k.search_volume || '',
      k.difficulty || '',
      k.cpc || '',
      k.target_url || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredKeywords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredKeywords.map((k) => k.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSave = (data) => {
    if (editingKeyword) {
      updateMutation.mutate({ id: editingKeyword.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (keyword) => {
    setEditingKeyword(keyword);
    setShowModal(true);
  };

  const filteredKeywords = keywords.filter((keyword) => {
    const matchesSearch =
      !searchTerm || keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWebsite = websiteFilter === 'all' || keyword.website_id === websiteFilter;
    const matchesPosition =
      positionFilter === 'all' ||
      (positionFilter === 'top3' && keyword.current_position && keyword.current_position <= 3) ||
      (positionFilter === 'top10' && keyword.current_position && keyword.current_position <= 10) ||
      (positionFilter === 'top20' && keyword.current_position && keyword.current_position <= 20) ||
      (positionFilter === 'below20' &&
        (!keyword.current_position || keyword.current_position > 20));
    return matchesSearch && matchesWebsite && matchesPosition;
  });

  const top10Count = keywords.filter((k) => k.current_position && k.current_position <= 10).length;
  const avgVolume =
    keywords.length > 0
      ? Math.round(keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0) / keywords.length)
      : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Keywords</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {keywords.length} tracked • {top10Count} in top 10 • Avg volume:{' '}
            {avgVolume.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="gap-2"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowLiveData(!showLiveData)}
            className="gap-2 dark:bg-gray-800 dark:border-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            {showLiveData ? 'Hide' : 'Live Data'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2 dark:bg-gray-800 dark:border-gray-700"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => {
              setEditingKeyword(null);
              setShowModal(true);
            }}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Live Data Integration */}
      {showLiveData && websites.length > 0 && (
        <LiveDataIntegration
          website={
            websites.find((w) => (websiteFilter === 'all' ? true : w.id === websiteFilter)) ||
            websites[0]
          }
          onDataFetched={async ({ source, data }) => {
            if (source === 'gsc' && data.keywords) {
              let synced = 0;
              for (const kw of data.keywords.slice(0, 50)) {
                const existing = keywords.find(
                  (k) => k.keyword?.toLowerCase() === kw.keyword?.toLowerCase()
                );
                if (existing) {
                  await base44.entities.Keyword.update(existing.id, {
                    current_position: Math.round(kw.position),
                    previous_position: existing.current_position,
                    search_volume: kw.impressions,
                  });
                  synced++;
                }
              }
              queryClient.invalidateQueries({ queryKey: ['keywords'] });
              toast.success(`Synced ${synced} keywords from Google Search Console`);
            }

            if ((source === 'semrush' || source === 'ahrefs') && data.keywords) {
              let synced = 0;
              for (const kw of data.keywords) {
                const existing = keywords.find(
                  (k) => k.keyword?.toLowerCase() === kw.keyword?.toLowerCase()
                );
                if (existing) {
                  await base44.entities.Keyword.update(existing.id, {
                    current_position: kw.position,
                    previous_position: existing.current_position,
                    search_volume: kw.search_volume,
                    difficulty: source === 'semrush' ? kw.difficulty : kw.keyword_difficulty,
                    cpc: kw.cpc,
                  });
                  synced++;
                }
              }
              queryClient.invalidateQueries({ queryKey: ['keywords'] });
              toast.success(
                `Synced ${synced} keywords from ${source === 'semrush' ? 'Semrush' : 'Ahrefs'}`
              );
            }
          }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-800 dark:border-gray-700">
            <SelectValue placeholder="Website" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Websites</SelectItem>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>
                {website.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full sm:w-40 dark:bg-gray-800 dark:border-gray-700">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="top3">Top 3</SelectItem>
            <SelectItem value="top10">Top 10</SelectItem>
            <SelectItem value="top20">Top 20</SelectItem>
            <SelectItem value="below20">Below 20</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Select */}
      {filteredKeywords.length > 0 && (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedIds.length === filteredKeywords.length && filteredKeywords.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select all'}
          </span>
        </div>
      )}

      {/* Keyword List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredKeywords.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No keywords tracked"
          description="Start tracking keywords to monitor your search engine rankings."
          actionLabel="Add Keyword"
          onAction={() => {
            setEditingKeyword(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKeywords.map((keyword) => (
            <div key={keyword.id} className="relative group">
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedIds.includes(keyword.id)}
                  onCheckedChange={() => toggleSelect(keyword.id)}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div onClick={() => handleEdit(keyword)} className="cursor-pointer">
                <KeywordRankCard keyword={keyword} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <KeywordModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingKeyword(null);
        }}
        keyword={editingKeyword}
        websites={websites}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
