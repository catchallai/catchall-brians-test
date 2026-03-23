import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Play, Pause, Loader2 } from 'lucide-react';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import WorkflowExecutionHistory from '@/components/workflow/WorkflowExecutionHistory';

export default function WorkflowEngine() {
  const [activeTab, setActiveTab] = useState('list');
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.ProactiveEngagementWorkflow.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProactiveEngagementWorkflow.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (workflow) =>
      base44.entities.ProactiveEngagementWorkflow.update(workflow.id, {
        is_active: !workflow.is_active,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const triggerEvalMutation = useMutation({
    mutationFn: () => base44.functions.invoke('evaluateWorkflowTriggers'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Workflow Engine
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Automate customer engagement sequences
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => triggerEvalMutation.mutate()}
              disabled={triggerEvalMutation.isPending}
              variant="outline"
              className="gap-2 text-xs sm:text-sm"
            >
              {triggerEvalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Evaluate Triggers
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setEditingWorkflow(null);
                setActiveTab('builder');
              }}
              className="gap-2 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" /> New Workflow
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="list">Workflows</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Loading workflows...</div>
            ) : workflows.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-4">No workflows created yet</p>
                  <Button onClick={() => setActiveTab('builder')}>Create First Workflow</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="glass-card">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {workflow.name}
                              </h3>
                              <Badge
                                className={
                                  workflow.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {workflow.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {workflow.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                Trigger: {workflow.trigger_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {workflow.workflow_nodes?.length || 0} actions
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {workflow.total_executions || 0} executions
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setEditingWorkflow(workflow);
                                setActiveTab('builder');
                              }}
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                            <Button
                              onClick={() => toggleMutation.mutate(workflow)}
                              size="sm"
                              variant="outline"
                            >
                              {workflow.is_active ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => deleteMutation.mutate(workflow.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder">
            <WorkflowBuilder
              workflow={editingWorkflow}
              onSave={() => {
                setEditingWorkflow(null);
                setActiveTab('list');
              }}
            />
          </TabsContent>

          <TabsContent value="history">
            <WorkflowExecutionHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
