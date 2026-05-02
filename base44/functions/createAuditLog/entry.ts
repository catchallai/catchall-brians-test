import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Creates immutable audit log entries with tamper-detection via hash chain
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      event_type,
      resource_type,
      resource_id,
      action,
      details = {},
      severity = 'medium',
      changes = null,
    } = body;

    if (!event_type || !resource_type || !action) {
      return Response.json(
        { error: 'Missing required fields: event_type, resource_type, action' },
        { status: 400 }
      );
    }

    // Get last audit entry to chain hash
    const lastEntries = await base44.asServiceRole.entities.AuditLog.list(
      '-created_date',
      1
    );
    const lastEntry = lastEntries[0];

    // Create hash chain for tamper detection
    const hashInput = JSON.stringify({
      prev_hash: lastEntry?.hash || 'genesis',
      timestamp: new Date().toISOString(),
      event_type,
      resource_type,
      resource_id,
      action,
      actor_email: user.email,
    });

    // Simple hash for tamper detection (SHA-256 via Web Crypto)
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Get client IP from headers
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';

    // Create audit log entry
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      event_type,
      actor_email: user.email,
      actor_id: user.id,
      actor_ip: ip,
      actor_user_agent: req.headers.get('user-agent') || 'unknown',
      resource_type,
      resource_id,
      action,
      status: 'success',
      details,
      changes,
      severity,
      timestamp: new Date().toISOString(),
      hash,
      tamper_detected: false,
    });

    return Response.json({
      success: true,
      id: auditLog.id,
      hash,
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});