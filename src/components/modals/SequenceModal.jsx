import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Mail, Phone, MessageSquare, CheckCircle2, ChevronDown } from 'lucide-react';

export default function SequenceModal({ open, onClose, sequence, onSave, isLoading }) {
  const [formData, setFormData] = useState(
    sequence || {
      name: '',
      description: '',
      is_active: true,
      steps: [],
    }
  );

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...(formData.steps || []),
        {
          order: (formData.steps?.length || 0) + 1,
          type: 'email',
          delay_days: 1,
          subject: '',
          body: '',
          notes: '',
        },
      ],
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'linkedin':
        return <MessageSquare className="w-4 h-4" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'email':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      case 'call':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
      case 'linkedin':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300';
      case 'task':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{sequence ? 'Edit Sequence' : 'Create Sequence'}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Design your automated outreach campaign</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 p-4 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Sequence Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., New Lead Outreach"
                className="bg-white dark:bg-gray-900"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this sequence for?"
                rows={2}
                className="bg-white dark:bg-gray-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Sequence Steps</h4>
                <p className="text-sm text-gray-500 mt-0.5">Add steps to build your outreach campaign</p>
              </div>
              <Button type="button" onClick={addStep} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>

            <div className="relative">
              {formData.steps && formData.steps.length > 0 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-200 dark:from-emerald-600 dark:to-emerald-800" />
              )}

              <div className="space-y-3">
                {formData.steps?.map((step, index) => (
                  <div key={index} className="relative pl-12">
                    <div className={`p-4 border-2 rounded-xl space-y-3 transition-all ${getStepColor(step.type)}`}>
                      <div className="flex items-start justify-between -ml-4">
                        <div className="flex items-center gap-3">
                          <div className="absolute -left-7 top-4 w-8 h-8 bg-white dark:bg-gray-800 border-2 border-emerald-400 dark:border-emerald-600 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            {getStepIcon(step.type)}
                          </div>
                          <div>
                            <span className="font-semibold text-sm">Step {index + 1}</span>
                            <p className="text-xs opacity-75">{step.type === 'email' ? 'Email' : step.type === 'call' ? 'Call Task' : step.type === 'linkedin' ? 'LinkedIn Message' : 'Manual Task'}</p>
                          </div>
                        </div>
                        <Button type="button" onClick={() => removeStep(index)} size="sm" variant="ghost" className="opacity-70 hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold opacity-80 block mb-1.5">Type</label>
                          <Select
                            value={step.type}
                            onValueChange={(val) => updateStep(index, 'type', val)}
                          >
                            <SelectTrigger className="h-9 bg-white/50 dark:bg-gray-700/50 border-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="call">Call Task</SelectItem>
                              <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                              <SelectItem value="task">Manual Task</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold opacity-80 block mb-1.5">Delay (days)</label>
                          <Input
                            type="number"
                            value={step.delay_days}
                            onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value))}
                            min="0"
                            className="h-9 bg-white/50 dark:bg-gray-700/50 border-0"
                          />
                        </div>
                      </div>

                      {step.type === 'email' && (
                        <>
                          <div>
                            <label className="text-xs font-semibold opacity-80 block mb-1.5">Subject</label>
                            <Input
                              value={step.subject}
                              onChange={(e) => updateStep(index, 'subject', e.target.value)}
                              placeholder="Email subject"
                              className="bg-white/50 dark:bg-gray-700/50 border-0"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold opacity-80 block mb-1.5">Body</label>
                            <Textarea
                              value={step.body}
                              onChange={(e) => updateStep(index, 'body', e.target.value)}
                              placeholder="Email body"
                              rows={3}
                              className="bg-white/50 dark:bg-gray-700/50 border-0"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-xs font-semibold opacity-80 block mb-1.5">Notes</label>
                        <Input
                          value={step.notes}
                          onChange={(e) => updateStep(index, 'notes', e.target.value)}
                          placeholder="Instructions for this step"
                          className="bg-white/50 dark:bg-gray-700/50 border-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
             <Button type="button" variant="outline" onClick={onClose}>
               Cancel
             </Button>
             <Button type="submit" disabled={isLoading || !formData.name} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
               {sequence ? 'Update' : 'Create'} Sequence
             </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}