import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Target } from "lucide-react";
import KeywordRankCard from '@/components/seo/KeywordRankCard';
import KeywordModal from '@/components/modals/KeywordModal';
import EmptyState from '@/components/ui/EmptyState';

export default function Keywords() {
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 500),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
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

  const filteredKeywords = keywords.filter(keyword => {
    const matchesSearch = !searchTerm || 
      keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWebsite = websiteFilter === 'all' || keyword.website_id === websiteFilter;
    const matchesPosition = positionFilter === 'all' || 
      (positionFilter === 'top3' && keyword.current_position && keyword.current_position <= 3) ||
      (positionFilter === 'top10' && keyword.current_position && keyword.current_position <= 10) ||
      (positionFilter === 'top20' && keyword.current_position && keyword.current_position <= 20) ||
      (positionFilter === 'below20' && (!keyword.current_position || keyword.current_position > 20));
    return matchesSearch && matchesWebsite && matchesPosition;
  });

  const top10Count = keywords.filter(k => k.current_position && k.current_position <= 10).length;
  const avgVolume = keywords.length > 0 
    ? Math.round(keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0) / keywords.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keywords</h1>
          <p className="text-gray-500 mt-1">
            {keywords.length} tracked • {top10Count} in top 10 • Avg volume: {avgVolume.toLocaleString()}
          </p>
        </div>
        <Button onClick={() => { setEditingKeyword(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Add Keyword
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Website" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Websites</SelectItem>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>{website.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full sm:w-40">
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
          onAction={() => { setEditingKeyword(null); setShowModal(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKeywords.map((keyword) => (
            <div key={keyword.id} onClick={() => handleEdit(keyword)} className="cursor-pointer">
              <KeywordRankCard keyword={keyword} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <KeywordModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingKeyword(null); }}
        keyword={editingKeyword}
        websites={websites}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}