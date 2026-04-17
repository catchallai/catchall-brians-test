import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Wrench, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceHistory({ equipmentId }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    maintenance_type: 'routine',
    performed_by: '',
    performed_date: '',
    cost: '',
    description: '',
    parts_replaced: [],
  });
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery({
    queryKey: ['maintenance-logs', equipmentId],
    queryFn: () =>
      base44.entities.MaintenanceLog.filter({ equipment_id: equipmentId }, '-performed_date'),
  });

  const createLogMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.MaintenanceLog.create({
        ...data,
        equipment_id: equipmentId,
        cost: parseFloat(data.cost) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      setShowAddModal(false);
      toast.success('Maintenance log added');
      setFormData({
        maintenance_type: 'routine',
        performed_by: '',
        performed_date: '',
        cost: '',
        description: '',
        parts_replaced: [],
      });
    },
  });

  const getTypeColor = (type) => {
    const colors = {
      routine: 'bg-blue-100 text-blue-800',
      repair: 'bg-red-100 text-red-800',
      inspection: 'bg-green-100 text-green-800',
      calibration: 'bg-purple-100 text-purple-800',
      upgrade: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Maintenance History
        </h4>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Log
        </Button>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No maintenance history yet</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getTypeColor(log.maintenance_type)}>
                    {log.maintenance_type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(log.performed_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {log.performed_by && <span>By: {log.performed_by}</span>}
                  {log.cost > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />${log.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Maintenance Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Maintenance Type</Label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
              >
                <option value="routine">Routine</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="calibration">Calibration</option>
                <option value="upgrade">Upgrade</option>
              </select>
            </div>
            <div>
              <Label>Performed By</Label>
              <Input
                value={formData.performed_by}
                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                placeholder="Technician or vendor name"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.performed_date}
                onChange={(e) => setFormData({ ...formData, performed_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Cost ($)</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What was done..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => createLogMutation.mutate(formData)}>Add Log</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
