import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      user_email,
      type,
      title,
      body,
      related_entity_type,
      related_entity_id,
      actor_email,
      actor_name,
      action_url,
    } = await req.json();

    if (!user_email || !type || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await base44.entities.Notification.create({
      user_email,
      type,
      title,
      body,
      related_entity_type,
      related_entity_id,
      actor_email,
      actor_name,
      action_url,
      is_read: false,
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
