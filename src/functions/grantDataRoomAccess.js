import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { dataRoomId, contactEmail, contactName, contactId, accessLevel = 'view', expiresInDays = 30 } = payload;

    if (!dataRoomId || !contactEmail) {
      return Response.json({ error: 'Missing dataRoomId or contactEmail' }, { status: 400 });
    }

    // Generate secure random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Check if access already exists
    const existing = await base44.asServiceRole.entities.DataRoomAccess.filter({
      data_room_id: dataRoomId,
      contact_email: contactEmail,
    });

    let access;

    if (existing.length > 0) {
      // Update existing access
      access = await base44.asServiceRole.entities.DataRoomAccess.update(
        existing[0].id,
        {
          access_level: accessLevel,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          access_token: token,
        }
      );
    } else {
      // Create new access
      access = await base44.asServiceRole.entities.DataRoomAccess.create({
        data_room_id: dataRoomId,
        contact_email: contactEmail,
        contact_name: contactName || contactEmail.split('@')[0],
        contact_id: contactId,
        access_level: accessLevel,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        access_token: token,
      });
    }

    // Get data room info for portal URL
    const dataRoom = await base44.asServiceRole.entities.ProjectDataRoom.get(dataRoomId);

    // deno-lint-ignore no-undef
    // deno-lint-ignore no-undef
    const portalUrl = `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/DataRoomPortal?token=${token}`;

    // Send welcome email to client (optional - integrate with email service)
    console.log(`Client access granted: ${contactEmail}`);
    console.log(`Portal URL: ${portalUrl}`);

    return Response.json({
      access,
      portalUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in grantDataRoomAccess:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});