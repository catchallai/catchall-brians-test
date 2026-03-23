import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DEFAULT_RULES = [
  {
    id: 'rule-1',
    name: 'Auto-qualify by value',
    description: 'Move deals > $50K to qualified',
    enabled: true,
    condition: { type: 'value_threshold', value: 50000 },
    action: { type: 'move_stage', stage: 'qualified' },
  },
  {
    id: 'rule-2',
    name: 'Proposal after 3 calls',
    description: 'Move to proposal after 3+ completed calls',
    enabled: true,
    condition: { type: 'call_count', count: 3 },
    action: { type: 'move_stage', stage: 'proposal' },
  },
  {
    id: 'rule-3',
    name: 'Auto-negotiate after proposal',
    description: 'Move to negotiation 7 days after proposal stage',
    enabled: true,
    condition: { type: 'stage_duration', stage: 'proposal', days: 7 },
    action: { type: 'move_stage', stage: 'negotiation' },
  },
  {
    id: 'rule-4',
    name: 'Risk flag stalled deals',
    description: 'Flag deals in negotiation > 14 days without activity',
    enabled: true,
    condition: { type: 'inactivity', stage: 'negotiation', days: 14 },
    action: { type: 'flag_alert', severity: 'high' },
  },
];

export default function DealProgressionRules({ deals, salesCalls, onApplyRules }) {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    enabled: true,
    condition: { type: 'value_threshold' },
    action: { type: 'move_stage' },
  });

  const evaluateRules = async () => {
    const applicableDeals = [];

    for (const deal of deals) {
      for (const rule of rules.filter((r) => r.enabled)) {
        let shouldApply = false;

        // Evaluate conditions
        if (rule.condition.type === 'value_threshold') {
          shouldApply = (deal.value || 0) >= rule.condition.value && deal.stage !== 'qualified';
        } else if (rule.condition.type === 'call_count') {
          const dealCalls = salesCalls.filter(
            (c) => c.deal_id === deal.id && c.call_status === 'completed'
          );
          shouldApply = dealCalls.length >= rule.condition.count && deal.stage === 'qualified';
        } else if (rule.condition.type === 'stage_duration') {
          const daysSinceStageChange = Math.floor(
            (Date.now() - new Date(deal.updated_date || deal.created_date)) / (1000 * 60 * 60 * 24)
          );
          shouldApply =
            deal.stage === rule.condition.stage && daysSinceStageChange >= rule.condition.days;
        } else if (rule.condition.type === 'inactivity') {
          const recentCalls = salesCalls.filter(
            (c) =>
              c.deal_id === deal.id &&
              (Date.now() - new Date(c.call_date)) / (1000 * 60 * 60 * 24) <= rule.condition.days
          );
          shouldApply = deal.stage === rule.condition.stage && recentCalls.length === 0;
        }

        if (shouldApply) {
          applicableDeals.push({ deal, rule, action: rule.action });
        }
      }
    }

    return applicableDeals;
  };

  const handleApplyRules = async () => {
    const applicableDeal = await evaluateRules();

    // Apply actions
    for (const { deal, rule, action } of applicableDeal) {
      if (action.type === 'move_stage') {
        await base44.entities.Deal.update(deal.id, {
          stage: action.stage,
          last_rule_applied: rule.name,
          updated_date: new Date().toISOString(),
        });
      }
    }

    onApplyRules?.(applicableDeal.length);
  };

  const toggleRule = (ruleId) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (ruleId) => {
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const saveRule = () => {
    if (editingRule) {
      setRules(rules.map((r) => (r.id === editingRule.id ? { ...editingRule, ...newRule } : r)));
    } else {
      setRules([...rules, { ...newRule, id: `rule-${Date.now()}` }]);
    }
    setShowRuleForm(false);
    setEditingRule(null);
    setNewRule({
      name: '',
      description: '',
      enabled: true,
      condition: { type: 'value_threshold' },
      action: { type: 'move_stage' },
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Automated Deal Progression
          </CardTitle>
          <Button
            size="sm"
            onClick={handleApplyRules}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Zap className="w-4 h-4" />
            Apply Rules
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Automatically progress deals through stages based on predefined criteria
        </p>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{rule.name}</p>
                  {rule.enabled && (
                    <Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{rule.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingRule(rule);
                    setNewRule(rule);
                    setShowRuleForm(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRule(rule.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name" className="text-sm">
                  Rule Name
                </Label>
                <Input
                  id="rule-name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Auto-qualify high-value"
                />
              </div>
              <div>
                <Label htmlFor="rule-desc" className="text-sm">
                  Description
                </Label>
                <Input
                  id="rule-desc"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="What this rule does"
                />
              </div>
              <div>
                <Label className="text-sm">Condition Type</Label>
                <Select
                  value={newRule.condition.type}
                  onValueChange={(type) => setNewRule({ ...newRule, condition: { type } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value_threshold">Deal Value Threshold</SelectItem>
                    <SelectItem value="call_count">Call Count</SelectItem>
                    <SelectItem value="stage_duration">Stage Duration</SelectItem>
                    <SelectItem value="inactivity">Inactivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRuleForm(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRule}>Save Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
