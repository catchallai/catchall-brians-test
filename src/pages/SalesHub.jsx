import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Target, TrendingUp, Plus, PhoneCall, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CallLoggerModal from '@/components/sales/CallLoggerModal';
import SalesCallCard from '@/components/sales/SalesCallCard';
import FollowUpPanel from '@/components/sales/FollowUpPanel';
import SalesForecastCard from '@/components/sales/SalesForecastCard';
import WorkflowPanel from '@/components/sales/WorkflowPanel';
import LeadScoringPanel from '@/components/sales/LeadScoringPanel';
import SalesPipelineKanban from '@/components/sales/SalesPipelineKanban';
import DealSearchFilter from '@/components/sales/DealSearchFilter';
import SalesPipelineAnalytics from '@/components/sales/SalesPipelineAnalytics';
import DealProgressionRules from '@/components/sales/DealProgressionRules';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SalesHub() {
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const queryClient = useQueryClient();

  const { data: salesCalls = [] } = useQuery({
    queryKey: ['sales-calls'],
    queryFn: () => base44.entities.SalesCall.list('-call_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 100),
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ['sales-followups'],
    queryFn: () => base44.entities.SalesFollowUp.list('-scheduled_date', 100),
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['sales-forecasts'],
    queryFn: () => base44.entities.SalesForecast.list('-created_date', 10),
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['deal-workflows'],
    queryFn: () => base44.entities.DealWorkflow.list('-created_date', 50),
  });

  const { data: workflowExecutions = [] } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => base44.entities.WorkflowExecution.list('-created_date', 100),
  });

  const { data: leadScores = [] } = useQuery({
    queryKey: ['lead-scores'],
    queryFn: () => base44.entities.LeadScore.list('-total_score', 100),
  });

  const latestForecast = forecasts[0];

  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const handleDealDrop = (deal, newStage) => {
    updateDealMutation.mutate({
      id: deal.id,
      data: { ...deal, stage: newStage },
    });
  };

  const createCallMutation = useMutation({
    mutationFn: async (data) => {
      const call = editingCall
        ? await base44.entities.SalesCall.update(editingCall.id, data)
        : await base44.entities.SalesCall.create(data);

      if (!editingCall && data.sentiment === 'positive' && data.deal_id) {
        await checkAndExecuteWorkflows('positive_call', {
          dealId: data.deal_id,
          contactId: data.contact_id,
        });
      }

      if (!editingCall && data.sentiment === 'negative' && data.deal_id) {
        await checkAndExecuteWorkflows('negative_call', {
          dealId: data.deal_id,
          contactId: data.contact_id,
        });
      }

      return call;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
      setShowCallLogger(false);
      setEditingCall(null);
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['sales-reservations'],
    queryFn: () => base44.entities.SalesReservation.list('-created_date', 100),
  });

  const { data: enrichedLeads = [] } = useQuery({
    queryKey: ['lead-enrichments'],
    queryFn: () => base44.entities.LeadEnrichment.list('-created_date', 100),
  });

  const generateFollowUpsMutation = useMutation({
    mutationFn: async () => {
      const callsNeedingFollowup = salesCalls
        .filter((c) => c.next_action && c.call_status === 'completed')
        .slice(0, 5);

      const reservationsNeedingFollowup = reservations
        .filter((r) => r.status === 'pending' || r.status === 'confirmed')
        .slice(0, 5);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these sales activities and generate smart follow-up actions:

Recent Calls Needing Follow-up:
${callsNeedingFollowup
  .map(
    (c) => `
- Contact: ${getContactName(c.contact_id)}
- Call date: ${c.call_date}
- Duration: ${c.duration_minutes} min
- Sentiment: ${c.sentiment}
- Notes: ${c.notes}
- Next action: ${c.next_action}
`
  )
  .join('\n')}

Active Reservations:
${reservationsNeedingFollowup
  .map(
    (r) => `
- Contact: ${getContactName(r.contact_id)}
- Title: ${r.title}
- Type: ${r.reservation_type}
- Date: ${r.reservation_date}
- Value: $${r.value}
- Status: ${r.status}
- Payment: ${r.payment_status}
`
  )
  .join('\n')}

For each item, generate follow-up actions with:
1. follow_up_type (email/call/task/meeting)
2. priority (low/medium/high/urgent)
3. suggested_days_from_now (how many days from today)
4. action_description (what to do)
5. personalized_message (tailored message template with contact name placeholder)
6. reasoning (why this timing and approach)
7. sales_stage (prospecting/qualification/proposal/negotiation/closing/retention)

Consider:
- Call sentiment and outcomes
- Reservation urgency and value
- Payment status
- Time since last contact
- Next actions mentioned`,
        response_json_schema: {
          type: 'object',
          properties: {
            follow_ups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source_type: { type: 'string' },
                  source_id: { type: 'string' },
                  contact_id: { type: 'string' },
                  follow_up_type: { type: 'string' },
                  priority: { type: 'string' },
                  suggested_days_from_now: { type: 'number' },
                  action_description: { type: 'string' },
                  personalized_message: { type: 'string' },
                  reasoning: { type: 'string' },
                  sales_stage: { type: 'string' },
                },
              },
            },
          },
        },
      });

      const followUpPromises = analysis.follow_ups.map(async (fu) => {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + fu.suggested_days_from_now);

        const sourceData =
          fu.source_type === 'call'
            ? callsNeedingFollowup.find((c) => c.id === fu.source_id)
            : reservationsNeedingFollowup.find((r) => r.id === fu.source_id);

        return base44.entities.SalesFollowUp.create({
          contact_id: fu.contact_id,
          deal_id: sourceData?.deal_id,
          call_id: fu.source_type === 'call' ? fu.source_id : undefined,
          reservation_id: fu.source_type === 'reservation' ? fu.source_id : undefined,
          follow_up_type: fu.follow_up_type,
          priority: fu.priority,
          scheduled_date: scheduledDate.toISOString(),
          ai_suggested_time: scheduledDate.toISOString(),
          action_description: fu.action_description,
          ai_suggested_message: fu.personalized_message,
          reasoning: fu.reasoning,
          sales_stage: fu.sales_stage,
          status: 'pending',
        });
      });

      await Promise.all(followUpPromises);
      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
    },
  });

  const sendFollowUpEmailMutation = useMutation({
    mutationFn: async (followUp) => {
      const contact = contacts.find((c) => c.id === followUp.contact_id);
      if (!contact?.email) {
        throw new Error('Contact email not found');
      }

      await base44.integrations.Core.SendEmail({
        to: contact.email,
        subject: `Follow-up: ${followUp.action_description}`,
        body: followUp.ai_suggested_message,
      });

      await base44.entities.SalesFollowUp.update(followUp.id, {
        sent: true,
        status: 'completed',
        completed_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
    },
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: (data) =>
      data.id
        ? base44.entities.DealWorkflow.update(data.id, data)
        : base44.entities.DealWorkflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-workflows'] });
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.DealWorkflow.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-workflows'] });
    },
  });

  const checkAndExecuteWorkflows = async (trigger, context) => {
    const activeWorkflows = workflows.filter((w) => w.is_active && w.trigger_type === trigger);

    for (const workflow of activeWorkflows) {
      const actions = [];

      for (const action of workflow.actions) {
        try {
          if (action.type === 'update_stage' && context.dealId) {
            await base44.entities.Deal.update(context.dealId, {
              stage: action.config.new_stage,
            });
            actions.push({ type: 'update_stage', success: true });
          }

          if (action.type === 'send_email' && context.contactId) {
            const contact = contacts.find((c) => c.id === context.contactId);
            if (contact?.email) {
              await base44.integrations.Core.SendEmail({
                to: contact.email,
                subject: action.config.email_subject,
                body: action.config.email_body,
              });
              actions.push({ type: 'send_email', success: true });
            }
          }

          if (action.type === 'create_followup' && context.contactId && context.dealId) {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + (action.config.days_from_now || 1));

            await base44.entities.SalesFollowUp.create({
              contact_id: context.contactId,
              deal_id: context.dealId,
              follow_up_type: 'task',
              priority: 'medium',
              scheduled_date: scheduledDate.toISOString(),
              action_description: action.config.action_description,
              status: 'pending',
            });
            actions.push({ type: 'create_followup', success: true });
          }
        } catch (error) {
          actions.push({ type: action.type, success: false, error: error.message });
        }
      }

      await base44.entities.WorkflowExecution.create({
        workflow_id: workflow.id,
        deal_id: context.dealId,
        contact_id: context.contactId,
        trigger_source: trigger,
        actions_executed: actions,
        status: actions.every((a) => a.success) ? 'success' : 'partial',
      });

      await base44.entities.DealWorkflow.update(workflow.id, {
        execution_count: (workflow.execution_count || 0) + 1,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
    queryClient.invalidateQueries({ queryKey: ['deal-workflows'] });
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
  };

  const completeFollowUpMutationWithWorkflow = useMutation({
    mutationFn: async (id) => {
      const followUp = followUps.find((f) => f.id === id);
      await base44.entities.SalesFollowUp.update(id, {
        status: 'completed',
        completed_date: new Date().toISOString(),
      });

      if (followUp?.deal_id) {
        await checkAndExecuteWorkflows('followup_completed', {
          dealId: followUp.deal_id,
          contactId: followUp.contact_id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
    },
  });

  const scoreLeadsMutation = useMutation({
    mutationFn: async () => {
      const scoringPromises = contacts.map(async (contact) => {
        // Gather data from various sources
        const enrichment = enrichedLeads.find((e) => e.contact_id === contact.id);
        const contactCalls = salesCalls.filter((c) => c.contact_id === contact.id);
        const contactFollowUps = followUps.filter((f) => f.contact_id === contact.id);
        const contactDeals = deals.filter((d) => d.contact_id === contact.id);

        const enrichmentInfo = enrichment
          ? `- Enrichment Score: ${enrichment.enrichment_score}/100
- Industry: ${enrichment.industry || 'Unknown'}
- Connections: ${enrichment.connections || 0}
- Skills: ${enrichment.skills?.length || 0}
- Experience: ${enrichment.experience?.length || 0} roles`
          : '- Not enriched';

        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this lead and provide a comprehensive AI-driven score (0-100):

Lead Information:
- Name: ${contact.first_name} ${contact.last_name}
- Company: ${contact.company || 'Unknown'}
- Job Title: ${contact.job_title || 'Unknown'}
- Status: ${contact.status}
- Source: ${contact.source || 'Unknown'}
- Email: ${contact.email ? 'Yes' : 'No'}
- Phone: ${contact.phone ? 'Yes' : 'No'}

LinkedIn Enrichment:
${enrichmentInfo}

Sales Interactions:
- Total Calls: ${contactCalls.length}
- Positive Calls: ${contactCalls.filter((c) => c.sentiment === 'positive').length}
- Negative Calls: ${contactCalls.filter((c) => c.sentiment === 'negative').length}
- Completed Follow-ups: ${contactFollowUps.filter((f) => f.status === 'completed').length}
- Pending Follow-ups: ${contactFollowUps.filter((f) => f.status === 'pending').length}
- Active Deals: ${contactDeals.filter((d) => d.status !== 'won' && d.status !== 'lost').length}
- Won Deals: ${contactDeals.filter((d) => d.status === 'won').length}

Provide:
1. total_score (0-100, weighted combination)
2. demographic_score (0-100, based on company, title, enrichment)
3. behavioral_score (0-100, based on interactions, engagement)
4. engagement_score (0-100, based on follow-ups, responsiveness)
5. grade (A/B/C/D/F based on total_score: 90+=A, 80-89=B, 70-79=C, 60-69=D, <60=F)
6. score_breakdown (object with specific factors and their point contributions)
7. reasoning (2-3 sentences explaining the score)
8. recommended_actions (array of 2-3 specific next steps)

Scoring Guidelines:
- High-quality enrichment data: +15-25 points
- Active engagement (recent calls/emails): +20-30 points
- Positive sentiment: +15-20 points
- Decision-maker role (C-level, VP): +10-15 points
- Large company (500+ employees): +5-10 points
- Multiple touchpoints: +10-15 points
- Quick response time: +5-10 points`,
          response_json_schema: {
            type: 'object',
            properties: {
              total_score: { type: 'number' },
              demographic_score: { type: 'number' },
              behavioral_score: { type: 'number' },
              engagement_score: { type: 'number' },
              grade: { type: 'string' },
              score_breakdown: { type: 'object' },
              reasoning: { type: 'string' },
              recommended_actions: { type: 'array', items: { type: 'string' } },
            },
          },
        });

        // Delete old score if exists
        const existingScore = leadScores.find((s) => s.contact_id === contact.id);
        if (existingScore) {
          await base44.entities.LeadScore.delete(existingScore.id);
        }

        return base44.entities.LeadScore.create({
          contact_id: contact.id,
          ...analysis,
        });
      });

      await Promise.all(scoringPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scores'] });
    },
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (period) => {
      // Gather historical data
      const completedDeals = deals.filter((d) => d.status === 'won');
      const totalHistoricalRevenue = completedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const avgDealValue =
        completedDeals.length > 0 ? totalHistoricalRevenue / completedDeals.length : 0;

      // Current pipeline
      const activeDealsByStage = deals
        .filter((d) => d.status !== 'won' && d.status !== 'lost')
        .map((d) => ({
          id: d.id,
          name: d.name,
          stage: d.stage || 'unknown',
          value: d.value || 0,
          created_date: d.created_date,
          contact_id: d.contact_id,
        }));

      // Enriched lead data
      const enrichedWithContacts = enrichedLeads.filter((l) => l.contact_id);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze sales data and generate a forecast for ${period}:

Historical Performance:
- Total completed deals: ${completedDeals.length}
- Total revenue: $${totalHistoricalRevenue}
- Average deal value: $${avgDealValue.toFixed(2)}

Current Pipeline (${activeDealsByStage.length} deals):
${activeDealsByStage.map((d) => `- ${d.name}: $${d.value} (${d.stage})`).join('\n')}

Enriched Leads: ${enrichedWithContacts.length} leads with full data

Generate forecast with:
1. predicted_revenue (realistic estimate)
2. confidence_score (0-100)
3. deal_probabilities for each active deal:
   - deal_id, deal_name, current_stage, value
   - close_probability (0-100)
   - predicted_close_date (ISO format)
   - risk_level (low/medium/high/critical)
   - recommendation (specific action)
4. risks (3-5 items):
   - type, severity, description, impact_amount, mitigation
5. opportunities (3-5 items):
   - type, description, potential_value, action_required
6. trends:
   - revenue_trend (up/down/stable)
   - conversion_rate (0-100)
   - avg_deal_size (number)
   - sales_cycle_days (average)

Consider:
- Deal stages (earlier = lower probability)
- Time in pipeline (longer = risk)
- Lead quality from enrichment
- Historical win rates`,
        response_json_schema: {
          type: 'object',
          properties: {
            predicted_revenue: { type: 'number' },
            confidence_score: { type: 'number' },
            deal_probabilities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  deal_id: { type: 'string' },
                  deal_name: { type: 'string' },
                  current_stage: { type: 'string' },
                  value: { type: 'number' },
                  close_probability: { type: 'number' },
                  predicted_close_date: { type: 'string' },
                  risk_level: { type: 'string' },
                  recommendation: { type: 'string' },
                },
              },
            },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  description: { type: 'string' },
                  impact_amount: { type: 'number' },
                  mitigation: { type: 'string' },
                },
              },
            },
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  potential_value: { type: 'number' },
                  action_required: { type: 'string' },
                },
              },
            },
            trends: {
              type: 'object',
              properties: {
                revenue_trend: { type: 'string' },
                conversion_rate: { type: 'number' },
                avg_deal_size: { type: 'number' },
                sales_cycle_days: { type: 'number' },
              },
            },
          },
        },
      });

      const forecast = await base44.entities.SalesForecast.create({
        forecast_period: period,
        ...analysis,
      });

      return forecast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-forecasts'] });
    },
  });

  // Calculate stats
  const today = new Date();
  const todayCalls = salesCalls.filter((c) => {
    const callDate = new Date(c.call_date);
    return callDate.toDateString() === today.toDateString();
  });

  const completedCalls = salesCalls.filter((c) => c.call_status === 'completed');
  const activeDeals = deals.filter((d) => d.stage && !['won', 'lost'].includes(d.stage));
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const callStats = {
    total: salesCalls.length,
    today: todayCalls.length,
    completed: completedCalls.length,
    missed: salesCalls.filter((c) => c.call_status === 'no_answer' || c.call_type === 'missed')
      .length,
  };

  const getContactName = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const getDealName = (dealId) => {
    const deal = deals.find((d) => d.id === dealId);
    return deal ? deal.title : null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Sales Hub
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Sales performance dashboard and analytics
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCall(null);
            setShowCallLogger(true);
          }}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
        >
          <Phone className="w-4 h-4" />
          Log Call
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className="glass-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => (window.location.href = createPageUrl('LeadEnrichment'))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Leads Enriched</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {contacts.filter((c) => c.source === 'LinkedIn Enrichment').length}
                </p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Today's Calls</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {callStats.today}
                </p>
              </div>
              <PhoneCall className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="glass-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => (window.location.href = createPageUrl('Deals'))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Active Deals</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {activeDeals.length}
                </p>
              </div>
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="glass-card rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => (window.location.href = createPageUrl('Deals'))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Pipeline Value</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalPipelineValue)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      {/* Deal Search & Filter */}
      <div className="col-span-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Find Deals</h2>
        <DealSearchFilter deals={deals} onFilter={setFilteredDeals} />
        {filteredDeals.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredDeals.map((deal) => (
              <Card
                key={deal.id}
                className="glass-card cursor-pointer hover:shadow-md"
                onClick={() => window.scrollTo(0, 0)}
              >
                <CardContent className="p-4">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {deal.title}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${(deal.value / 1000).toFixed(0)}k
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {deal.stage}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Kanban */}
      <div className="col-span-full">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Deal Pipeline</h2>
        <SalesPipelineKanban deals={deals} onDealDrop={handleDealDrop} />
      </div>

      {/* Automated Deal Progression Rules */}
      <DealProgressionRules
        deals={deals}
        salesCalls={salesCalls}
        onApplyRules={(count) => {
          queryClient.invalidateQueries({ queryKey: ['deals'] });
          if (count > 0) {
            toast.success(`${count} deals progressed automatically`);
          }
        }}
      />

      {/* Sales Analytics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sales Performance Analytics
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
            {showAnalytics ? 'Hide' : 'Show'} Details
          </Button>
        </div>
        {showAnalytics && (
          <SalesPipelineAnalytics
            deals={deals}
            onExport={() => {
              const data = JSON.stringify(deals, null, 2);
              const element = document.createElement('a');
              element.setAttribute(
                'href',
                'data:application/json;charset=utf-8,' + encodeURIComponent(data)
              );
              element.setAttribute(
                'download',
                `sales-analytics-${new Date().toISOString().split('T')[0]}.json`
              );
              element.click();
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadScoringPanel
          contacts={contacts}
          leadScores={leadScores}
          onScore={() => scoreLeadsMutation.mutate()}
          isScoring={scoreLeadsMutation.isPending}
        />

        <SalesForecastCard
          forecast={latestForecast}
          onGenerate={(period) => generateForecastMutation.mutate(period)}
          isGenerating={generateForecastMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpPanel
          followUps={followUps}
          contacts={contacts}
          onGenerate={() => generateFollowUpsMutation.mutate()}
          onComplete={(id) => completeFollowUpMutationWithWorkflow.mutate(id)}
          onSend={(followUp) => sendFollowUpEmailMutation.mutate(followUp)}
          isGenerating={generateFollowUpsMutation.isPending}
        />

        <WorkflowPanel
          workflows={workflows}
          executions={workflowExecutions}
          onToggle={(id, is_active) => toggleWorkflowMutation.mutate({ id, is_active })}
          onEdit={(data) => saveWorkflowMutation.mutate(data)}
        />
      </div>

      {/* Recent Calls */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Calls</h3>
            <Button variant="outline" size="sm" onClick={() => setShowCallLogger(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Log Call
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesCalls.slice(0, 6).map((call) => (
              <SalesCallCard
                key={call.id}
                call={call}
                contactName={getContactName(call.contact_id)}
                dealName={getDealName(call.deal_id)}
                onEdit={() => {
                  setEditingCall(call);
                  setShowCallLogger(true);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <CallLoggerModal
        open={showCallLogger}
        onClose={() => {
          setShowCallLogger(false);
          setEditingCall(null);
        }}
        call={editingCall}
        contacts={contacts}
        deals={deals}
        onSave={(data) => createCallMutation.mutate(data)}
        isLoading={createCallMutation.isPending}
      />
    </div>
  );
}
