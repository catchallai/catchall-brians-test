import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { opportunity_id, old_stage, new_stage } = await req.json();

    if (!opportunity_id || !new_stage) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all active automation rules for opportunity stage changes
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({
      trigger_type: 'opportunity_stage_change',
      trigger_value: new_stage,
      is_active: true,
    });

    if (rules.length === 0) {
      return Response.json({ created_tasks: 0 });
    }

    // Get opportunity details
    const opportunity = await base44.asServiceRole.entities.Opportunity.filter({
      id: opportunity_id,
    });
    if (!opportunity || opportunity.length === 0) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const createdTasks = [];

    // Execute each matching rule
    for (const rule of rules) {
      if (rule.action_type === 'create_task' && rule.action_config?.task_title) {
        const task = await base44.asServiceRole.entities.Task.create({
          title: rule.action_config.task_title,
          description: rule.action_config.task_description || '',
          contact_id: opportunity[0].contact_id,
          opportunity_id: opportunity_id,
          status: 'pending',
          priority: 'medium',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        createdTasks.push(task);

        // Increment rule run count
        await base44.asServiceRole.entities.AutomationRule.update(rule.id, {
          run_count: (rule.run_count || 0) + 1,
        });
      }
    }

    return Response.json({ created_tasks: createdTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
