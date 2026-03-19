import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, sendEmail, recipients } = await req.json();

    // Get report data
    const reports = await base44.entities.SEOReport.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get website data
    let website = null;
    if (report.website_id) {
      const websites = await base44.entities.Website.filter({ id: report.website_id });
      website = websites[0];
    }

    // Create PDF
    const doc = new jsPDF();
    const reportData = report.report_data || {};

    // Header
    doc.setFontSize(24);
    doc.setTextColor(88, 28, 135); // violet-800
    doc.text(report.name || 'SEO Report', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    if (website) {
      doc.text(`Website: ${website.name} (${website.url})`, 20, 42);
    }

    // Divider line
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 48, 190, 48);

    let y = 58;

    // Summary section
    if (reportData.summary) {
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Summary', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const summaryLines = doc.splitTextToSize(reportData.summary, 170);
      doc.text(summaryLines, 20, y);
      y += summaryLines.length * 5 + 10;
    }

    // Score
    if (reportData.score) {
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(`Overall Score: ${reportData.score}/100`, 20, y);
      y += 12;
    }

    // Traffic Insights
    if (reportData.traffic_insights) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Traffic Insights', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(reportData.traffic_insights, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    }

    // Keyword Performance
    if (reportData.keyword_performance) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Keyword Performance', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(reportData.keyword_performance, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    }

    // Backlink Summary
    if (reportData.backlink_summary) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Backlink Summary', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(reportData.backlink_summary, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    }

    // Technical Health
    if (reportData.technical_health) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Technical Health', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(reportData.technical_health, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    }

    // Recommendations
    if (reportData.recommendations?.length > 0) {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Recommendations', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      reportData.recommendations.forEach((rec, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 165);
        doc.text(lines, 25, y);
        y += lines.length * 5 + 3;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    // Send email if requested
    if (sendEmail && recipients?.length > 0) {
      for (const email of recipients) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `SEO Report: ${report.name}`,
          body: `
            <h2>${report.name}</h2>
            <p>Please find attached the latest SEO report for ${website?.name || 'your website'}.</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            ${reportData.summary ? `<h3>Summary</h3><p>${reportData.summary}</p>` : ''}
            ${reportData.score ? `<p><strong>Overall Score:</strong> ${reportData.score}/100</p>` : ''}
            <p>View the full report in your CatchAll dashboard.</p>
          `,
        });
      }
    }

    // Return PDF for download
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.name || 'report'}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
