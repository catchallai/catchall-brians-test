import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import WorkflowNodeEditor from './WorkflowNodeEditor';

const TRIGGER_TYPES = [
  { value: 'health_score', label: 'Health Score' },
  { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
  { value: 'renewal_date', label: 'Renewal Date' },
  { value: 'no_engagement', label: 'No Engagement' },
  { value: 'support_spike', label: 'Support Spike' },
];

const NODE_TYPES = [
  { value: 'send_email', label: '📧 Send Email' },
  { value: 'create_task', label: '✓ Create Task' },
  { value: 'send_message', label: '💬 Send Message' },
  { value: 'create_alert', label: '⚠️ Create Alert' },
  { value: 'wait', label: '⏱️ Wait' },
];

export default function WorkflowBuilder({ workflow = null }) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || 'health_score');
  const [triggerCondition, setTriggerCondition] = useState(
    workflow?.trigger_condition || {
      metric: 'health_score',
      operator: 'less_than',
      value: 50,
    }
  );
  const [nodes, setNodes] = useState(workflow?.workflow_nodes || []);
  const [executionFreq, setExecutionFreq] = useState(workflow?.execution_frequency || 'once');
  const [editingNode, setEditingNode] = useState(null);

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name,
        description,
        trigger_type: triggerType,
        trigger_condition: triggerCondition,
        workflow_nodes: nodes,
        execution_frequency: executionFreq,
      };

      if (workflow?.id) {
        await base44.entities.ProactiveEngagementWorkflow.update(workflow.id, data);
      } else {
        await base44.entities.ProactiveEngagementWorkflow.create(data);
      }

      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      return true;
    },
  });

  const addNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      order: nodes.length,
      node_type: 'send_email',
      config: {},
      conditions: [],
    };
    setNodes([...nodes, newNode]);
    setEditingNode(newNode.id);
  };

  const updateNode = (nodeId, updatedNode) => {
    setNodes(nodes.map((n) => (n.id === nodeId ? updatedNode : n)));
    setEditingNode(null);
  };

  const removeNode = (nodeId) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
  };

  const handleSave = () => {
    if (!name || !nodes.length) {
      toast.warning('Workflow must have a name and at least one action');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Workflow Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Low Health Score Alert"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Execution Frequency
              </label>
              <select
                value={executionFreq}
                onChange={(e) => setExecutionFreq(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="once">Once per contact</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
              Trigger Condition
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Metric"
                value={triggerCondition.metric}
                onChange={(e) =>
                  setTriggerCondition({ ...triggerCondition, metric: e.target.value })
                }
                className="px-2 py-1 rounded text-xs border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
              />
              <select
                value={triggerCondition.operator}
                onChange={(e) =>
                  setTriggerCondition({ ...triggerCondition, operator: e.target.value })
                }
                className="px-2 py-1 rounded text-xs border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
              >
                <option value="less_than">&lt;</option>
                <option value="greater_than">&gt;</option>
                <option value="equals">=</option>
              </select>
              <input
                type="text"
                placeholder="Value"
                value={triggerCondition.value}
                onChange={(e) =>
                  setTriggerCondition({ ...triggerCondition, value: e.target.value })
                }
                className="px-2 py-1 rounded text-xs border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Workflow Actions</CardTitle>
          <Button onClick={addNode} size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add Action
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {nodes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No actions added yet. Click "Add Action" to start.
            </p>
          ) : (
            <div className="space-y-2">
              {nodes.map((node, idx) => (
                <div
                  key={node.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-semibold text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {NODE_TYPES.find((t) => t.value === node.node_type)?.label}
                        </p>
                        {node.config?.subject && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {node.config.subject}
                          </p>
                        )}
                        {node.config?.title && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {node.config.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingNode(node.id)}
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => removeNode(node.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingNode && (
        <WorkflowNodeEditor
          node={nodes.find((n) => n.id === editingNode)}
          onSave={(updated) => updateNode(editingNode, updated)}
          onClose={() => setEditingNode(null)}
        />
      )}

      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        size="lg"
        className="w-full gap-2"
      >
        {saveMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save Workflow
          </>
        )}
      </Button>
    </div>
  );
}
