import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layers, Plus, Trash2, Star, Edit2 } from 'lucide-react';

const COLORS = [
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
];

export default function SegmentManager({ open, onClose, onApplySegment, allVisitors }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    filters: {},
    color: COLORS[0].value,
    is_favorite: false,
  });

  const queryClient = useQueryClient();

  const { data: segments = [] } = useQuery({
    queryKey: ['visitor-segments'],
    queryFn: () => base44.entities.VisitorSegment.list('-last_used', 50),
  });

  const createSegmentMutation = useMutation({
    mutationFn: (data) => base44.entities.VisitorSegment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-segments'] });
      setShowCreate(false);
      setNewSegment({
        name: '',
        description: '',
        filters: {},
        color: COLORS[0].value,
        is_favorite: false,
      });
    },
  });

  const updateSegmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VisitorSegment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-segments'] });
      setEditingSegment(null);
      setShowCreate(false);
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: (id) => base44.entities.VisitorSegment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-segments'] });
    },
  });

  const handleSaveSegment = () => {
    const count = calculateSegmentCount(newSegment.filters);
    if (editingSegment) {
      updateSegmentMutation.mutate({
        id: editingSegment.id,
        data: { ...newSegment, visitor_count: count },
      });
    } else {
      createSegmentMutation.mutate({ ...newSegment, visitor_count: count });
    }
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setNewSegment({
      name: segment.name,
      description: segment.description || '',
      filters: segment.filters || {},
      color: segment.color || COLORS[0].value,
      is_favorite: segment.is_favorite || false,
    });
    setShowCreate(true);
  };

  const handleApplySegment = (segment) => {
    updateSegmentMutation.mutate({
      id: segment.id,
      data: { last_used: new Date().toISOString() },
    });
    onApplySegment(segment.filters);
    onClose();
  };

  const calculateSegmentCount = (filters) => {
    return allVisitors.filter((visitor) => {
      if (filters.industries?.length && !filters.industries.includes(visitor.industry)) {
        return false;
      }
      if (filters.tiers?.length && !filters.tiers.includes(visitor.scoreData?.tier)) {
        return false;
      }
      if (filters.countries?.length && !filters.countries.includes(visitor.country)) {
        return false;
      }
      if (filters.devices?.length && !filters.devices.includes(visitor.device)) {
        return false;
      }
      if (filters.min_pages && visitor.pagesViewed < filters.min_pages) {
        return false;
      }
      if (filters.min_score && visitor.leadScore < filters.min_score) {
        return false;
      }
      if (filters.min_time_minutes) {
        const timeMinutes = parseInt(visitor.timeOnSite.split('m')[0]);
        if (timeMinutes < filters.min_time_minutes) {
          return false;
        }
      }
      if (filters.is_return_visitor && visitor.visitCount <= 1) {
        return false;
      }
      if (filters.days_ago_max && visitor.daysAgo > filters.days_ago_max) {
        return false;
      }
      return true;
    }).length;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-500" />
            Visitor Segments
          </DialogTitle>
          <DialogDescription>
            Create and manage visitor segments for targeted analysis
          </DialogDescription>
        </DialogHeader>

        {!showCreate ? (
          <div className="space-y-4 mt-4">
            <Button onClick={() => setShowCreate(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create New Segment
            </Button>

            <div className="space-y-3">
              {segments.map((segment) => (
                <Card
                  key={segment.id}
                  className="bg-white dark:bg-gray-800 border-l-4"
                  style={{ borderLeftColor: segment.color }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {segment.name}
                          </h4>
                          {segment.is_favorite && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                          <Badge variant="outline" className="ml-auto">
                            {segment.visitor_count || 0} visitors
                          </Badge>
                        </div>
                        {segment.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {segment.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {segment.filters?.industries?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Industries: {segment.filters.industries.length}
                            </Badge>
                          )}
                          {segment.filters?.tiers?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Tiers: {segment.filters.tiers.length}
                            </Badge>
                          )}
                          {segment.filters?.min_score && (
                            <Badge variant="outline" className="text-xs">
                              Score ≥ {segment.filters.min_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplySegment(segment)}
                        >
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSegment(segment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSegmentMutation.mutate(segment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {segments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No segments yet. Create one to get started.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Segment Name</Label>
                <Input
                  placeholder="e.g., High-Value Aviation Leads"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 ${newSegment.color === color.value ? 'border-gray-900 dark:border-white' : 'border-gray-300'}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewSegment({ ...newSegment, color: color.value })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={newSegment.description}
                onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm">Filter Criteria</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Score Tiers</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['hot', 'warm', 'engaged', 'early'].map((tier) => (
                      <Button
                        key={tier}
                        variant={newSegment.filters.tiers?.includes(tier) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const tiers = newSegment.filters.tiers || [];
                          const updated = tiers.includes(tier)
                            ? tiers.filter((t) => t !== tier)
                            : [...tiers, tier];
                          setNewSegment({
                            ...newSegment,
                            filters: { ...newSegment.filters, tiers: updated },
                          });
                        }}
                      >
                        {tier}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Devices</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Desktop', 'Mobile', 'iPad'].map((device) => (
                      <Button
                        key={device}
                        variant={
                          newSegment.filters.devices?.includes(device) ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                          const devices = newSegment.filters.devices || [];
                          const updated = devices.includes(device)
                            ? devices.filter((d) => d !== device)
                            : [...devices, device];
                          setNewSegment({
                            ...newSegment,
                            filters: { ...newSegment.filters, devices: updated },
                          });
                        }}
                      >
                        {device}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Min Lead Score</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 70"
                    value={newSegment.filters.min_score || ''}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        filters: {
                          ...newSegment.filters,
                          min_score: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Min Pages</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={newSegment.filters.min_pages || ''}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        filters: {
                          ...newSegment.filters,
                          min_pages: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max Days Ago</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={newSegment.filters.days_ago_max || ''}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        filters: {
                          ...newSegment.filters,
                          days_ago_max: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newSegment.filters.is_return_visitor || false}
                    onCheckedChange={(checked) =>
                      setNewSegment({
                        ...newSegment,
                        filters: { ...newSegment.filters, is_return_visitor: checked },
                      })
                    }
                  />
                  <Label>Return Visitors Only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newSegment.is_favorite}
                    onCheckedChange={(checked) =>
                      setNewSegment({ ...newSegment, is_favorite: checked })
                    }
                  />
                  <Label>Favorite Segment</Label>
                </div>
              </div>

              <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
                <p className="text-sm text-violet-700 dark:text-violet-300">
                  📊 This segment will match{' '}
                  <strong>{calculateSegmentCount(newSegment.filters)}</strong> visitors
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setEditingSegment(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSegment} disabled={!newSegment.name}>
                {editingSegment ? 'Update' : 'Create'} Segment
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
