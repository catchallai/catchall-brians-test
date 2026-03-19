import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

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

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // SyberJet Brand Colors
    const primaryBlue = [0, 71, 171]; // #0047AB
    const darkGray = [45, 45, 45];
    const lightGray = [240, 240, 240];

    // Header with SyberJet branding
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SYBERJET', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AIRCRAFT CORPORATION', 20, 32);

    // Proposal Title
    doc.setTextColor(...darkGray);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(proposalData.title || 'Sales Proposal', 20, 55);

    // Date and Status
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.text(`Status: ${proposalData.status.toUpperCase()}`, 20, 72);
    if (proposalData.valid_until) {
      doc.text(`Valid Until: ${new Date(proposalData.valid_until).toLocaleDateString()}`, 20, 79);
    }

    // Client Information
    doc.setFillColor(...lightGray);
    doc.rect(20, 90, pageWidth - 40, 35, 'F');

    doc.setTextColor(...primaryBlue);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT INFORMATION', 25, 100);

    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${contactData.first_name} ${contactData.last_name}`, 25, 108);
    if (contactData.company) doc.text(contactData.company, 25, 115);
    if (contactData.email) doc.text(contactData.email, 25, 122);

    // Line Items
    let yPos = 140;
    doc.setTextColor(...primaryBlue);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPOSAL DETAILS', 20, yPos);

    yPos += 10;
    doc.setFillColor(...primaryBlue);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, yPos + 6);
    doc.text('Qty', pageWidth - 80, yPos + 6);
    doc.text('Unit Price', pageWidth - 60, yPos + 6);
    doc.text('Total', pageWidth - 35, yPos + 6);

    yPos += 12;
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');

    const lineItems = proposalData.line_items || [];
    for (const item of lineItems) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(item.name, 25, yPos);
      if (item.description) {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(item.description.substring(0, 60), 25, yPos + 4);
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
      }

      doc.text(item.quantity.toString(), pageWidth - 80, yPos);
      doc.text(`$${item.unit_price.toLocaleString()}`, pageWidth - 60, yPos);
      doc.text(`$${item.total.toLocaleString()}`, pageWidth - 35, yPos);

      yPos += item.description ? 12 : 8;
    }

    // Total
    yPos += 5;
    doc.setFillColor(...lightGray);
    doc.rect(pageWidth - 90, yPos, 70, 10, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryBlue);
    doc.text('TOTAL:', pageWidth - 85, yPos + 7);
    doc.text(`$${(proposalData.total_value || 0).toLocaleString()}`, pageWidth - 35, yPos + 7, {
      align: 'right',
    });

    // Terms and Notes
    yPos += 20;
    if (proposalData.terms) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBlue);
      doc.text('TERMS & CONDITIONS', 20, yPos);

      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      const termsLines = doc.splitTextToSize(proposalData.terms, pageWidth - 40);
      doc.text(termsLines, 20, yPos);
      yPos += termsLines.length * 4 + 10;
    }

    // Footer
    doc.setFillColor(...primaryBlue);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('SyberJet Aircraft Corporation | www.syberjet.com', pageWidth / 2, pageHeight - 12, {
      align: 'center',
    });
    doc.text(
      'This proposal is confidential and intended solely for the recipient.',
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${proposalData.title.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
