import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { task_id, entity_type, assigned_to, assigned_by, title, due_date } = await req.json();

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: assigned_to,
      type: 'task_assignment',
      title: `New ${entity_type} assigned to you`,
      message: `${assigned_by} assigned you: ${title}`,
      is_read: false,
      action_url: entity_type === 'task' ? `/tasks?id=${task_id}` : `/issues?id=${task_id}`,
      metadata: {
        task_id,
        entity_type,
        assigned_by,
      },
    });

    // Create task assignment record
    await base44.asServiceRole.entities.TaskAssignment.create({
      task_id,
      entity_type,
      assigned_to,
      assigned_by,
      is_read: false,
      due_date: due_date || null,
    });

    // Send email notification
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: assigned_to,
        subject: `New ${entity_type} assigned to you`,
        body: `
          <h2>New Assignment</h2>
          <p><strong>${assigned_by}</strong> has assigned you a ${entity_type}:</p>
          <p><strong>${title}</strong></p>
          <p>Check your inbox for details.</p>
        `,
      });
    } catch (emailError) {
      console.log('Email notification failed:', emailError.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Assignment notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
