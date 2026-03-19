import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    // Only admins can update user profiles
    if (!currentUser || currentUser.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, full_name, email } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Use service role to update user (admin privilege)
    const result = await base44.asServiceRole.entities.User.update(userId, updateData);

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
