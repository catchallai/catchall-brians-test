import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

export default function PipelineModal({ open, onClose, pipeline, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    stages: [
      {
        id: 'new_lead',
        name: 'New Lead',
        leave_time: false,
        stage_handover: false,
        include_in_reports: false,
      },
      {
        id: 'contacted',
        name: 'Contacted',
        leave_time: false,
        stage_handover: false,
        include_in_reports: false,
      },
      {
        id: 'proposal_sent',
        name: 'Proposal Sent',
        leave_time: false,
        stage_handover: false,
        include_in_reports: false,
      },
      {
        id: 'closed',
        name: 'Closed',
        leave_time: false,
        stage_handover: false,
        include_in_reports: false,
      },
    ],
  });

  useEffect(() => {
    if (pipeline) {
      setFormData({
        name: pipeline.name || '',
        stages: pipeline.stages || [],
      });
    } else {
      setFormData({
        name: '',
        stages: [
          {
            id: 'new_lead',
            name: 'New Lead',
            leave_time: false,
            stage_handover: false,
            include_in_reports: false,
          },
          {
            id: 'contacted',
            name: 'Contacted',
            leave_time: false,
            stage_handover: false,
            include_in_reports: false,
          },
          {
            id: 'proposal_sent',
            name: 'Proposal Sent',
            leave_time: false,
            stage_handover: false,
            include_in_reports: false,
          },
          {
            id: 'closed',
            name: 'Closed',
            leave_time: false,
            stage_handover: false,
            include_in_reports: false,
          },
        ],
      });
    }
  }, [pipeline, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        {
          id: `stage_${Date.now()}`,
          name: '',
          leave_time: false,
          stage_handover: false,
          include_in_reports: false,
        },
      ],
    });
  };

  const removeStage = (index) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((_, i) => i !== index),
    });
  };

  const updateStage = (index, field, value) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData({ ...formData, stages: newStages });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pipeline ? 'Edit Pipeline' : 'Create Pipeline'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name *</Label>
            <Input
              id="name"
              placeholder="Marketing pipeline"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500">
              Write in lowercase letters as you will see this pipeline here
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Pipeline Stages ({formData.stages.length})</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addStage}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Stage
              </Button>
            </div>

            <div className="space-y-3">
              {formData.stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Stage Name</Label>
                      <Input
                        placeholder={`New Lead`}
                        value={stage.name}
                        onChange={(e) => updateStage(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    {formData.stages.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStage(index)}
                        className="mt-5 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`leave-time-${index}`}
                        checked={stage.leave_time}
                        onCheckedChange={(checked) => updateStage(index, 'leave_time', checked)}
                      />
                      <label htmlFor={`leave-time-${index}`} className="text-sm cursor-pointer">
                        Leave Time
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`stage-handover-${index}`}
                        checked={stage.stage_handover}
                        onCheckedChange={(checked) => updateStage(index, 'stage_handover', checked)}
                      />
                      <label htmlFor={`stage-handover-${index}`} className="text-sm cursor-pointer">
                        Stage Handover
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`include-reports-${index}`}
                        checked={stage.include_in_reports}
                        onCheckedChange={(checked) =>
                          updateStage(index, 'include_in_reports', checked)
                        }
                      />
                      <label
                        htmlFor={`include-reports-${index}`}
                        className="text-sm cursor-pointer"
                      >
                        Include in Reports
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : pipeline ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
