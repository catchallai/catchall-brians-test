import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active alerts for this user
    const alerts = await base44.entities.AerospaceAlert.filter({
      created_by: user.email,
      is_active: true,
    });

    // Get all aerospace companies
    const companies = await base44.entities.AerospaceCompany.list('-last_scanned', 200);

    const notifications = [];

    for (const alert of alerts) {
      const criteria = alert.criteria || {};
      const triggerEvents = alert.trigger_events || [];
      const monitoredCompanies = alert.monitored_companies || [];

      // Filter companies based on alert criteria and monitored list
      const relevantCompanies = companies.filter((company) => {
        // If specific companies are monitored, only check those
        if (monitoredCompanies.length > 0 && !monitoredCompanies.includes(company.id)) {
          return false;
        }

        // Apply criteria filters
        if (
          criteria.company_type &&
          criteria.company_type !== 'all' &&
          company.company_type !== criteria.company_type
        ) {
          return false;
        }

        if (criteria.revenue_growth_min) {
          const growth =
            parseFloat(company.financial_highlights?.revenue_growth?.replace(/[^0-9.-]/g, '')) || 0;
          if (growth < parseFloat(criteria.revenue_growth_min)) return false;
        }

        if (
          criteria.employee_count_min &&
          company.employee_count < parseInt(criteria.employee_count_min)
        ) {
          return false;
        }

        return true;
      });

      // Check each relevant company for trigger events
      for (const company of relevantCompanies) {
        const companyNotifications = [];

        // Check sentiment change
        if (triggerEvents.includes('sentiment_change') && company.news_sentiment) {
          const threshold = criteria.sentiment_change_threshold || 20;
          const sentimentScore = company.news_sentiment.sentiment_score || 0;
          const lastAnalyzed = company.news_sentiment.last_analyzed;

          // Check if sentiment changed significantly (this is simplified - in production you'd track historical data)
          if (Math.abs(sentimentScore - 50) > threshold) {
            companyNotifications.push({
              type: 'sentiment_change',
              title: `Sentiment Alert: ${company.company_name}`,
              message: `News sentiment is ${company.news_sentiment.overall_sentiment} (${sentimentScore}/100)`,
              company_id: company.id,
              company_name: company.company_name,
            });
          }
        }

        // Check for major contracts
        if (triggerEvents.includes('contract_win')) {
          const recentContracts = [
            ...(company.dod_contracts || []),
            ...(company.public_sector_contracts || []),
            ...(company.recent_contracts || []),
          ];

          const largeContracts = recentContracts.filter((contract) => {
            const value = parseFloat(contract.value?.replace(/[^0-9.-]/g, '')) || 0;
            const minValue = parseFloat(criteria.contract_value_min || 50);
            return value >= minValue;
          });

          if (largeContracts.length > 0) {
            const topContract = largeContracts[0];
            companyNotifications.push({
              type: 'contract_win',
              title: `Major Contract: ${company.company_name}`,
              message: `${topContract.title} - ${topContract.value}`,
              company_id: company.id,
              company_name: company.company_name,
            });
          }
        }

        // Check for funding rounds (private companies)
        if (triggerEvents.includes('funding_round') && company.company_type === 'private') {
          const fundingRounds = company.funding_rounds || [];
          if (fundingRounds.length > 0) {
            const latestRound = fundingRounds[0];
            companyNotifications.push({
              type: 'funding_round',
              title: `Funding Round: ${company.company_name}`,
              message: `${latestRound.round} - ${latestRound.amount} raised`,
              company_id: company.id,
              company_name: company.company_name,
            });
          }
        }

        // Check for negative PR/incidents
        if (triggerEvents.includes('negative_pr')) {
          const negativePR = company.negative_pr || [];
          const incidents = company.incidents || [];

          if (negativePR.length > 0 || incidents.length > 0) {
            const alert_text =
              negativePR.length > 0
                ? `${negativePR[0].title} (${negativePR[0].severity})`
                : `${incidents[0].title}`;

            companyNotifications.push({
              type: 'negative_pr',
              title: `Alert: ${company.company_name}`,
              message: alert_text,
              company_id: company.id,
              company_name: company.company_name,
            });
          }
        }

        // Check for keyword matches in news
        if (criteria.keywords && criteria.keywords.length > 0) {
          const keywords = criteria.keywords.map((k) => k.toLowerCase());
          const headlines = company.news_sentiment?.recent_headlines || [];

          const matchingHeadlines = headlines.filter((h) =>
            keywords.some(
              (kw) => h.title?.toLowerCase().includes(kw) || h.summary?.toLowerCase().includes(kw)
            )
          );

          if (matchingHeadlines.length > 0) {
            companyNotifications.push({
              type: 'keyword_match',
              title: `Keyword Match: ${company.company_name}`,
              message: matchingHeadlines[0].title,
              company_id: company.id,
              company_name: company.company_name,
            });
          }
        }

        // Check data update trigger
        if (triggerEvents.includes('data_update') && company.last_scanned) {
          const lastScanned = new Date(company.last_scanned);
          const hoursSinceUpdate = (Date.now() - lastScanned.getTime()) / (1000 * 60 * 60);

          // Only notify if updated in last 24 hours
          if (hoursSinceUpdate < 24) {
            companyNotifications.push({
              type: 'data_update',
              title: `Data Updated: ${company.company_name}`,
              message: `Company data refreshed ${Math.round(hoursSinceUpdate)} hours ago`,
              company_id: company.id,
              company_name: company.company_name,
            });
          }
        }

        // Add notifications for this company
        if (companyNotifications.length > 0) {
          notifications.push({
            alert_id: alert.id,
            alert_name: alert.name,
            company: company.company_name,
            notifications: companyNotifications,
            notification_channels: alert.notification_channels || ['in_app'],
          });

          // Update alert trigger count
          await base44.entities.AerospaceAlert.update(alert.id, {
            last_triggered: new Date().toISOString(),
            trigger_count: (alert.trigger_count || 0) + companyNotifications.length,
          });
        }
      }
    }

    // Send notifications
    for (const notification of notifications) {
      for (const notif of notification.notifications) {
        // Create in-app notification
        if (notification.notification_channels.includes('in_app')) {
          await base44.entities.Notification.create({
            user_id: user.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            link: `/AerospaceScanner?company=${notif.company_id}`,
            is_read: false,
          });
        }

        // Send email notification
        if (notification.notification_channels.includes('email')) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `${notif.title} - Aerospace Alert`,
            body: `
              <h2>${notif.title}</h2>
              <p><strong>Alert:</strong> ${notification.alert_name}</p>
              <p><strong>Company:</strong> ${notif.company_name}</p>
              <p><strong>Event:</strong> ${notif.type.replace(/_/g, ' ')}</p>
              <p>${notif.message}</p>
              <p><a href="https://app.base44.com/AerospaceScanner?company=${notif.company_id}">View Company Details</a></p>
            `,
          });
        }
      }
    }

    return Response.json({
      success: true,
      alerts_checked: alerts.length,
      notifications_sent: notifications.reduce((sum, n) => sum + n.notifications.length, 0),
      notifications,
    });
  } catch (error) {
    console.error('Error checking aerospace alerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
