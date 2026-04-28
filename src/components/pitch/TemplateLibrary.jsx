import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Star,
  TrendingUp,
  Building2,
  Heart,
  Laptop,
  Stethoscope,
  DollarSign,
  User,
  Search,
} from 'lucide-react';

const categoryIcons = {
  startup: Sparkles,
  investor: TrendingUp,
  sales: DollarSign,
  product: Laptop,
  corporate: Building2,
  nonprofit: Heart,
  tech: Laptop,
  healthcare: Stethoscope,
  finance: DollarSign,
  custom: User,
};

export default function TemplateLibrary({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['pitch-deck-templates'],
    queryFn: () => base44.entities.PitchDeckTemplate.list('-usage_count', 100),
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        await base44.entities.PitchDeckTemplate.update(templateId, {
          usage_count: (template.usage_count || 0) + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-deck-templates'] });
    },
  });

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = async (template) => {
    await useTemplateMutation.mutateAsync(template.id);
    onSelect(template);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="startup">Startup</TabsTrigger>
              <TabsTrigger value="investor">Investor</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
              <TabsTrigger value="corporate">Corporate</TabsTrigger>
              <TabsTrigger value="tech">Tech</TabsTrigger>
              <TabsTrigger value="healthcare">Health</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredTemplates.map((template) => {
              const Icon = categoryIcons[template.category] || User;
              return (
                <Card
                  key={template.id}
                  className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                  onClick={() => handleSelect(template)}
                >
                  {/* Preview */}
                  <div
                    className="h-32 flex items-center justify-center relative"
                    style={{
                      backgroundColor: template.branding?.background_color || '#f9fafb',
                      borderBottom: `3px solid ${template.branding?.primary_color || '#7c3aed'}`,
                    }}
                  >
                    {template.thumbnail_url ? (
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          className="w-12 h-12"
                          style={{ color: template.branding?.primary_color || '#7c3aed' }}
                        />
                        <div
                          className="text-2xl font-bold"
                          style={{
                            color: template.branding?.primary_color || '#7c3aed',
                            fontFamily: template.branding?.font_heading || 'Inter',
                          }}
                        >
                          {template.name}
                        </div>
                      </div>
                    )}
                    {template.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-amber-500 border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {template.default_slides?.length || 0} slides
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
