import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import PptxGenJS from 'npm:pptxgenjs@3.12.0';

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

    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = user.full_name || 'CatchAll';
    pptx.company = deckData.company_name || '';
    pptx.subject = deckData.title || 'Pitch Deck';
    pptx.title = deckData.title || 'Pitch Deck';

    const primaryColor = branding.primary_color || '#7c3aed';
    const secondaryColor = branding.secondary_color || '#a78bfa';

    // Process each slide
    (deckData.slides || []).forEach((slide, index) => {
      const pptSlide = pptx.addSlide();

      // Add header bar
      pptSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.5,
        fill: { color: primaryColor },
      });

      // Add company name in header
      pptSlide.addText(deckData.company_name || '', {
        x: 0.3,
        y: 0.1,
        w: 5,
        h: 0.3,
        fontSize: 14,
        color: 'FFFFFF',
        bold: true,
      });

      // Add slide number
      pptSlide.addText(`${index + 1} / ${deckData.slides.length}`, {
        x: 8.5,
        y: 0.1,
        w: 1,
        h: 0.3,
        fontSize: 10,
        color: 'FFFFFF',
        align: 'right',
      });

      // Add slide title
      pptSlide.addText(slide.title || '', {
        x: 0.5,
        y: 1,
        w: 9,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: primaryColor.replace('#', ''),
      });

      // Content based on slide type
      if (slide.type === 'cover') {
        pptSlide.addText(slide.content?.company || '', {
          x: 1,
          y: 2.5,
          w: 8,
          h: 1,
          fontSize: 44,
          bold: true,
          color: primaryColor.replace('#', ''),
          align: 'center',
        });

        if (slide.content?.tagline) {
          pptSlide.addText(slide.content.tagline, {
            x: 1,
            y: 3.8,
            w: 8,
            h: 0.6,
            fontSize: 24,
            color: secondaryColor.replace('#', ''),
            align: 'center',
          });
        }
      } else if (slide.content?.points && Array.isArray(slide.content.points)) {
        const bulletPoints = slide.content.points
          .filter((p) => p)
          .map((point) => ({
            text: point,
            options: { bullet: true },
          }));

        pptSlide.addText(bulletPoints, {
          x: 1,
          y: 2.2,
          w: 8,
          h: 3,
          fontSize: 18,
          color: '333333',
        });
      } else if (slide.content?.description) {
        pptSlide.addText(slide.content.description, {
          x: 1,
          y: 2.2,
          w: 8,
          h: 3,
          fontSize: 16,
          color: '333333',
        });
      } else if (slide.content?.text) {
        pptSlide.addText(slide.content.text, {
          x: 1,
          y: 2.2,
          w: 8,
          h: 3,
          fontSize: 16,
          color: '333333',
        });
      }

      // Market size specifics
      if (slide.type === 'market' && slide.content?.tam) {
        const marketData = [
          { label: 'TAM', value: slide.content.tam },
          { label: 'SAM', value: slide.content.sam || 'N/A' },
          { label: 'SOM', value: slide.content.som || 'N/A' },
        ];

        marketData.forEach((item, i) => {
          pptSlide.addText(item.label, {
            x: 2 + i * 2.5,
            y: 2.5,
            w: 2,
            h: 0.4,
            fontSize: 14,
            bold: true,
            color: primaryColor.replace('#', ''),
          });

          pptSlide.addText(item.value, {
            x: 2 + i * 2.5,
            y: 3,
            w: 2,
            h: 0.6,
            fontSize: 24,
            bold: true,
            color: '333333',
          });
        });
      }

      // Add footer
      pptSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 5.1,
        w: '100%',
        h: 0.4,
        fill: { color: 'F5F5F5' },
      });

      pptSlide.addText(deckData.title || 'Pitch Deck', {
        x: 0.3,
        y: 5.2,
        w: 5,
        h: 0.2,
        fontSize: 10,
        color: '999999',
      });
    });

    const pptxData = await pptx.write({ outputType: 'arraybuffer' });

    return new Response(pptxData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${deckData.title || 'pitch-deck'}.pptx"`,
      },
    });
  } catch (error) {
    console.error('PPTX generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
