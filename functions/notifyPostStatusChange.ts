import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, status, message, notifyUsers } = await req.json();

    if (!postId || !status) {
      return Response.json({ error: 'Missing postId or status' }, { status: 400 });
    }

    // Fetch the post
    const post = await base44.asServiceRole.entities.CalendarPost.filter(
      { id: postId }
    );

    if (!post || post.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = post[0];

    // Create notifications based on status
    const notifications = [];

    if (status === 'approved') {
      notifications.push({
        recipient_email: postData.created_by,
        type: 'post_approved',
        title: 'Post Approved ✓',
        message: `"${postData.title || postData.caption?.substring(0, 30)}" has been approved`,
        post_id: postId,
      });
    } else if (status === 'rejected') {
      notifications.push({
        recipient_email: postData.created_by,
        type: 'post_rejected',
        title: 'Post Rejected',
        message: `"${postData.title || postData.caption?.substring(0, 30)}" was rejected. ${message || ''}`,
        post_id: postId,
      });
    } else if (status === 'pending_review') {
      // Notify assigned approver
      if (postData.assigned_to_email) {
        notifications.push({
          recipient_email: postData.assigned_to_email,
          type: 'post_assigned',
          title: 'Post Awaiting Review',
          message: `"${postData.title || postData.caption?.substring(0, 30)}" is awaiting your review`,
          post_id: postId,
        });
      }
    } else if (status === 'changes_requested') {
      notifications.push({
        recipient_email: postData.created_by,
        type: 'status_changed',
        title: 'Changes Requested',
        message: `Changes requested for "${postData.title || postData.caption?.substring(0, 30)}". ${message || ''}`,
        post_id: postId,
      });
    }

    // Notify additional users if specified
    if (notifyUsers && Array.isArray(notifyUsers)) {
      for (const email of notifyUsers) {
        notifications.push({
          recipient_email: email,
          type: 'mention',
          title: 'You were mentioned',
          message: `${user.full_name} mentioned you regarding a post`,
          post_id: postId,
        });
      }
    }

    // Create all notifications
    for (const notif of notifications) {
      await base44.asServiceRole.entities.Notification.create(notif);
    }

    return Response.json({
      success: true,
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});