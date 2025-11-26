import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Plus, Settings, Trash2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#1e293b', '#64748b'
];

export default function BrandOverview({ brands = [], posts = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1', description: '' });
  const queryClient = useQueryClient();

  const createBrandMutation = useMutation({
    mutationFn: (data) => base44.entities.Brand.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setShowModal(false);
      setFormData({ name: '', color: '#6366f1', description: '' });
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Brand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setShowModal(false);
      setEditingBrand(null);
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id) => base44.entities.Brand.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    }
  });

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, color: brand.color, description: brand.description || '' });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand.id, data: formData });
    } else {
      createBrandMutation.mutate(formData);
    }
  };

  const getPostCountForBrand = (brandId) => {
    return posts.filter(p => p.brand_id === brandId).length;
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-500" />
            Brands
          </CardTitle>
          <Button size="sm" onClick={() => { setEditingBrand(null); setFormData({ name: '', color: '#6366f1', description: '' }); setShowModal(true); }} className="gap-1">
            <Plus className="w-4 h-4" /> Add Brand
          </Button>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <div className="text-center py-6">
              <Palette className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No brands yet</p>
              <p className="text-xs text-gray-400">Create brands to organize your content</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {brands.map((brand) => (
                <div 
                  key={brand.id} 
                  className="p-3 rounded-xl border-2 hover:shadow-md transition-all cursor-pointer group relative"
                  style={{ borderColor: brand.color, backgroundColor: `${brand.color}08` }}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(brand)}>
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => deleteBrandMutation.mutate(brand.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div 
                    className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: brand.color }}
                  >
                    {brand.name[0]?.toUpperCase()}
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{brand.name}</p>
                  <p className="text-xs text-gray-500">{getPostCountForBrand(brand.id)} posts</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Brand"
              />
            </div>
            <div>
              <Label>Brand Color</Label>
              <div className="flex gap-2 items-center mt-2">
                <div 
                  className="w-10 h-10 rounded-lg border-2"
                  style={{ backgroundColor: formData.color }}
                />
                <Input 
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="w-28"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brand description..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.name || createBrandMutation.isPending || updateBrandMutation.isPending}
              >
                {editingBrand ? 'Save Changes' : 'Create Brand'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}