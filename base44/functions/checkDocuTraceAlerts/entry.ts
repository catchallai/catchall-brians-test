import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate user (admin only for scheduled task)
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all active alerts
    const alerts = await base44.asServiceRole.entities.DocuTraceAlert.filter({
      is_active: true,
    });

    // Fetch all documents
    const documents = await base44.asServiceRole.entities.TrackedDocument.list();

    // Fetch all deals for high-value filtering
    const deals = await base44.asServiceRole.entities.Deal.list();

    const notifications = [];
    let alertsChecked = 0;
    let notificationsSent = 0;

    for (const alert of alerts) {
      alertsChecked++;

      // Filter documents based on alert specificity
      const relevantDocs = alert.document_id
        ? documents.filter((d) => d.id === alert.document_id)
        : documents;

      for (const doc of relevantDocs) {
        let shouldTrigger = false;
        let notificationMessage = '';

        // Check trigger conditions
        switch (alert.trigger_type) {
          case 'specific_contact_view':
            // Check if specific contact viewed the document
            const contactEmails = alert.trigger_config?.contact_emails || [];
            const hasContactView = (doc.access_logs || []).some(
              (log) => contactEmails.includes(log.email) && log.action === 'view'
            );
            if (hasContactView) {
              shouldTrigger = true;
              notificationMessage = `Document "${doc.name}" was viewed by a key contact`;
            }
            break;

          case 'view_threshold':
            const viewThreshold = alert.trigger_config?.view_threshold || 10;
            if ((doc.total_views || 0) >= viewThreshold) {
              shouldTrigger = true;
              notificationMessage = `Document "${doc.name}" has reached ${doc.total_views} views (threshold: ${viewThreshold})`;
            }
            break;

          case 'download_threshold':
            const downloadThreshold = alert.trigger_config?.download_threshold || 5;
            if ((doc.total_downloads || 0) >= downloadThreshold) {
              shouldTrigger = true;
              notificationMessage = `Document "${doc.name}" has reached ${doc.total_downloads} downloads (threshold: ${downloadThreshold})`;
            }
            break;

          case 'expiration_warning':
            if (doc.expires_at) {
              const daysBeforeExpiration = alert.trigger_config?.days_before_expiration || 7;
              const expirationDate = new Date(doc.expires_at);
              const daysUntilExpiration = Math.ceil(
                (expirationDate - new Date()) / (1000 * 60 * 60 * 24)
              );

              if (daysUntilExpiration <= daysBeforeExpiration && daysUntilExpiration > 0) {
                shouldTrigger = true;
                notificationMessage = `Document "${doc.name}" expires in ${daysUntilExpiration} days`;
              }
            }
            break;

          case 'high_value_deal_view':
            if (doc.deal_id) {
              const deal = deals.find((d) => d.id === doc.deal_id);
              const dealValueThreshold = alert.trigger_config?.deal_value_threshold || 50000;

              if (deal && deal.value >= dealValueThreshold && (doc.total_views || 0) > 0) {
                shouldTrigger = true;
                notificationMessage = `High-value deal document "${doc.name}" (Deal: ${deal.title}, $${deal.value.toLocaleString()}) has been viewed`;
              }
            }
            break;
        }

        if (shouldTrigger) {
          const notification = {
            alert_id: alert.id,
            alert_name: alert.name,
            document_id: doc.id,
            document_name: doc.name,
            message: notificationMessage,
            timestamp: new Date().toISOString(),
          };

          // Send notifications based on channels
          for (const channel of alert.notification_channels) {
            if (channel === 'email') {
              // Send email notification
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: `DocuTrace Alert: ${alert.name}`,
                body: `
                  <h2>Document Alert Triggered</h2>
                  <p><strong>Alert:</strong> ${alert.name}</p>
                  <p><strong>Document:</strong> ${doc.name}</p>
                  <p><strong>Message:</strong> ${notificationMessage}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  <br>
                  <p>View document details in DocuTrace.</p>
                `,
              });
            }

            if (channel === 'in_app') {
              // Create in-app notification
              await base44.asServiceRole.entities.Notification.create({
                title: alert.name,
                message: notificationMessage,
                type: 'docutrace_alert',
                priority: 'high',
                link: `/DocuTrace`,
                metadata: {
                  alert_id: alert.id,
                  document_id: doc.id,
                },
              });
            }
          }

          notifications.push(notification);
          notificationsSent++;

          // Update alert trigger stats
          await base44.asServiceRole.entities.DocuTraceAlert.update(alert.id, {
            last_triggered: new Date().toISOString(),
            trigger_count: (alert.trigger_count || 0) + 1,
          });
        }
      }
    }

    return Response.json({
      success: true,
      alerts_checked: alertsChecked,
      notifications_sent: notificationsSent,
      notifications,
    });
  } catch (error) {
    console.error('Alert check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
