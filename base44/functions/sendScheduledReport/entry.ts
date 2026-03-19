import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { reportId, recipients } = await req.json();

    if (!reportId) {
      return Response.json({ error: 'Report ID required' }, { status: 400 });
    }

    // Get report data
    const reports = await base44.asServiceRole.entities.SEOReport.filter({ id: reportId });
    if (reports.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];
    const emailRecipients = recipients || report.recipients || [];

    if (emailRecipients.length === 0) {
      return Response.json({ error: 'No recipients specified' }, { status: 400 });
    }

    // Get website info
    let websiteName = 'Website';
    if (report.website_id) {
      const websites = await base44.asServiceRole.entities.Website.filter({
        id: report.website_id,
      });
      if (websites.length > 0) {
        websiteName = websites[0].name;
      }
    }

    const reportData = report.report_data || {};
    const generatedAt = reportData.generated_at
      ? new Date(reportData.generated_at).toLocaleDateString()
      : new Date().toLocaleDateString();

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .metric { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
    .metric-label { font-size: 12px; color: #6b7280; }
    .keywords { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .keyword-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .recommendation { background: #ecfdf5; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #10b981; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${report.name}</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">${websiteName} • Generated ${generatedAt}</p>
    </div>
    <div class="content">
      <h2>Performance Overview</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div class="metric">
          <div class="metric-value">${reportData.seo_score || 'N/A'}</div>
          <div class="metric-label">SEO Score ${reportData.seo_score_change ? `(${reportData.seo_score_change > 0 ? '+' : ''}${reportData.seo_score_change}%)` : ''}</div>
        </div>
        <div class="metric">
          <div class="metric-value">${reportData.organic_traffic?.toLocaleString() || 'N/A'}</div>
          <div class="metric-label">Organic Traffic ${reportData.traffic_change ? `(${reportData.traffic_change > 0 ? '+' : ''}${reportData.traffic_change}%)` : ''}</div>
        </div>
        <div class="metric">
          <div class="metric-value">${reportData.total_keywords || 'N/A'}</div>
          <div class="metric-label">Total Keywords (${reportData.top_10_keywords || 0} in Top 10)</div>
        </div>
        <div class="metric">
          <div class="metric-value">${reportData.total_backlinks || 'N/A'}</div>
          <div class="metric-label">Total Backlinks ${reportData.backlinks_change ? `(${reportData.backlinks_change > 0 ? '+' : ''}${reportData.backlinks_change}%)` : ''}</div>
        </div>
      </div>

      ${
        reportData.top_keywords?.length > 0
          ? `
      <h2>Top Keywords</h2>
      <div class="keywords">
        ${reportData.top_keywords
          .slice(0, 5)
          .map(
            (k) => `
          <div class="keyword-item">
            <span>${k.keyword}</span>
            <span><strong>#${k.position}</strong> (${k.search_volume?.toLocaleString() || 0} vol)</span>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        reportData.trends_summary
          ? `
      <h2>Trends & Insights</h2>
      <p>${reportData.trends_summary}</p>
      `
          : ''
      }

      ${
        reportData.recommendations?.length > 0
          ? `
      <h2>Recommendations</h2>
      ${reportData.recommendations
        .slice(0, 5)
        .map(
          (r) => `
        <div class="recommendation">${r}</div>
      `
        )
        .join('')}
      `
          : ''
      }
    </div>
    <div class="footer">
      <p>Sent by CatchAll SEO Platform</p>
      <p>To manage your report subscriptions, visit your dashboard.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to each recipient
    const results = [];
    for (const email of emailRecipients) {
      const result = await resend.emails.send({
        from: 'CatchAll Reports <reports@resend.dev>',
        to: email,
        subject: `📊 ${report.name} - ${websiteName}`,
        html: emailHtml,
      });
      results.push({ email, result });
    }

    // Update report last sent
    await base44.asServiceRole.entities.SEOReport.update(reportId, {
      last_run: new Date().toISOString(),
    });

    // Track API usage
    const today = new Date().toISOString().split('T')[0];
    await base44.asServiceRole.entities.APIUsage.create({
      date: today,
      endpoint: 'SendEmail',
      calls_count: emailRecipients.length,
      cost_estimate: emailRecipients.length * 0.001, // Example cost
    });

    return Response.json({
      success: true,
      sent: results.length,
      recipients: emailRecipients,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
