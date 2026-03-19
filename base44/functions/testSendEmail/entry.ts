import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, templateId, campaignId } = await req.json();

    if (!to || !templateId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get template
    const templates = await base44.entities.EmailTemplate.filter({ id: templateId });
    const template = templates[0];

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get campaign if provided (for context)
    let campaign = null;
    if (campaignId) {
      const campaigns = await base44.entities.EmailCampaign.filter({ id: campaignId });
      campaign = campaigns[0];
    }

    // Get a sample contact for variable substitution
    const contacts = await base44.entities.Contact.list(null, 1);
    const sampleContact = contacts[0] || {
      first_name: 'John',
      last_name: 'Doe',
      email: to,
      company_name: user.full_name,
    };

    // Replace template variables
    let subject = template.subject;
    let body = template.body;

    const variables = {
      '{{first_name}}': sampleContact.first_name || 'there',
      '{{last_name}}': sampleContact.last_name || '',
      '{{email}}': sampleContact.email || '',
      '{{company_name}}': sampleContact.company_name || 'Our Company',
    };

    Object.entries(variables).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    });

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'test@resend.dev', // Use Resend sandbox for testing
        to: to,
        subject: `[TEST] ${subject}`,
        html: body,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend error:', error);
      return Response.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    const result = await emailResponse.json();
    return Response.json({
      success: true,
      messageId: result.id,
      message: `Test email sent successfully to ${to}`,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
