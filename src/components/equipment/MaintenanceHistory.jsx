import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Wrench, Calendar, DollarSign } from "lucide-react";
import { useToast } from '@/components/ui/toast-provider';

export default function MaintenanceHistory({ equipmentId }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    maintenance_type: 'routine',
    performed_by: '',
    performed_date: new Date().toISOString().split('T')[0],
    cost: '',
    description: '',
    next_maintenance_date: ''
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: logs = [] } = useQuery({
    queryKey: ['maintenance-logs', equipmentId],
    queryFn: () => base44.entities.MaintenanceLog.filter({ equipment_id: equipmentId }, '-performed_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceLog.create({ ...data, equipment_id: equipmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      setShowModal(false);
      toast.success('Maintenance log added');
    }
  });

  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance History</h3>
          <p className="text-sm text-gray-500">Total cost: ${totalCost.toLocaleString()}</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Log Maintenance
        </Button>
      </div>

      <div className="space-y-2">
        {logs.map(log => (
          <Card key={log.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{log.maintenance_type}</Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(log.performed_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.description}</p>
                  {log.performed_by && (
                    <p className="text-xs text-gray-500 mt-1">By: {log.performed_by}</p>
                  )}
                </div>
                {log.cost && (
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">${log.cost.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.maintenance_type} onValueChange={(v) => setFormData({...formData, maintenance_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="calibration">Calibration</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.performed_date} onChange={(e) => setFormData({...formData, performed_date: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Performed By</Label>
              <Input value={formData.performed_by} onChange={(e) => setFormData({...formData, performed_by: e.target.value})} placeholder="Technician or vendor name" />
            </div>
            <div>
              <Label>Cost</Label>
              <Input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="What work was performed..." />
            </div>
            <div>
              <Label>Next Maintenance Date</Label>
              <Input type="date" value={formData.next_maintenance_date} onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)}>Save Log</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}