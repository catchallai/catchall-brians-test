import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  // Calculate health for all customers
  const calculateHealthMutation = useMutation({
    mutationFn: async () => {
      const healthPromises = contacts
        .filter((c) => c.status === 'customer')
        .map(async (contact) => {
          const contactInteractions = interactions.filter((i) => i.contact_id === contact.id);
          const contactSurveys = surveys.filter(
            (s) => s.contact_id === contact.id && s.status === 'completed'
          );
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
                ? (
                    contactSurveys
                      .filter((s) => s.survey_type === 'nps')
                      .reduce((sum, s) => sum + (s.score || 0), 0) /
                    contactSurveys.filter((s) => s.survey_type === 'nps').length
                  ).toFixed(1)
                : 'N/A'
            }
- Promoters: ${contactSurveys.filter((s) => s.nps_category === 'promoter').length}
- Detractors: ${contactSurveys.filter((s) => s.nps_category === 'detractor').length}

Calculate:
1. health_score (0-100): Weighted combination
2. health_status (healthy/at_risk/critical): Based on score
3. usage_score (0-100): Product adoption level
4. engagement_score (0-100): Interaction frequency/quality
5. satisfaction_score (0-100): Survey results
6. support_score (0-100): Support interaction quality
7. score_breakdown: Detailed factors
8. risk_factors: Array of concerning signals
9. positive_signals: Array of good signals
10. recommended_actions: 3-4 specific CS actions
11. trend (improving/stable/declining): Based on recent data`,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-health'] });
    },
  });

  // Identify upsell opportunities
  const identifyOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const oppPromises = contacts
        .filter((c) => c.status === 'customer')
        .map(async (contact) => {
          const health = healthScores.find((h) => h.contact_id === contact.id);
          const contactInteractions = interactions.filter((i) => i.contact_id === contact.id);
          const contactSurveys = surveys.filter(
            (s) => s.contact_id === contact.id && s.status === 'completed'
          );

          const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Identify upsell/cross-sell opportunities for:

Customer: ${contact.first_name} ${contact.last_name}
Company: ${contact.company || 'Unknown'}
Health Score: ${health?.health_score || 'Unknown'}/100
Health Status: ${health?.health_status || 'Unknown'}

Positive Signals:
${health?.positive_signals?.join('\n') || 'None'}

Recent Interactions:
${contactInteractions
  .slice(0, 5)
  .map((i) => `- ${i.interaction_type}: ${i.summary || 'No summary'} (${i.sentiment})`)
  .join('\n')}

Recent Feedback:
${contactSurveys
  .slice(0, 3)
  .map((s) => `- ${s.survey_type}: ${s.score} - ${s.feedback || 'No feedback'}`)
  .join('\n')}

Identify potential opportunities (return array of opportunities):
For each opportunity provide:
1. opportunity_type (upsell/cross_sell/expansion/renewal)
2. product_service: Specific product/service to offer
3. estimated_value: Revenue estimate
4. confidence_score (0-100): How likely to convert
5. signals: Array of buying signals detected
6. reasoning: Why this opportunity exists
7. recommended_approach: How to pitch
8. best_contact_time: When to reach out

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-opportunities'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboarding'] });
    },
  });

  // Stats
  const customers = contacts.filter((c) => c.status === 'customer');
  const healthyCount = healthScores.filter((h) => h.health_status === 'healthy').length;
  const atRiskCount = healthScores.filter((h) => h.health_status === 'at_risk').length;
  const criticalCount = healthScores.filter((h) => h.health_status === 'critical').length;
  const avgHealth =
    healthScores.length > 0
      ? Math.round(
          healthScores.reduce((sum, h) => sum + (h.health_score || 0), 0) / healthScores.length
        )
      : 0;
  const activeOnboarding = onboardings.filter((o) => o.status === 'in_progress').length;
  const identifiedOpps = opportunities.filter((o) => o.status === 'identified').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Success</h1>
          <p className="text-gray-500 mt-1">Track health, onboarding, and growth opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => calculateHealthMutation.mutate()}
            disabled={calculateHealthMutation.isPending || customers.length === 0}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {calculateHealthMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Calculating...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" /> Calculate Health
              </>
            )}
          </Button>
          <Button
            onClick={() => identifyOpportunitiesMutation.mutate()}
            disabled={identifyOpportunitiesMutation.isPending || customers.length === 0}
            variant="outline"
            className="gap-2"
          >
            {identifyOpportunitiesMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Finding...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Find Opportunities
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
            <p className="text-xs text-gray-500">Total Customers</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{healthyCount}</p>
            <p className="text-xs text-gray-500">Healthy</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{atRiskCount}</p>
            <p className="text-xs text-gray-500">At Risk</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-xs text-gray-500">Critical</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{activeOnboarding}</p>
            <p className="text-xs text-gray-500">Onboarding</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-violet-600">{identifiedOpps}</p>
            <p className="text-xs text-gray-500">Opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Scores</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <HealthDashboard healthScores={healthScores} contacts={contacts} avgHealth={avgHealth} />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowOnboardingModal(true)} className="gap-2">
              <Users className="w-4 h-4" />
              Start Onboarding
            </Button>
          </div>
          <OnboardingTracker
            onboardings={onboardings}
            contacts={contacts}
            onUpdate={(id, data) => updateOnboardingMutation.mutate({ id, data })}
          />
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingInteraction(null);
                setShowInteractionModal(true);
              }}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Log Interaction
            </Button>
          </div>
          <InteractionTimeline
            interactions={interactions}
            contacts={contacts}
            onEdit={(interaction) => {
              setEditingInteraction(interaction);
              setShowInteractionModal(true);
            }}
          />
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <SurveyPanel surveys={surveys} contacts={contacts} />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <OpportunityPanel opportunities={opportunities} contacts={contacts} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <InteractionModal
        open={showInteractionModal}
        onClose={() => {
          setShowInteractionModal(false);
          setEditingInteraction(null);
        }}
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
