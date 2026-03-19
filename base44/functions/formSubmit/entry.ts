import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { formId, data, sourceUrl } = await req.json();

    if (!formId || !data) {
      return Response.json(
        { error: 'Form ID and data required' },
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Get form configuration
    const forms = await base44.asServiceRole.entities.ContactForm.filter({ id: formId });
    if (forms.length === 0) {
      return Response.json(
        { error: 'Form not found' },
        {
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const form = forms[0];
    if (!form.is_active) {
      return Response.json(
        { error: 'Form is not active' },
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Validate required fields
    for (const field of form.fields || []) {
      if (field.required && !data[field.id]) {
        return Response.json(
          { error: `${field.label} is required` },
          {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    }

    let contactId = null;
    let dealId = null;

    // Create contact if enabled
    if (form.create_contact) {
      const contactData = {
        first_name: data.first_name || data.name?.split(' ')[0] || 'Unknown',
        last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || '',
        email: data.email || '',
        phone: data.phone || '',
        source: 'contact_form',
        status: 'lead',
        tags: form.tags || [],
        notes: `Submitted via ${form.name} form.\n\nMessage: ${data.message || 'N/A'}`,
      };

      const contact = await base44.asServiceRole.entities.Contact.create(contactData);
      contactId = contact.id;
    }

    // Create deal/lead if enabled
    if (form.create_lead && contactId) {
      const dealData = {
        title: `Lead: ${data.name || data.email || 'New Lead'}`,
        contact_id: contactId,
        stage: 'lead',
        value: form.lead_value || 0,
        source: 'contact_form',
        notes: data.message || '',
      };

      const deal = await base44.asServiceRole.entities.Deal.create(dealData);
      dealId = deal.id;
    }

    // Save submission
    const submission = await base44.asServiceRole.entities.FormSubmission.create({
      form_id: formId,
      data,
      contact_id: contactId,
      deal_id: dealId,
      source_url: sourceUrl || '',
      status: 'new',
    });

    // Update form submission count
    await base44.asServiceRole.entities.ContactForm.update(formId, {
      submissions_count: (form.submissions_count || 0) + 1,
    });

    // Send notification email
    if (form.notification_email) {
      const fieldsHtml = Object.entries(data)
        .map(
          ([key, value]) =>
            `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${key}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${value}</td></tr>`
        )
        .join('');

      await resend.emails.send({
        from: 'CatchAll Forms <forms@resend.dev>',
        to: form.notification_email,
        subject: `New submission: ${form.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8b5cf6;">New Form Submission</h2>
            <p>You received a new submission from <strong>${form.name}</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              ${fieldsHtml}
            </table>
            <p style="color: #666; font-size: 12px;">Submitted from: ${sourceUrl || 'Unknown'}</p>
          </div>
        `,
      });
    }

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      type: 'alert',
      title: 'New Form Submission',
      message: `${data.name || data.email || 'Someone'} submitted ${form.name}`,
      priority: 'medium',
      link: 'ContactForms',
    });

    return Response.json(
      {
        success: true,
        message: form.success_message || 'Thank you for your submission!',
        submission_id: submission.id,
        contact_id: contactId,
        deal_id: dealId,
      },
      {
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    return Response.json(
      { error: error.message },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
