import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Play, Save, Globe, Plus, Zap, Mail, Calendar,
  CheckCircle, FileText, Users, Target, Clock, Phone, AlertCircle
} from "lucide-react";
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WORKFLOW_TEMPLATES = [
  {
    name: 'Lead Follow-up Workflow',
    description: 'Automatically follow up with new leads after initial contact',
    icon: Users,
    trigger_type: 'positive_call',
    actions: [
      { type: 'create_task', config: { title: 'Send follow-up email', due_in_days: 1 } },
      { type: 'send_email', config: { template: 'Follow-up Email', delay_days: 1 } },
      { type: 'create_followup', config: { scheduled_days: 3, type: 'call' } }
    ]
  },
  {
    name: 'Deal Stage Progression',
    description: 'Move deals through pipeline stages automatically',
    icon: Target,
    trigger_type: 'followup_completed',
    actions: [
      { type: 'update_stage', config: { new_stage: 'qualified' } },
      { type: 'create_task', config: { title: 'Prepare proposal', due_in_days: 2 } },
      { type: 'send_email', config: { template: 'Proposal Email', delay_days: 2 } }
    ]
  },
  {
    name: 'Reservation Confirmation',
    description: 'Send confirmation and follow-up after reservation',
    icon: Calendar,
    trigger_type: 'reservation_confirmed',
    actions: [
      { type: 'send_email', config: { template: 'Reservation Confirmed', delay_days: 0 } },
      { type: 'create_task', config: { title: 'Prepare for meeting', due_in_days: 1 } },
      { type: 'create_followup', config: { scheduled_days: 1, type: 'reminder' } }
    ]
  },
  {
    name: 'Post-Demo Follow-up',
    description: 'Nurture leads after product demonstration',
    icon: CheckCircle,
    trigger_type: 'followup_completed',
    actions: [
      { type: 'send_email', config: { template: 'Thank you for demo', delay_days: 0 } },
      { type: 'create_task', config: { title: 'Check if questions answered', due_in_days: 2 } },
      { type: 'create_followup', config: { scheduled_days: 5, type: 'call' } }
    ]
  },
  {
    name: 'Inactive Deal Recovery',
    description: 'Re-engage with deals that have gone cold',
    icon: AlertCircle,
    trigger_type: 'deal_inactive',
    actions: [
      { type: 'create_task', config: { title: 'Review deal status', due_in_days: 0 } },
      { type: 'send_email', config: { template: 'Re-engagement Email', delay_days: 1 } },
      { type: 'create_followup', config: { scheduled_days: 7, type: 'call' } }
    ]
  },
  {
    name: 'Negative Call Recovery',
    description: 'Handle and recover from unsuccessful calls',
    icon: Phone,
    trigger_type: 'negative_call',
    actions: [
      { type: 'create_task', config: { title: 'Document objections', due_in_days: 0 } },
      { type: 'send_email', config: { template: 'Address Concerns', delay_days: 2 } },
      { type: 'create_followup', config: { scheduled_days: 14, type: 'call' } }
    ]
  }
];

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const workflowId = queryParams.get('id');
  const queryClient = useQueryClient();

  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [isDraft, setIsDraft] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [triggerType, setTriggerType] = useState('deal_inactive');

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      const wf = await base44.entities.DealWorkflow.filter({ id: workflowId });
      if (wf[0]) {
        setWorkflowName(wf[0].name);
        setIsDraft(!wf[0].is_active);
        // Set nodes based on workflow actions
        setNodes(wf[0].actions || []);
      }
      return wf[0];
    },
    enabled: !!workflowId,
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: workflowName,
        trigger_type: triggerType,
        actions: nodes,
        is_active: !isDraft,
      };
      
      if (workflowId) {
        return await base44.entities.DealWorkflow.update(workflowId, data);
      } else {
        return await base44.entities.DealWorkflow.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const applyTemplate = (template) => {
    setWorkflowName(template.name);
    setTriggerType(template.trigger_type);
    setNodes(template.actions);
    setShowTemplates(false);
  };

  // Show template selector for new workflows
  React.useEffect(() => {
    if (!workflowId && nodes.length === 0) {
      setShowTemplates(true);
    }
  }, [workflowId, nodes.length]);

  const publishWorkflow = () => {
    setIsDraft(false);
    saveWorkflowMutation.mutate();
  };

  const addTrigger = () => {
    setNodes([...nodes, { type: 'trigger', config: { event: 'New trigger' } }]);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl('Automation'))}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workflows
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="h-8 w-64 border-0 focus-visible:ring-0 text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="w-4 h-4" />
            Test Workflow
          </Button>
          <Badge variant={isDraft ? "secondary" : "default"}>
            {isDraft ? "Draft" : "Published"}
          </Badge>
          <Button
            size="sm"
            onClick={publishWorkflow}
            disabled={saveWorkflowMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 gap-2"
          >
            <Globe className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="builder" className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">Enrollment History</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="flex-1 m-0 p-0">
          <div className="flex h-full">
            {/* Left Sidebar */}
            <div className="w-12 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 gap-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-auto relative">
              <div className="absolute inset-0 flex items-start justify-center pt-20">
                <div className="space-y-4">
                  {nodes.length === 0 ? (
                    <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-8 text-center">
                      <p className="text-gray-500 mb-4">Start building your workflow</p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => setShowTemplates(true)}
                          variant="outline"
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Use Template
                        </Button>
                        <Button
                          onClick={addTrigger}
                          variant="outline"
                          className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4" />
                          Start from Scratch
                        </Button>
                      </div>
                    </div>
                  ) : (
                    nodes.map((node, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm w-80">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{node.config?.event || 'Trigger'}</p>
                              <p className="text-xs text-gray-500">{node.type}</p>
                            </div>
                          </div>
                        </div>
                        {idx < nodes.length - 1 && (
                          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
                        )}
                      </div>
                    ))
                  )}
                  
                  {nodes.length > 0 && (
                    <>
                      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-auto" />
                      <div className="flex justify-center">
                        <Button
                          onClick={addTrigger}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Action
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex flex-col gap-2">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Plus className="w-4 h-4" />
                </button>
                <div className="text-xs text-center py-1">100%</div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Workflow Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Workflow Name</label>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-6">
          <div className="text-center text-gray-500 py-8">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No enrollment history yet</p>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 p-6">
          <div className="text-center text-gray-500 py-8">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No execution logs yet</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Workflow Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {WORKFLOW_TEMPLATES.map((template, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:shadow-md transition-all hover:border-violet-500"
                onClick={() => applyTemplate(template)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                      <template.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="secondary" className="text-xs">
                          {template.trigger_type.replace(/_/g, ' ')}
                        </Badge>
                        <span>•</span>
                        <span>{template.actions.length} actions</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowTemplates(false)}
              className="w-full"
            >
              Start from Scratch Instead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}