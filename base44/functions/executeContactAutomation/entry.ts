import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Handle entity automation payload
    let contact_id, old_status, new_status;

    if (payload.event && payload.event.entity_name === 'Contact') {
      contact_id = payload.event.entity_id;
      new_status = payload.data?.status;
      old_status = payload.old_data?.status;
    } else {
      // Handle direct function call
      contact_id = payload.contact_id;
      new_status = payload.new_status;
      old_status = payload.old_status;
    }

    if (!contact_id || !new_status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all active automation rules for contact status changes
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({
      trigger_type: 'contact_status_change',
      trigger_value: new_status,
      is_active: true,
    });

    if (rules.length === 0) {
      return Response.json({ created_tasks: 0 });
    }

    // Get contact details
    const contact = await base44.asServiceRole.entities.Contact.filter({ id: contact_id });
    if (!contact || contact.length === 0) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    const createdTasks = [];

    // Execute each matching rule
    for (const rule of rules) {
      if (rule.action_type === 'create_task' && rule.action_config?.task_title) {
        const task = await base44.asServiceRole.entities.Task.create({
          title: rule.action_config.task_title,
          description: rule.action_config.task_description || '',
          contact_id: contact_id,
          status: 'pending',
          priority: 'medium',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
