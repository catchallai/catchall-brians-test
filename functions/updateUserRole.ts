import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, new_role } = await req.json();

    if (!user_email || !new_role) {
      return Response.json({ error: 'user_email and new_role are required' }, { status: 400 });
    }

    const validRoles = ['admin', 'editor', 'viewer', 'user'];
    if (!validRoles.includes(new_role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the user to update
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Update user role (using service role)
    await base44.asServiceRole.entities.User.update(user.id, { role: new_role });

    return Response.json({
      success: true,
      message: `User role updated to ${new_role}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});