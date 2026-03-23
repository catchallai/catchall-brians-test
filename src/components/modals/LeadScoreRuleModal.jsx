import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CONDITION_FIELDS = [
  { id: 'job_title', label: 'Job Title', type: 'text' },
  {
    id: 'source',
    label: 'Lead Source',
    type: 'select',
    options: ['website', 'referral', 'linkedin', 'cold_outreach', 'event', 'other'],
  },
  {
    id: 'status',
    label: 'Contact Status',
    type: 'select',
    options: ['lead', 'prospect', 'customer'],
  },
  {
    id: 'company_size',
    label: 'Company Size',
    type: 'select',
    options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
  },
  { id: 'email_opened', label: 'Emails Opened', type: 'number' },
  { id: 'email_clicked', label: 'Emails Clicked', type: 'number' },
  { id: 'activities_count', label: 'Activities Count', type: 'number' },
  { id: 'deal_value', label: 'Deal Value', type: 'number' },
  { id: 'linkedin_url', label: 'LinkedIn Profile', type: 'exists' },
  { id: 'phone', label: 'Phone Number', type: 'exists' },
];

export default function LeadScoreRuleModal({ open, onClose, rule, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'demographic',
    condition_field: '',
    condition_operator: 'equals',
    condition_value: '',
    score_points: 10,
    is_active: true,
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        category: rule.category || 'demographic',
        condition_field: rule.condition_field || '',
        condition_operator: rule.condition_operator || 'equals',
        condition_value: rule.condition_value || '',
        score_points: rule.score_points || 10,
        is_active: rule.is_active !== false,
      });
    } else {
      setFormData({
        name: '',
        category: 'demographic',
        condition_field: '',
        condition_operator: 'equals',
        condition_value: '',
        score_points: 10,
        is_active: true,
      });
    }
  }, [rule, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      score_points: parseInt(formData.score_points),
    });
  };

  const selectedField = CONDITION_FIELDS.find((f) => f.id === formData.condition_field);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Scoring Rule' : 'Create Scoring Rule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rule Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Has LinkedIn profile"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demographic">Demographic</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Score Points *</Label>
              <Input
                type="number"
                value={formData.score_points}
                onChange={(e) => setFormData({ ...formData, score_points: e.target.value })}
                placeholder="10"
                required
              />
              <p className="text-xs text-gray-400">Use negative for penalties</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">Condition</h4>

            <div className="space-y-2">
              <Label>Field</Label>
              <Select
                value={formData.condition_field}
                onValueChange={(value) => {
                  const field = CONDITION_FIELDS.find((f) => f.id === value);
                  setFormData({
                    ...formData,
                    condition_field: value,
                    condition_operator: field?.type === 'exists' ? 'exists' : 'equals',
                    condition_value: '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedField && selectedField.type !== 'exists' && (
              <>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={formData.condition_operator}
                    onValueChange={(value) =>
                      setFormData({ ...formData, condition_operator: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      {selectedField.type === 'number' && (
                        <>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>
                  {selectedField.type === 'select' ? (
                    <Select
                      value={formData.condition_value}
                      onValueChange={(value) =>
                        setFormData({ ...formData, condition_value: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedField.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={selectedField.type === 'number' ? 'number' : 'text'}
                      value={formData.condition_value}
                      onChange={(e) =>
                        setFormData({ ...formData, condition_value: e.target.value })
                      }
                      placeholder={selectedField.type === 'number' ? '0' : 'Value'}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.condition_field}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
