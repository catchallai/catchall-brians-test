import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active inactivity rules
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({
      trigger_type: 'contact_inactivity',
      is_active: true,
    });

    if (rules.length === 0) {
      return Response.json({ processed: 0 });
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // Find inactive contacts
    const allContacts = await base44.asServiceRole.entities.Contact.list('-created_date', 1000);
    const inactiveContacts = allContacts.filter((contact) => {
      const lastContacted = contact.last_contacted
        ? new Date(contact.last_contacted)
        : new Date(contact.created_date);
      return lastContacted < thirtyDaysAgo;
    });

    let tasksCreated = 0;

    // Process each inactive contact
    for (const contact of inactiveContacts) {
      // Check if task was already created for this contact
      const existingTasks = await base44.asServiceRole.entities.Task.filter({
        contact_id: contact.id,
        title: rules[0].action_config?.task_title,
        status: 'pending',
      });

      if (existingTasks.length === 0) {
        // Create task for re-engagement
        for (const rule of rules) {
          if (rule.action_type === 'create_task' && rule.action_config?.task_title) {
            await base44.asServiceRole.entities.Task.create({
              title: rule.action_config.task_title,
              description:
                rule.action_config.task_description ||
                `Re-engage with ${contact.first_name} ${contact.last_name}`,
              contact_id: contact.id,
              status: 'pending',
              priority: 'high',
              due_date: new Date().toISOString().split('T')[0],
            });
            tasksCreated++;

            // Increment rule run count
            await base44.asServiceRole.entities.AutomationRule.update(rule.id, {
              run_count: (rule.run_count || 0) + 1,
            });
          }
        }
      }
    }

    return Response.json({ processed: inactiveContacts.length, tasks_created: tasksCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
