import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Share2, Trash2, Users } from 'lucide-react';

export default function SharedDashboardBuilder({ businessId }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dashboard_type: 'custom',
    shared_with: [],
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dashboards = [] } = useQuery({
    queryKey: ['shared-dashboards', businessId],
    queryFn: async () => {
      if (!businessId) {
        return [];
      }
      return await base44.entities.SharedDashboard.filter(
        {
          business_id: businessId,
        },
        '-created_date'
      );
    },
    enabled: !!businessId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['team-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createDashMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.SharedDashboard.create({
        ...data,
        business_id: businessId,
        created_by: user?.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-dashboards', businessId] });
      handleModalClose();
    },
  });

  const deleteDashMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedDashboard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-dashboards', businessId] });
    },
  });

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({
      name: '',
      description: '',
      dashboard_type: 'custom',
      shared_with: [],
    });
  };

  const toggleUserShare = (email) => {
    const newSharedWith = formData.shared_with.includes(email)
      ? formData.shared_with.filter((e) => e !== email)
      : [...formData.shared_with, email];
    setFormData({ ...formData, shared_with: newSharedWith });
  };

  const handleCreateDash = () => {
    if (!formData.name.trim()) {
      return;
    }
    createDashMutation.mutate(formData);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Dashboards</CardTitle>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Dashboard
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {dashboards.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No shared dashboards yet</p>
        ) : (
          dashboards.map((dash) => (
            <div
              key={dash.id}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{dash.name}</h4>
                  {dash.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {dash.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDashMutation.mutate(dash.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Badge variant="outline" className="text-xs">
                  {dash.dashboard_type}
                </Badge>
                {dash.shared_with && dash.shared_with.length > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Users className="w-3 h-3" />
                    Shared with {dash.shared_with.length}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Shared Dashboard</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dashboard Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q1 Sales Pipeline"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2 mt-2">
                {['sales', 'marketing', 'custom'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, dashboard_type: type })}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      formData.dashboard_type === type
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Share With Team Members</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.shared_with.includes(u.email)}
                      onCheckedChange={() => toggleUserShare(u.email)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {u.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateDash} disabled={!formData.name.trim()} className="gap-2">
              <Share2 className="w-4 h-4" />
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
