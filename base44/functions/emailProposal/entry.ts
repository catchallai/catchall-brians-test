import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposalId } = await req.json();

    const proposal = await base44.entities.Proposal.filter({ id: proposalId });
    if (!proposal.length) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposalData = proposal[0];
    const contact = await base44.entities.Contact.filter({ id: proposalData.contact_id });
    const contactData = contact[0];

    if (!contactData?.email) {
      return Response.json({ error: 'Contact email not found' }, { status: 400 });
    }

    // Generate PDF first
    const pdfResponse = await base44.functions.invoke('generateProposalPdf', { proposalId });

    // Create a download link (in production, you'd upload this to storage)
    const proposalLink = `${Deno.env.get('BASE_URL') || 'https://app.base44.com'}/proposals/${proposalId}`;

    await base44.integrations.Core.SendEmail({
      to: contactData.email,
      subject: `Proposal: ${proposalData.title}`,
      body: `Dear ${contactData.first_name} ${contactData.last_name},

Please find attached your proposal from SyberJet Aircraft Corporation.

PROPOSAL DETAILS:
Title: ${proposalData.title}
Total Value: $${(proposalData.total_value || 0).toLocaleString()}
Valid Until: ${proposalData.valid_until ? new Date(proposalData.valid_until).toLocaleDateString() : 'N/A'}

${proposalData.terms ? `\n\nTERMS & CONDITIONS:\n${proposalData.terms}` : ''}

If you have any questions or would like to discuss this proposal, please don't hesitate to reach out.

Best regards,
${user.full_name}
SyberJet Aircraft Corporation

---
This is an automated email from SyberJet's CRM system.`,
    });

    // Update proposal status
    await base44.entities.Proposal.update(proposalId, {
      status: 'sent',
      sent_date: new Date().toISOString(),
    });

    return Response.json({ success: true, message: 'Proposal sent successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
