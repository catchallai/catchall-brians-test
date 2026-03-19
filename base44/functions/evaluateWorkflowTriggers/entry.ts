import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active workflows
    const workflows = await base44.asServiceRole.entities.ProactiveEngagementWorkflow.filter({
      is_active: true,
    });

    // Get all customers
    const contacts = await base44.asServiceRole.entities.Contact.filter({ status: 'customer' });

    const results = [];

    for (const workflow of workflows) {
      for (const contact of contacts) {
        // Check if workflow should trigger
        if (shouldTriggerWorkflow(workflow, contact)) {
          // Check execution frequency limits
          const recentExecutions = await base44.asServiceRole.entities.WorkflowExecutionLog.filter({
            workflow_id: workflow.id,
            contact_id: contact.id,
            status: 'completed',
          });

          const lastExecution = recentExecutions[0];
          const canExecute = canExecuteWorkflow(workflow, lastExecution);

          if (canExecute) {
            // Trigger workflow execution
            const response = await fetch(
              `${Deno.env.get('BASE44_APP_URL')}/api/functions/executeWorkflow`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}`,
                },
                body: JSON.stringify({
                  workflow_id: workflow.id,
                  contact_id: contact.id,
                }),
              }
            );

            if (response.ok) {
              results.push({
                workflow_id: workflow.id,
                contact_id: contact.id,
                status: 'triggered',
              });
            }
          }
        }
      }
    }

    return Response.json({
      total_workflows_checked: workflows.length,
      total_contacts_checked: contacts.length,
      workflows_triggered: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function shouldTriggerWorkflow(workflow, contact) {
  const { trigger_type, trigger_condition } = workflow;
  const metric = trigger_condition.metric;
  const operator = trigger_condition.operator;
  const value = trigger_condition.value;

  let contactValue = null;

  if (trigger_type === 'health_score') {
    contactValue = contact.health_score || 50;
  } else if (trigger_type === 'lifecycle_stage') {
    contactValue = contact.lifecycle_stage || 'prospect';
  } else if (trigger_type === 'renewal_date') {
    // Days until renewal
    const renewalDate = contact.renewal_date;
    if (!renewalDate) return false;
    const daysUntil = Math.ceil((new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
    contactValue = daysUntil;
  } else if (trigger_type === 'no_engagement') {
    // Days since last contact
    const lastContact = contact.last_contacted;
    if (!lastContact) return true;
    const daysSince = Math.ceil((new Date() - new Date(lastContact)) / (1000 * 60 * 60 * 24));
    contactValue = daysSince;
  }

  if (contactValue === null) return false;

  return evaluateCondition(contactValue, operator, value);
}

function evaluateCondition(contactValue, operator, value) {
  const numValue = Number(value);
  const numContact = Number(contactValue);

  switch (operator) {
    case 'equals':
      return contactValue === value;
    case 'greater_than':
      return numContact > numValue;
    case 'less_than':
      return numContact < numValue;
    case 'greater_than_or_equal':
      return numContact >= numValue;
    case 'less_than_or_equal':
      return numContact <= numValue;
    case 'contains':
      return String(contactValue).includes(value);
    default:
      return false;
  }
}

function canExecuteWorkflow(workflow, lastExecution) {
  if (!lastExecution) return true;

  const { execution_frequency, max_executions } = workflow;
  const lastTime = new Date(lastExecution.completed_at);
  const now = new Date();

  // Check max executions
  if (max_executions && lastExecution.count >= max_executions) {
    return false;
  }

  // Check frequency
  const hoursSince = (now - lastTime) / (1000 * 60 * 60);

  switch (execution_frequency) {
    case 'once':
      return false;
    case 'daily':
      return hoursSince >= 24;
    case 'weekly':
      return hoursSince >= 168;
    case 'monthly':
      return hoursSince >= 720;
    default:
      return true;
  }
}
