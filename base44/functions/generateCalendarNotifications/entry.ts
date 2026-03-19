import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get all posts scheduled for tomorrow
    const posts = await base44.asServiceRole.entities.CalendarPost.filter({
      scheduled_date: tomorrowStr,
      status: { $ne: 'published' },
    });

    // Get all users to notify
    const users = await base44.asServiceRole.entities.User.list();

    const notifications = [];

    // Create notifications for upcoming posts
    for (const post of posts) {
      for (const user of users) {
        if (user.social_media_role !== 'viewer') {
          notifications.push({
            type: 'upcoming_post',
            post_id: post.id,
            user_id: user.id,
            message: `Post "${post.title || post.caption?.slice(0, 30) || 'Untitled'}" is scheduled for tomorrow at ${post.scheduled_time || 'unspecified time'}`,
          });
        }
      }
    }

    // Get posts pending approval
    const pendingPosts = await base44.asServiceRole.entities.CalendarPost.filter({
      status: 'pending_approval',
    });

    // Notify admins/editors about pending approvals
    for (const post of pendingPosts) {
      for (const user of users) {
        if (user.role === 'admin' || user.social_media_role === 'admin') {
          notifications.push({
            type: 'approval_request',
            post_id: post.id,
            user_id: user.id,
            message: `Post "${post.title || post.caption?.slice(0, 30) || 'Untitled'}" is awaiting approval`,
          });
        }
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await base44.asServiceRole.entities.CalendarNotification.bulkCreate(notifications);
    }

    return Response.json({
      success: true,
      notificationsCreated: notifications.length,
      message: `Created ${notifications.length} notifications`,
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
