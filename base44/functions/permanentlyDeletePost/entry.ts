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

    await base44.entities.PostAuditLog.create({
      post_id: postId,
      action: 'post.permanently_deleted',
      user_email: user.email,
      user_name: user.full_name || user.email,
      source: 'ui',
      timestamp: new Date().toISOString(),
      metadata: {
        title: post.title || null,
        platforms: post.platforms || [],
      },
    });

    await base44.entities.CalendarPost.delete(postId);

    return Response.json({ ok: true, postId }, { status: 200 });
  } catch (error) {
    console.error('permanentlyDeletePost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
