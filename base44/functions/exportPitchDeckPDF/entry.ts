import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deckId } = await req.json();

    const deck = await base44.entities.PitchDeck.filter({ id: deckId });
    if (!deck || deck.length === 0) {
      return Response.json({ error: 'Deck not found' }, { status: 404 });
    }

    const deckData = deck[0];
    const branding = deckData.branding || {};
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const primaryColor = branding.primary_color || '#7c3aed';
    const secondaryColor = branding.secondary_color || '#a78bfa';

    // Convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 124, g: 58, b: 237 };
    };

    const primaryRGB = hexToRgb(primaryColor);
    const secondaryRGB = hexToRgb(secondaryColor);

    // Process each slide
    (deckData.slides || []).forEach((slide, index) => {
      if (index > 0) doc.addPage();

      // Header with branding
      doc.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      doc.rect(0, 0, 297, 15, 'F');

      // Company name/logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(deckData.company_name || '', 10, 10);

      // Slide number
      doc.setFontSize(9);
      doc.text(`${index + 1} / ${deckData.slides.length}`, 270, 10);

      // Slide title
      doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      doc.setFontSize(24);
      doc.text(slide.title || '', 20, 35);

      // Content
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      let yPos = 50;

      if (slide.type === 'cover') {
        doc.setFontSize(32);
        doc.text(slide.content?.company || '', 20, 90);
        doc.setFontSize(18);
        doc.setTextColor(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b);
        doc.text(slide.content?.tagline || '', 20, 110);
      } else if (slide.content?.points && Array.isArray(slide.content.points)) {
        slide.content.points.forEach((point) => {
          if (point && yPos < 180) {
            const lines = doc.splitTextToSize(`• ${point}`, 250);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 7;
          }
        });
      } else if (slide.content?.description) {
        const lines = doc.splitTextToSize(slide.content.description, 250);
        doc.text(lines, 20, yPos);
      } else if (slide.content?.text) {
        const lines = doc.splitTextToSize(slide.content.text, 250);
        doc.text(lines, 20, yPos);
      }

      // Market size specifics
      if (slide.type === 'market' && slide.content?.tam) {
        doc.setFontSize(14);
        doc.text(`TAM: ${slide.content.tam}`, 30, 70);
        doc.text(`SAM: ${slide.content.sam || 'N/A'}`, 30, 85);
        doc.text(`SOM: ${slide.content.som || 'N/A'}`, 30, 100);
      }

      // Footer
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 195, 297, 15, 'F');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.text(deckData.title || 'Pitch Deck', 10, 203);
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${deckData.title || 'pitch-deck'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
