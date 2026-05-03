import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreHorizontal, Trash2, Edit, FileText } from 'lucide-react';
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
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', guidelines: '', color_palette: '', typography: '' });
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
    });
    setIsOpen(true);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Brand' : 'Create Brand Guidelines'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Brand Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Main Brand"
                />
              </div>
              <div>
                <Label>Guidelines</Label>
                <Textarea
                  value={formData.guidelines}
                  onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                  placeholder="Brand guidelines and rules..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Color Palette</Label>
                <Input
                  value={formData.color_palette}
                  onChange={(e) => setFormData({ ...formData, color_palette: e.target.value })}
                  placeholder="Primary: #000000, Secondary: #FFFFFF..."
                />
              </div>
              <div>
                <Label>Typography</Label>
                <Input
                  value={formData.typography}
                  onChange={(e) => setFormData({ ...formData, typography: e.target.value })}
                  placeholder="Font families and styles..."
                />
              </div>
              <div className="flex gap-3 justify-end">
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
                {brand.guidelines && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Guidelines
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {brand.guidelines}
                    </p>
                  </div>
                )}
                {brand.color_palette && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Colors
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {brand.color_palette}
                    </p>
                  </div>
                )}
                {brand.typography && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Typography
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {brand.typography}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(brand.created_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}