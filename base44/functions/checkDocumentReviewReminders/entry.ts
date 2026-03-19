import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const documents = await base44.asServiceRole.entities.TrackedDocument.list();

    let remindersSent = 0;
    const notifications = [];

    for (const doc of documents) {
      if (!doc.review_date || doc.review_reminder_sent) continue;

      const reviewDate = new Date(doc.review_date);
      reviewDate.setHours(0, 0, 0, 0);

      // Send reminder if review date is today or past
      if (reviewDate <= today) {
        const notification = {
          title: 'Document Review Due',
          message: `"${doc.name}" is scheduled for review today.`,
          type: 'document_review',
          document_id: doc.id,
          created_at: new Date().toISOString(),
        };

        await base44.asServiceRole.entities.Notification.create(notification);

        // Send email if configured
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `Document Review Reminder: ${doc.name}`,
            body: `
              <h2>Document Review Due</h2>
              <p>The document "${doc.name}" is scheduled for review.</p>
              <p><strong>Description:</strong> ${doc.description || 'N/A'}</p>
              <p><strong>Review Date:</strong> ${new Date(doc.review_date).toLocaleDateString()}</p>
              <p>Please log in to DocuTrace to review this document.</p>
            `,
          });
        } catch (err) {
          console.error('Failed to send email:', err);
        }

        await base44.asServiceRole.entities.TrackedDocument.update(doc.id, {
          review_reminder_sent: true,
        });

        remindersSent++;
        notifications.push(notification);
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      notifications,
    });
  } catch (error) {
    console.error('Review reminder check failed:', error);
    return Response.json(
      {
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
});
