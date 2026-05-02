import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generate9DigitCode() {
  let code = '';
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dataroom_id, name, description, allow_upload, allow_download } = await req.json();

    if (!dataroom_id || !name) {
      return Response.json(
        { error: 'Missing required fields: dataroom_id, name' },
        { status: 400 }
      );
    }

    const accessCode = generate9DigitCode();

    const portal = await base44.entities.DataRoomPortal.create({
      dataroom_id,
      access_code: accessCode,
      name,
      description: description || '',
      allow_upload: allow_upload !== false,
      allow_download: allow_download !== false,
      status: 'active',
      created_by_name: user.full_name,
      created_by_email: user.email,
    });

    return Response.json({
      success: true,
      portal,
      accessCode,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});