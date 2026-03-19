import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contact_ids } = await req.json();

    const contacts = await base44.entities.Contact.list('-created_date', 500);
    const healthScores = await base44.entities.CustomerHealth.list('-created_date', 500);
    const interactions = await base44.entities.CustomerInteraction.list('-interaction_date', 500);
    const surveys = await base44.entities.SatisfactionSurvey.list('-created_date', 500);
    const onboardings = await base44.entities.CustomerOnboarding.list('-created_date', 500);

    const targetContacts = contacts.filter((c) => !contact_ids || contact_ids.includes(c.id));

    const predictions = await Promise.all(
      targetContacts.map(async (contact) => {
        const health = healthScores.find((h) => h.contact_id === contact.id);
        const contactInteractions = interactions.filter((i) => i.contact_id === contact.id);
        const contactSurveys = surveys.filter(
          (s) => s.contact_id === contact.id && s.status === 'completed'
        );
        const onboarding = onboardings.find((o) => o.contact_id === contact.id);

        const recentInteractions = contactInteractions.filter(
          (i) => new Date(i.interaction_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        );

        const negativeInteractions = recentInteractions.filter(
          (i) => i.sentiment === 'negative'
        ).length;
        const supportIssues = recentInteractions.filter(
          (i) => i.interaction_type === 'support'
        ).length;
        const noEngagement = recentInteractions.length === 0;

        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Predict churn risk for customer:

Customer: ${contact.first_name} ${contact.last_name}
Company: ${contact.company || 'Unknown'}
Status: ${contact.status}

Health Metrics:
- Health Score: ${health?.health_score || 'N/A'}/100
- Health Status: ${health?.health_status || 'unknown'}
- Usage Score: ${health?.usage_score || 'N/A'}
- Engagement Score: ${health?.engagement_score || 'N/A'}
- Satisfaction Score: ${health?.satisfaction_score || 'N/A'}

Engagement (Last 90 days):
- Interactions: ${recentInteractions.length}
- Negative Interactions: ${negativeInteractions}
- Support Issues: ${supportIssues}
- No Engagement: ${noEngagement}

Surveys:
- Completed: ${contactSurveys.length}
- Avg NPS: ${
            contactSurveys.filter((s) => s.survey_type === 'nps' && s.score).length > 0
              ? (
                  contactSurveys
                    .filter((s) => s.survey_type === 'nps')
                    .reduce((sum, s) => sum + (s.score || 0), 0) /
                  contactSurveys.filter((s) => s.survey_type === 'nps').length
                ).toFixed(0)
              : 'N/A'
          }
- Detractors: ${contactSurveys.filter((s) => s.nps_category === 'detractor').length}

Onboarding:
- Status: ${onboarding?.status || 'not_started'}
- Progress: ${onboarding?.progress_percentage || 0}%
- Blockers: ${onboarding?.blockers?.length || 0}

Analyze and provide:
1. churn_risk_score (0-100): Likelihood of churn in next 90 days
2. risk_level (low/medium/high/critical): Risk classification
3. primary_risk_factors: Top 3 reasons for risk
4. engagement_signals: Positive or negative signals
5. recommended_interventions: 2-3 specific actions
6. timeline_to_churn: Estimated days if no action taken
7. recovery_potential: Can customer be saved? (0-100)`,
          response_json_schema: {
            type: 'object',
            properties: {
              churn_risk_score: { type: 'number' },
              risk_level: { type: 'string' },
              primary_risk_factors: { type: 'array', items: { type: 'string' } },
              engagement_signals: { type: 'array', items: { type: 'string' } },
              recommended_interventions: { type: 'array', items: { type: 'string' } },
              timeline_to_churn: { type: 'number' },
              recovery_potential: { type: 'number' },
            },
          },
        });

        return {
          contact_id: contact.id,
          contact_name: `${contact.first_name} ${contact.last_name}`,
          ...analysis,
          calculated_at: new Date().toISOString(),
        };
      })
    );

    return Response.json({ predictions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
