import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreHorizontal, Trash2, Edit, FileText, Eye, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function BrandGuidelineManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', guidelines: '', color_palette: '', typography: '', logo_url: '', voice_tone: '' });
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brand-guidelines'],
    queryFn: () => base44.entities.Brand.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Brand.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-guidelines'] });
      setIsOpen(false);
      setFormData({ name: '', guidelines: '', color_palette: '', typography: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Brand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-guidelines'] });
      setIsOpen(false);
      setEditingId(null);
      setFormData({ name: '', guidelines: '', color_palette: '', typography: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Brand.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-guidelines'] });
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (brand) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name || '',
      guidelines: brand.guidelines || '',
      color_palette: brand.color_palette || '',
      typography: brand.typography || '',
      logo_url: brand.logo_url || '',
      voice_tone: brand.voice_tone || '',
    });
    setIsOpen(true);
  };

  const parseColors = (colorString) => {
    if (!colorString) return [];
    return colorString.split(',').map((c) => {
      const parts = c.trim().split(':');
      return { name: parts[0]?.trim() || 'Color', value: parts[1]?.trim() || '#000000' };
    });
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.guidelines?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brand Guidelines</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage brand styles, colors, and guidelines
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', guidelines: '', color_palette: '', typography: '' });
              }}
              className="bg-violet-600 hover:bg-violet-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              New Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Brand' : 'Create Brand Guidelines'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>Brand Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Main Brand"
                />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Brand Voice & Tone</Label>
                <Textarea
                  value={formData.voice_tone}
                  onChange={(e) => setFormData({ ...formData, voice_tone: e.target.value })}
                  placeholder="e.g. Professional, Friendly, Innovative..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Color Palette</Label>
                <Input
                  value={formData.color_palette}
                  onChange={(e) => setFormData({ ...formData, color_palette: e.target.value })}
                  placeholder="Primary: #6366f1, Secondary: #8b5cf6, Accent: #ec4899"
                />
                <p className="text-xs text-gray-500 mt-1">Format: Label: #HEX, Label: #HEX</p>
              </div>
              <div>
                <Label>Typography</Label>
                <Textarea
                  value={formData.typography}
                  onChange={(e) => setFormData({ ...formData, typography: e.target.value })}
                  placeholder="Headings: Inter Bold, Body: Inter Regular..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Guidelines</Label>
                <Textarea
                  value={formData.guidelines}
                  onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                  placeholder="Detailed brand guidelines and usage rules..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Grid */}
      {filteredBrands.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No brand guidelines yet</p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', guidelines: '', color_palette: '', typography: '' });
                }}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Brand
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{brand.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingId(brand.id)} className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(brand)} className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(brand.id)}
                        className="text-red-600 gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {brand.logo_url && (
                  <img src={brand.logo_url} alt={brand.name} className="h-12 object-contain" />
                )}
                {brand.color_palette && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Colors
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {parseColors(brand.color_palette).map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className="w-8 h-8 rounded border border-gray-200 dark:border-gray-700"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400">
                            {color.name.substring(0, 6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {brand.voice_tone && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Voice & Tone
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {brand.voice_tone}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
                  {new Date(brand.created_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      {viewingId && (
        <Dialog open={!!viewingId} onOpenChange={() => setViewingId(null)}>
          <DialogContent className="max-w-2xl">
            {(() => {
              const brand = brands.find((b) => b.id === viewingId);
              return brand ? (
                <div>
                  <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <DialogTitle>{brand.name}</DialogTitle>
                    <button onClick={() => setViewingId(null)} className="p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </DialogHeader>
                  <div className="space-y-6 mt-6 max-h-[70vh] overflow-y-auto">
                    {brand.logo_url && (
                      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                        <img src={brand.logo_url} alt={brand.name} className="max-h-24 object-contain" />
                      </div>
                    )}
                    {brand.color_palette && (
                      <div>
                        <h3 className="font-semibold mb-3">Color Palette</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {parseColors(brand.color_palette).map((color, idx) => (
                            <div key={idx} className="space-y-2">
                              <div
                                className="w-full h-24 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                style={{ backgroundColor: color.value }}
                              />
                              <div>
                                <p className="font-medium text-sm">{color.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {color.value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {brand.voice_tone && (
                      <div>
                        <h3 className="font-semibold mb-2">Brand Voice & Tone</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {brand.voice_tone}
                        </p>
                      </div>
                    )}
                    {brand.typography && (
                      <div>
                        <h3 className="font-semibold mb-2">Typography</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {brand.typography}
                        </p>
                      </div>
                    )}
                    {brand.guidelines && (
                      <div>
                        <h3 className="font-semibold mb-2">Guidelines</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {brand.guidelines}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}