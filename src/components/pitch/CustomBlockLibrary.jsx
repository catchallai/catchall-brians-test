import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutGrid,
  Image,
  BarChart3,
  Quote,
  Zap,
  TrendingUp,
  Clock,
  GitCompare,
  Search,
} from 'lucide-react';

const blockIcons = {
  text_image: Image,
  two_column: LayoutGrid,
  chart: BarChart3,
  quote: Quote,
  cta: Zap,
  stats: TrendingUp,
  timeline: Clock,
  comparison: GitCompare,
  custom: LayoutGrid,
};

export default function CustomBlockLibrary({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [blockType, setBlockType] = useState('all');
  const queryClient = useQueryClient();

  const { data: blocks = [] } = useQuery({
    queryKey: ['custom-slide-blocks'],
    queryFn: () => base44.entities.CustomSlideBlock.list('-usage_count', 100),
  });

  const useBlockMutation = useMutation({
    mutationFn: async (blockId) => {
      const block = blocks.find((b) => b.id === blockId);
      if (block) {
        await base44.entities.CustomSlideBlock.update(blockId, {
          usage_count: (block.usage_count || 0) + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-slide-blocks'] });
    },
  });

  const filteredBlocks = blocks.filter((b) => {
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = blockType === 'all' || b.block_type === blockType;
    return matchesSearch && matchesType;
  });

  const handleSelect = async (block) => {
    await useBlockMutation.mutateAsync(block.id);
    onSelect(block);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Custom Block Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks..."
              className="pl-10"
            />
          </div>

          {/* Block Type Filter */}
          <Tabs value={blockType} onValueChange={setBlockType}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="text_image">Text+Image</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Blocks Grid */}
          <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredBlocks.map((block) => {
              const Icon = blockIcons[block.block_type] || LayoutGrid;
              return (
                <Card
                  key={block.id}
                  className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                  onClick={() => handleSelect(block)}
                >
                  <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                    {block.thumbnail_url ? (
                      <img
                        src={block.thumbnail_url}
                        alt={block.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      {block.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{block.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {block.block_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredBlocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blocks found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
