import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Zap, Target, Sparkles, RefreshCw, Loader2, 
  TrendingUp, Users, CheckCircle, AlertCircle, GitBranch, Play
} from "lucide-react";
import AutomationRuleCard from '@/components/automation/AutomationRuleCard';
import LeadScoreCard from '@/components/automation/LeadScoreCard';
import AutomationRuleModal from '@/components/modals/AutomationRuleModal';
import LeadScoreRuleModal from '@/components/modals/LeadScoreRuleModal';
import EmptyState from '@/components/ui/EmptyState';
import { createPageUrl } from '@/utils';

export default function Automation() {
  const navigate = useNavigate();
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editingScoreRule, setEditingScoreRule] = useState(null);
  const [enrichingContact, setEnrichingContact] = useState(null);
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.DealWorkflow.list('-created_date', 100),
  });

  const { data: automationRules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date', 100),
  });

  const { data: leadScoreRules = [], isLoading: loadingScoreRules } = useQuery({
    queryKey: ['lead-score-rules'],
    queryFn: () => base44.entities.LeadScoreRule.list('-created_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 100),
  });

  // Automation Rule Mutations
  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowRuleModal(false);
      setEditingRule(null);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowRuleModal(false);
      setEditingRule(null);
    },
  });

  // Lead Score Rule Mutations
  const createScoreRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadScoreRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-score-rules'] });
      setShowScoreModal(false);
      setEditingScoreRule(null);
    },
  });

  const updateScoreRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadScoreRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-score-rules'] });
      setShowScoreModal(false);
      setEditingScoreRule(null);
    },
  });

  // Recalculate Lead Scores
  const recalculateScoresMutation = useMutation({
    mutationFn: async () => {
      const activeRules = leadScoreRules.filter(r => r.is_active);
      
      for (const contact of contacts) {
        let score = 0;
        const company = companies.find(c => c.id === contact.company_id);
        
        for (const rule of activeRules) {
          let value = contact[rule.condition_field];
          if (rule.condition_field === 'company_size' && company) {
            value = company.size;
          }
          
          let matches = false;
          switch (rule.condition_operator) {
            case 'equals':
              matches = String(value).toLowerCase() === String(rule.condition_value).toLowerCase();
              break;
            case 'not_equals':
              matches = String(value).toLowerCase() !== String(rule.condition_value).toLowerCase();
              break;
            case 'contains':
              matches = String(value).toLowerCase().includes(String(rule.condition_value).toLowerCase());
              break;
            case 'greater_than':
              matches = Number(value) > Number(rule.condition_value);
              break;
            case 'less_than':
              matches = Number(value) < Number(rule.condition_value);
              break;
            case 'exists':
              matches = !!value;
              break;
          }
          
          if (matches) {
            score += rule.score_points;
          }
        }
        
        if (contact.lead_score !== score) {
          await base44.entities.Contact.update(contact.id, { lead_score: Math.max(0, score) });
        }
      }
      
      return { updated: contacts.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // Enrich Contact Data
  const enrichContactMutation = useMutation({
    mutationFn: async (contact) => {
      setEnrichingContact(contact.id);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following contact information, provide enriched data:
          Name: ${contact.first_name} ${contact.last_name}
          Email: ${contact.email}
          Job Title: ${contact.job_title || 'Unknown'}
          
          Please provide realistic business data that might be inferred from this information.`,
        response_json_schema: {
          type: "object",
          properties: {
            likely_industry: { type: "string" },
            estimated_seniority: { type: "string" },
            suggested_tags: { type: "array", items: { type: "string" } },
            linkedin_search_query: { type: "string" },
          }
        }
      });
      
      const tags = [...(contact.tags || []), ...(result.suggested_tags || [])].slice(0, 5);
      
      await base44.entities.Contact.update(contact.id, {
        tags,
        enriched: true,
        enriched_date: new Date().toISOString(),
        notes: contact.notes 
          ? `${contact.notes}\n\n[Enriched] Industry: ${result.likely_industry}, Seniority: ${result.estimated_seniority}`
          : `[Enriched] Industry: ${result.likely_industry}, Seniority: ${result.estimated_seniority}`
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEnrichingContact(null);
    },
    onError: () => {
      setEnrichingContact(null);
    }
  });

  const handleSaveRule = (data) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleSaveScoreRule = (data) => {
    if (editingScoreRule) {
      updateScoreRuleMutation.mutate({ id: editingScoreRule.id, data });
    } else {
      createScoreRuleMutation.mutate(data);
    }
  };

  const handleToggleRule = (id, isActive) => {
    e?.stopPropagation();
    updateRuleMutation.mutate({ id, data: { is_active: isActive } });
  };

  const handleToggleScoreRule = (id, isActive) => {
    updateScoreRuleMutation.mutate({ id, data: { is_active: isActive } });
  };

  const handleDeleteRule = (id) => {
    base44.entities.AutomationRule.delete(id);
    queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
  };

  const handleDeleteScoreRule = (id) => {
    base44.entities.LeadScoreRule.delete(id);
    queryClient.invalidateQueries({ queryKey: ['lead-score-rules'] });
  };

  const activeRules = automationRules.filter(r => r.is_active).length;
  const totalRuns = automationRules.reduce((sum, r) => sum + (r.run_count || 0), 0);
  const avgLeadScore = contacts.length > 0 
    ? Math.round(contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length)
    : 0;
  const enrichedContacts = contacts.filter(c => c.enriched).length;

  const isLoading = loadingRules || loadingScoreRules;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automation</h1>
        <p className="text-gray-500 mt-1">Workflows, lead scoring & data enrichment</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{activeRules}</p>
            <p className="text-sm text-gray-500">Active Rules</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{totalRuns}</p>
            <p className="text-sm text-gray-500">Total Runs</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{avgLeadScore}</p>
            <p className="text-sm text-gray-500">Avg Lead Score</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{enrichedContacts}</p>
            <p className="text-sm text-gray-500">Enriched Contacts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visual-workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visual-workflows">Workflows</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="enrichment">Data Enrichment</TabsTrigger>
        </TabsList>

        <TabsContent value="visual-workflows" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => navigate(createPageUrl('WorkflowBuilder'))}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          </div>

          {loadingWorkflows ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No workflows created"
              description="Build visual workflows to automate your sales process."
              actionLabel="Create Workflow"
              onAction={() => navigate(createPageUrl('WorkflowBuilder'))}
            />
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="glass-card cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(createPageUrl('WorkflowBuilder') + `?id=${workflow.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                          <GitBranch className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {workflow.name}
                            </h3>
                            <Badge variant={workflow.is_active ? "default" : "secondary"} className="text-xs">
                              {workflow.is_active ? "Active" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            Trigger: {workflow.trigger_type?.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {workflow.execution_count || 0} executions
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {workflow.actions?.length || 0} actions
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingRule(null); setShowRuleModal(true); }} 
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : automationRules.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No automation rules"
              description="Create workflows to automate tasks based on triggers."
              actionLabel="Create Rule"
              onAction={() => { setEditingRule(null); setShowRuleModal(true); }}
            />
          ) : (
            <div className="space-y-3">
              {automationRules.map((rule) => (
                <AutomationRuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggleRule}
                  onDelete={handleDeleteRule}
                  onClick={() => { setEditingRule(rule); setShowRuleModal(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => recalculateScoresMutation.mutate()}
              disabled={recalculateScoresMutation.isPending}
              className="gap-2"
            >
              {recalculateScoresMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Recalculate All Scores
            </Button>
            <Button 
              onClick={() => { setEditingScoreRule(null); setShowScoreModal(true); }} 
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Scoring Rule
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : leadScoreRules.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No scoring rules"
              description="Create rules to automatically score leads based on attributes."
              actionLabel="Create Rule"
              onAction={() => { setEditingScoreRule(null); setShowScoreModal(true); }}
            />
          ) : (
            <div className="space-y-3">
              {leadScoreRules.map((rule) => (
                <LeadScoreCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggleScoreRule}
                  onClick={() => { setEditingScoreRule(rule); setShowScoreModal(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrichment" className="space-y-4">
          <Card className="border-0 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">AI Data Enrichment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enrich contact data using AI to add insights like industry and seniority level.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Enrichment Progress</span>
                <span>{enrichedContacts} / {contacts.length} contacts</span>
              </div>
              <Progress value={(enrichedContacts / contacts.length) * 100 || 0} className="h-2" />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contacts.filter(c => !c.enriched).slice(0, 20).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{contact.first_name} {contact.last_name}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => enrichContactMutation.mutate(contact)}
                    disabled={enrichingContact === contact.id}
                    className="gap-1"
                  >
                    {enrichingContact === contact.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Enrich
                  </Button>
                </div>
              ))}
              {contacts.filter(c => !c.enriched).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                  <p>All contacts have been enriched!</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AutomationRuleModal
        open={showRuleModal}
        onClose={() => { setShowRuleModal(false); setEditingRule(null); }}
        rule={editingRule}
        templates={templates}
        onSave={handleSaveRule}
        isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
      />

      <LeadScoreRuleModal
        open={showScoreModal}
        onClose={() => { setShowScoreModal(false); setEditingScoreRule(null); }}
        rule={editingScoreRule}
        onSave={handleSaveScoreRule}
        isLoading={createScoreRuleMutation.isPending || updateScoreRuleMutation.isPending}
      />
    </div>
  );
}