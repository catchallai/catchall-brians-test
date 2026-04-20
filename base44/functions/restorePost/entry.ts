import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { postId?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const postId = body.postId;
    if (!postId) {
      return Response.json({ error: 'postId is required' }, { status: 400 });
    }

    const posts = await base44.entities.CalendarPost.filter({ id: postId });
    const post = posts[0];
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'deleted') {
      return Response.json({ error: 'Post is not deleted' }, { status: 409 });
    }

    const historyEntry = {
      action: 'restored',
      by_email: user.email,
      by_name: user.full_name || user.email,
      timestamp: new Date().toISOString(),
    };

    const updated = await base44.entities.CalendarPost.update(postId, {
      status: 'draft',
      deleted_at: null,
      deleted_by: null,
      deleted_by_name: null,
      purge_at: null,
      workflow_history: [...(post.workflow_history || []), historyEntry],
    });

    return Response.json({ post: updated });
  } catch (error) {
    console.error('restorePost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
