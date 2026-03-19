import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const healthScores = await base44.entities.CustomerHealth.list('-created_date', 500);
    const contacts = await base44.entities.Contact.list('-created_date', 500);
    const onboardings = await base44.entities.CustomerOnboarding.list('-created_date', 500);
    const renewals = await base44.entities.RenewalForecast.list('-renewal_date', 500);
    const rules = await base44.entities.ProactiveEngagementRule.list('-created_date', 500);

    const activeRules = rules.filter((r) => r.is_active);
    let tasksCreated = 0;
    let alertsCreated = 0;

    // Process each rule
    for (const rule of activeRules) {
      let matchingContacts = [];

      if (rule.rule_type === 'health_based') {
        // Health-based rule
        const metric = rule.trigger_condition.metric;
        const operator = rule.trigger_condition.operator;
        const value = parseFloat(rule.trigger_condition.value);

        matchingContacts = healthScores
          .filter((h) => {
            const metricValue = h[metric] || 0;
            switch (operator) {
              case 'less_than':
                return metricValue < value;
              case 'greater_than':
                return metricValue > value;
              case 'less_than_or_equal':
                return metricValue <= value;
              case 'greater_than_or_equal':
                return metricValue >= value;
              case 'equals':
                return metricValue === value;
              default:
                return false;
            }
          })
          .map((h) => contacts.find((c) => c.id === h.contact_id))
          .filter(Boolean);
      } else if (rule.rule_type === 'timeline_based') {
        // Renewal timeline
        matchingContacts = renewals
          .filter((r) => {
            const daysLeft = r.days_to_renewal;
            return daysLeft <= parseInt(rule.trigger_condition.value) && daysLeft > 0;
          })
          .map((r) => contacts.find((c) => c.id === r.contact_id))
          .filter(Boolean);
      }

      // Create tasks and alerts for matching contacts
      for (const contact of matchingContacts) {
        if (!contact) continue;

        const onboarding = onboardings.find((o) => o.contact_id === contact.id);
        const csmAssigned = onboarding?.csm_assigned || 'unassigned';

        // Create task
        if (rule.task_template) {
          try {
            await base44.entities.CSMTask.create({
              contact_id: contact.id,
              csm_assigned: csmAssigned,
              title: rule.task_template,
              description: `Auto-generated from rule: ${rule.name}`,
              priority: rule.priority,
              status: 'open',
              task_type: 'health_check',
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
            tasksCreated++;
          } catch (e) {
            console.log('Task creation error:', e.message);
          }
        }

        // Create alert
        try {
          await base44.entities.CustomerAlert.create({
            contact_id: contact.id,
            alert_type: rule.rule_type === 'health_based' ? 'health_decline' : 'renewal_at_risk',
            severity: rule.priority === 'critical' ? 'critical' : 'warning',
            title: rule.name,
            message: `Engagement needed: ${rule.recommended_actions?.[0] || 'Check customer status'}`,
            triggered_by: rule.name,
            recommended_action: rule.recommended_actions?.[0],
            csm_assigned: csmAssigned,
            is_active: true,
          });
          alertsCreated++;
        } catch (e) {
          console.log('Alert creation error:', e.message);
        }
      }

      // Update rule trigger count
      await base44.entities.ProactiveEngagementRule.update(rule.id, {
        times_triggered: (rule.times_triggered || 0) + matchingContacts.length,
      });
    }

    return Response.json({
      success: true,
      tasksCreated,
      alertsCreated,
      rulesProcessed: activeRules.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
