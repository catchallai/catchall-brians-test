import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Heart,
  Sparkles,
  Target,
  MessageSquare,
  Clock,
  TrendingDown,
} from 'lucide-react';
import OnboardingTracker from '@/components/success/OnboardingTracker';
import InteractionTimeline from '@/components/success/InteractionTimeline';
import SurveyPanel from '@/components/success/SurveyPanel';
import OpportunityPanel from '@/components/success/OpportunityPanel';
import HealthDashboard from '@/components/success/HealthDashboard';
import InteractionModal from '@/components/success/InteractionModal';
import OnboardingModal from '@/components/success/OnboardingModal';

export default function CustomerSuccess() {
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const { data: healthScores = [] } = useQuery({
    queryKey: ['customer-health'],
    queryFn: () => base44.entities.CustomerHealth.list('-health_score', 100),
  });

  const { data: onboardings = [] } = useQuery({
    queryKey: ['customer-onboarding'],
    queryFn: () => base44.entities.CustomerOnboarding.list('-created_date', 100),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['customer-interactions'],
    queryFn: () => base44.entities.CustomerInteraction.list('-interaction_date', 200),
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['satisfaction-surveys'],
    queryFn: () => base44.entities.SatisfactionSurvey.list('-created_date', 100),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['upsell-opportunities'],
    queryFn: () => base44.entities.UpsellOpportunity.list('-confidence_score', 100),
  });

  const calculateHealthMutation = useMutation({
    mutationFn: async () => {
      const healthPromises = contacts
        .filter((c) => c.status === 'customer')
        .map(async (contact) => {
          const contactInteractions = interactions.filter((i) => i.contact_id === contact.id);
          const contactSurveys = surveys.filter((s) => s.contact_id === contact.id && s.status === 'completed');
          const contactOnboarding = onboardings.find((o) => o.contact_id === contact.id);

          const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Calculate comprehensive customer health score for:

Customer: ${contact.first_name} ${contact.last_name}
Company: ${contact.company || 'Unknown'}
Status: ${contact.status}

Onboarding Status: ${contactOnboarding?.status || 'not_started'}
Onboarding Progress: ${contactOnboarding?.progress_percentage || 0}%
Blockers: ${contactOnboarding?.blockers?.join(', ') || 'None'}

Recent Interactions (last 90 days):
- Total: ${contactInteractions.length}
- Positive sentiment: ${contactInteractions.filter((i) => i.sentiment === 'positive').length}
- Negative sentiment: ${contactInteractions.filter((i) => i.sentiment === 'negative').length}
- Support issues: ${contactInteractions.filter((i) => i.interaction_type === 'support').length}
- Escalations: ${contactInteractions.filter((i) => i.interaction_type === 'escalation').length}

Satisfaction Surveys:
- Total completed: ${contactSurveys.length}
- Average NPS: ${
              contactSurveys.filter((s) => s.survey_type === 'nps' && s.score).length > 0
                ? (contactSurveys.filter((s) => s.survey_type === 'nps').reduce((sum, s) => sum + (s.score || 0), 0) / contactSurveys.filter((s) => s.survey_type === 'nps').length).toFixed(1)
                : 'N/A'
            }
- Promoters: ${contactSurveys.filter((s) => s.nps_category === 'promoter').length}
- Detractors: ${contactSurveys.filter((s) => s.nps_category === 'detractor').length}

Calculate:
1. health_score (0-100)
2. health_status (healthy/at_risk/critical)
3. usage_score (0-100)
4. engagement_score (0-100)
5. satisfaction_score (0-100)
6. support_score (0-100)
7. score_breakdown
8. risk_factors: array of concerning signals
9. positive_signals: array of good signals
10. recommended_actions: 3-4 specific CS actions
11. trend (improving/stable/declining)`,
            response_json_schema: {
              type: 'object',
              properties: {
                health_score: { type: 'number' },
                health_status: { type: 'string' },
                usage_score: { type: 'number' },
                engagement_score: { type: 'number' },
                satisfaction_score: { type: 'number' },
                support_score: { type: 'number' },
                score_breakdown: { type: 'object' },
                risk_factors: { type: 'array', items: { type: 'string' } },
                positive_signals: { type: 'array', items: { type: 'string' } },
                recommended_actions: { type: 'array', items: { type: 'string' } },
                trend: { type: 'string' },
              },
            },
          });

          const existingHealth = healthScores.find((h) => h.contact_id === contact.id);
          if (existingHealth) {
            await base44.entities.CustomerHealth.update(existingHealth.id, {
              ...analysis,
              last_calculated: new Date().toISOString(),
            });
          } else {
            await base44.entities.CustomerHealth.create({
              contact_id: contact.id,
              company_id: contact.company_id,
              ...analysis,
              last_calculated: new Date().toISOString(),
            });
          }
        });
      await Promise.all(healthPromises);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-health'] }),
  });

  const identifyOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const oppPromises = contacts
        .filter((c) => c.status === 'customer')
        .map(async (contact) => {
          const health = healthScores.find((h) => h.contact_id === contact.id);
          const contactInteractions = interactions.filter((i) => i.contact_id === contact.id);
          const contactSurveys = surveys.filter((s) => s.contact_id === contact.id && s.status === 'completed');

          const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Identify upsell/cross-sell opportunities for:

Customer: ${contact.first_name} ${contact.last_name}
Company: ${contact.company || 'Unknown'}
Health Score: ${health?.health_score || 'Unknown'}/100
Health Status: ${health?.health_status || 'Unknown'}

Positive Signals:
${health?.positive_signals?.join('\n') || 'None'}

Recent Interactions:
${contactInteractions.slice(0, 5).map((i) => `- ${i.interaction_type}: ${i.summary || 'No summary'} (${i.sentiment})`).join('\n')}

Recent Feedback:
${contactSurveys.slice(0, 3).map((s) => `- ${s.survey_type}: ${s.score} - ${s.feedback || 'No feedback'}`).join('\n')}

Identify potential opportunities (return array of opportunities):
For each opportunity provide:
1. opportunity_type (upsell/cross_sell/expansion/renewal)
2. product_service
3. estimated_value
4. confidence_score (0-100)
5. signals: array of buying signals
6. reasoning
7. recommended_approach
8. best_contact_time

Only return opportunities with confidence >= 60`,
            response_json_schema: {
              type: 'object',
              properties: {
                opportunities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      opportunity_type: { type: 'string' },
                      product_service: { type: 'string' },
                      estimated_value: { type: 'number' },
                      confidence_score: { type: 'number' },
                      signals: { type: 'array', items: { type: 'string' } },
                      reasoning: { type: 'string' },
                      recommended_approach: { type: 'string' },
                      best_contact_time: { type: 'string' },
                    },
                  },
                },
              },
            },
          });

          for (const opp of analysis.opportunities || []) {
            await base44.entities.UpsellOpportunity.create({
              contact_id: contact.id,
              company_id: contact.company_id,
              ...opp,
              identified_date: new Date().toISOString(),
            });
          }
        });
      await Promise.all(oppPromises);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upsell-opportunities'] }),
  });

  const createInteractionMutation = useMutation({
    mutationFn: (data) =>
      editingInteraction
        ? base44.entities.CustomerInteraction.update(editingInteraction.id, data)
        : base44.entities.CustomerInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-interactions'] });
      setShowInteractionModal(false);
      setEditingInteraction(null);
    },
  });

  const createOnboardingMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerOnboarding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboarding'] });
      setShowOnboardingModal(false);
    },
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomerOnboarding.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-onboarding'] }),
  });

  // Stats
  const customers = contacts.filter((c) => c.status === 'customer');
  const healthyCount = healthScores.filter((h) => h.health_status === 'healthy').length;
  const atRiskCount = healthScores.filter((h) => h.health_status === 'at_risk').length;
  const criticalCount = healthScores.filter((h) => h.health_status === 'critical').length;
  const avgHealth =
    healthScores.length > 0
      ? Math.round(healthScores.reduce((s, h) => s + (h.health_score || 0), 0) / healthScores.length)
      : 0;
  const activeOnboarding = onboardings.filter((o) => o.status === 'in_progress').length;
  const identifiedOpps = opportunities.filter((o) => o.status === 'identified').length;

  const statCards = [
    { icon: Users, value: customers.length, label: 'Customers', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', iconColor: 'text-violet-500' },
    { icon: Heart, value: avgHealth, label: 'Avg Health', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', iconColor: 'text-pink-500' },
    { icon: CheckCircle, value: healthyCount, label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-500' },
    { icon: AlertTriangle, value: atRiskCount, label: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-500' },
    { icon: TrendingDown, value: criticalCount, label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-500' },
    { icon: Clock, value: activeOnboarding, label: 'Onboarding', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-500' },
    { icon: Target, value: identifiedOpps, label: 'Opportunities', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', iconColor: 'text-violet-500' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Customer Success</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track health, onboarding, interactions & growth opportunities
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => calculateHealthMutation.mutate()}
            disabled={calculateHealthMutation.isPending || customers.length === 0}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {calculateHealthMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
            ) : (
              <><Heart className="w-4 h-4" /> Calculate Health</>
            )}
          </Button>
          <Button
            onClick={() => identifyOpportunitiesMutation.mutate()}
            disabled={identifyOpportunitiesMutation.isPending || customers.length === 0}
            variant="outline"
            className="gap-2"
          >
            {identifyOpportunitiesMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Finding...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Find Opportunities</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-3 sm:p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health status summary bar */}
      {healthScores.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> {healthyCount} Healthy
          </Badge>
          <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> {atRiskCount} At Risk
          </Badge>
          <Badge className="bg-red-100 text-red-700 border border-red-200">
            <TrendingDown className="w-3 h-3 mr-1" /> {criticalCount} Critical
          </Badge>
          <span className="text-xs text-gray-400 self-center">
            • Last calculated: {healthScores[0]?.last_calculated ? new Date(healthScores[0].last_calculated).toLocaleDateString() : 'Never'}
          </span>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="health" className="gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Health Scores
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Onboarding
          </TabsTrigger>
          <TabsTrigger value="interactions" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Interactions
          </TabsTrigger>
          <TabsTrigger value="surveys" className="gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Surveys
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-1.5">
            <Target className="w-3.5 h-3.5" /> Opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <HealthDashboard healthScores={healthScores} contacts={contacts} avgHealth={avgHealth} />
        </TabsContent>

        <TabsContent value="onboarding">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowOnboardingModal(true)} className="gap-2">
              <Users className="w-4 h-4" /> Start Onboarding
            </Button>
          </div>
          <OnboardingTracker
            onboardings={onboardings}
            contacts={contacts}
            onUpdate={(id, data) => updateOnboardingMutation.mutate({ id, data })}
          />
        </TabsContent>

        <TabsContent value="interactions">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => { setEditingInteraction(null); setShowInteractionModal(true); }}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Log Interaction
            </Button>
          </div>
          <InteractionTimeline
            interactions={interactions}
            contacts={contacts}
            onEdit={(interaction) => { setEditingInteraction(interaction); setShowInteractionModal(true); }}
          />
        </TabsContent>

        <TabsContent value="surveys">
          <SurveyPanel surveys={surveys} contacts={contacts} />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunityPanel opportunities={opportunities} contacts={contacts} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <InteractionModal
        open={showInteractionModal}
        onClose={() => { setShowInteractionModal(false); setEditingInteraction(null); }}
        interaction={editingInteraction}
        contacts={customers}
        onSave={(data) => createInteractionMutation.mutate(data)}
        isLoading={createInteractionMutation.isPending}
      />
      <OnboardingModal
        open={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        contacts={customers.filter((c) => !onboardings.find((o) => o.contact_id === c.id))}
        onSave={(data) => createOnboardingMutation.mutate(data)}
        isLoading={createOnboardingMutation.isPending}
      />
    </div>
  );
}