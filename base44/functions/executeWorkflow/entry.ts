import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { workflow_id, contact_id } = await req.json();

    const workflow = await base44.asServiceRole.entities.ProactiveEngagementWorkflow.filter({
      id: workflow_id,
    });
    if (!workflow.length) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const wf = workflow[0];
    const contact = await base44.asServiceRole.entities.Contact.filter({ id: contact_id });
    if (!contact.length) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactData = contact[0];

    // Create execution log
    const executionLog = await base44.asServiceRole.entities.WorkflowExecutionLog.create({
      workflow_id,
      workflow_name: wf.name,
      contact_id,
      contact_name: `${contactData.first_name} ${contactData.last_name}`,
      status: 'running',
      trigger_metric: wf.trigger_type,
      started_at: new Date().toISOString(),
      executed_nodes: [],
    });

    const executedNodes = [];
    let failed = false;
    let errorMessage = '';

    // Execute each node
    for (const node of wf.workflow_nodes || []) {
      try {
        // Check node conditions
        if (node.conditions && node.conditions.length > 0) {
          const conditionsMet = evaluateConditions(node.conditions, contactData);
          if (!conditionsMet) {
            executedNodes.push({
              node_id: node.id,
              node_type: node.node_type,
              status: 'skipped',
              result: { reason: 'Conditions not met' },
            });
            continue;
          }
        }

        let result = {};

        // Execute based on node type
        if (node.node_type === 'send_email') {
          result = await executeEmailNode(node, contactData, base44);
        } else if (node.node_type === 'create_task') {
          result = await executeTaskNode(node, contactData, base44);
        } else if (node.node_type === 'send_message') {
          result = await executeMessageNode(node, contactData);
        } else if (node.node_type === 'create_alert') {
          result = await executeAlertNode(node, contactData, base44);
        } else if (node.node_type === 'wait') {
          result = { delay_minutes: node.config.delay_minutes };
        }

        executedNodes.push({
          node_id: node.id,
          node_type: node.node_type,
          status: 'completed',
          result,
        });
      } catch (error) {
        failed = true;
        errorMessage = error.message;
        executedNodes.push({
          node_id: node.id,
          node_type: node.node_type,
          status: 'failed',
          error: error.message,
        });
        break; // Stop on first failure
      }
    }

    // Update execution log
    await base44.asServiceRole.entities.WorkflowExecutionLog.update(executionLog.id, {
      status: failed ? 'failed' : 'completed',
      executed_nodes: executedNodes,
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    });

    // Update workflow stats
    await base44.asServiceRole.entities.ProactiveEngagementWorkflow.update(workflow_id, {
      total_executions: (wf.total_executions || 0) + 1,
      last_executed: new Date().toISOString(),
    });

    return Response.json({
      success: !failed,
      execution_id: executionLog.id,
      executed_nodes: executedNodes,
      error: failed ? errorMessage : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function evaluateConditions(conditions, contactData) {
  return conditions.every((cond) => {
    const value = contactData[cond.field];
    switch (cond.operator) {
      case 'equals':
        return value === cond.value;
      case 'greater_than':
        return value > cond.value;
      case 'less_than':
        return value < cond.value;
      case 'contains':
        return String(value).includes(cond.value);
      default:
        return true;
    }
  });
}

async function executeEmailNode(node, contact, base44) {
  const { template, subject, body, csm_email } = node.config;

  const emailBody = body
    .replace('{{first_name}}', contact.first_name)
    .replace('{{company}}', contact.company_name || 'Valued Customer');

  await base44.integrations.Core.SendEmail({
    to: contact.email,
    subject,
    body: emailBody,
    from_name: csm_email ? 'Customer Success Team' : undefined,
  });

  return { email_sent: true, recipient: contact.email };
}

async function executeTaskNode(node, contact, base44) {
  const { title, description, priority, csm_email } = node.config;

  const task = await base44.asServiceRole.entities.CSMTask.create({
    contact_id: contact.id,
    csm_assigned: csm_email,
    title: title.replace('{{company}}', contact.company_name || 'Contact'),
    description: description.replace('{{contact}}', `${contact.first_name} ${contact.last_name}`),
    priority,
    status: 'open',
    task_type: 'other',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  return { task_created: true, task_id: task.id };
}

async function executeMessageNode(node, contact) {
  const { message } = node.config;
  return {
    message_queued: true,
    recipient: contact.email,
    message_text: message.substring(0, 100),
  };
}

async function executeAlertNode(node, contact, base44) {
  const { alert_type, message, severity } = node.config;

  const alert = await base44.asServiceRole.entities.CustomerAlert.create({
    contact_id: contact.id,
    alert_type,
    severity,
    title: `Workflow Alert: ${alert_type}`,
    message,
    is_active: true,
  });

  return { alert_created: true, alert_id: alert.id };
}
