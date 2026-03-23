import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Activity, CheckCircle, Target, Clock } from 'lucide-react';
import WorkflowModal from './WorkflowModal';

const triggerLabels = {
  followup_completed: {
    label: 'Follow-up Completed',
    icon: CheckCircle,
    color: 'text-emerald-500',
  },
  positive_call: { label: 'Positive Call Sentiment', icon: Activity, color: 'text-green-500' },
  negative_call: { label: 'Negative Call Sentiment', icon: Activity, color: 'text-red-500' },
  reservation_confirmed: { label: 'Reservation Confirmed', icon: Target, color: 'text-blue-500' },
  reservation_completed: {
    label: 'Reservation Completed',
    icon: CheckCircle,
    color: 'text-emerald-500',
  },
  deal_inactive: { label: 'Deal Inactive 7+ Days', icon: Clock, color: 'text-amber-500' },
};

const actionLabels = {
  update_stage: 'Update Deal Stage',
  create_task: 'Create Task',
  send_email: 'Send Email',
  create_followup: 'Create Follow-up',
};

export default function WorkflowPanel({ workflows, onToggle, onEdit, executions }) {
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const recentExecutions = executions.slice(0, 5);

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-500" />
            Deal Automation Workflows
          </CardTitle>
          <Button
            onClick={() => {
              setEditingWorkflow(null);
              setShowModal(true);
            }}
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-violet-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-violet-600">
                  {workflows.filter((w) => w.is_active).length}
                </p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0)}
                </p>
                <p className="text-xs text-gray-600">Total Runs</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {executions.filter((e) => e.status === 'success').length}
                </p>
                <p className="text-xs text-gray-600">Successful</p>
              </div>
            </div>

            {workflows.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No workflows yet</p>
                <p className="text-gray-400 text-xs">Create automated workflows to advance deals</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm">Active Workflows</h4>
                {workflows.map((workflow) => {
                  const trigger = triggerLabels[workflow.trigger_type];
                  const TriggerIcon = trigger?.icon || Zap;

                  return (
                    <div key={workflow.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <TriggerIcon className={`w-4 h-4 ${trigger?.color || 'text-gray-500'}`} />
                          <div>
                            <p className="font-medium text-sm">{workflow.name}</p>
                            <p className="text-xs text-gray-600">
                              {trigger?.label || workflow.trigger_type}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={workflow.is_active}
                          onCheckedChange={() => onToggle(workflow.id, !workflow.is_active)}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {workflow.actions?.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {actionLabels[action.type]}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Executed {workflow.execution_count || 0} times</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingWorkflow(workflow);
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {recentExecutions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Recent Executions</h4>
                <div className="space-y-2">
                  {recentExecutions.map((exec) => (
                    <div key={exec.id} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {workflows.find((w) => w.id === exec.workflow_id)?.name}
                        </span>
                        <Badge
                          className={`${exec.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0 text-xs`}
                        >
                          {exec.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        {exec.actions_executed?.length || 0} actions executed
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <WorkflowModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingWorkflow(null);
        }}
        workflow={editingWorkflow}
        onSave={onEdit}
      />
    </>
  );
}
