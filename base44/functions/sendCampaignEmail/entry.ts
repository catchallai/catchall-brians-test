import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await req.json();

    if (!campaignId) {
      return Response.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Get the campaign
    const campaigns = await base44.entities.EmailCampaign.filter({ id: campaignId });
    const campaign = campaigns[0];

    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get the template
    const templates = await base44.entities.EmailTemplate.filter({ id: campaign.template_id });
    const template = templates[0];

    if (!template) {
      return Response.json({ error: 'Email template not found' }, { status: 404 });
    }

    // Get recipients based on campaign criteria
    let recipients = [];
    if (campaign.recipient_list && campaign.recipient_list.length > 0) {
      // Use specific recipient list
      recipients = campaign.recipient_list;
    } else {
      // Get all contacts with emails
      const contacts = await base44.entities.Contact.filter({});
      recipients = contacts
        .filter((c) => c.email)
        .map((c) => ({
          email: c.email,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        }));
    }

    if (recipients.length === 0) {
      return Response.json({ error: 'No recipients found' }, { status: 400 });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        const recipientEmail = typeof recipient === 'string' ? recipient : recipient.email;
        const recipientName = typeof recipient === 'string' ? '' : recipient.name;

        // Replace placeholders in template
        let htmlContent = template.html_content || template.content || '';
        let subject = campaign.subject || template.subject || 'No Subject';

        // Simple placeholder replacement
        htmlContent = htmlContent
          .replace(/{{name}}/gi, recipientName)
          .replace(/{{email}}/gi, recipientEmail);
        subject = subject
          .replace(/{{name}}/gi, recipientName)
          .replace(/{{email}}/gi, recipientEmail);

        const emailResponse = await resend.emails.send({
          from: campaign.from_email || 'noreply@catchall.syberjet.com',
          to: recipientEmail,
          subject: subject,
          html: htmlContent,
        });

        if (!emailResponse.id) {
          throw new Error(emailResponse.error?.message || 'Failed to send email');
        }

        results.sent++;

        // Log the email
        await base44.asServiceRole.entities.EmailLog.create({
          campaign_id: campaignId,
          recipient_email: recipientEmail,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      } catch (emailError) {
        results.failed++;
        results.errors.push({
          recipient: typeof recipient === 'string' ? recipient : recipient.email,
          error: emailError.message,
        });

        // Log the failed email
        await base44.asServiceRole.entities.EmailLog.create({
          campaign_id: campaignId,
          recipient_email: typeof recipient === 'string' ? recipient : recipient.email,
          status: 'failed',
          error_message: emailError.message,
        });
      }
    }

    // Update campaign status
    await base44.asServiceRole.entities.EmailCampaign.update(campaignId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: results.sent,
      failed_count: results.failed,
    });

    return Response.json({
      success: true,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
