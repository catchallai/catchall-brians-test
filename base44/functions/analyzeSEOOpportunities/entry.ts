import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { website_id } = await req.json();

    const website = await base44.asServiceRole.entities.Website.filter({ id: website_id });
    if (!website.length) return Response.json({ error: 'Website not found' }, { status: 404 });

    const keywords = await base44.asServiceRole.entities.Keyword.filter({ website_id });
    const competitors = await base44.asServiceRole.entities.Competitor.list();

    // Get keywords competitors rank for but we don't
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze keyword gaps for ${website[0].url}:
      
Our keywords (${keywords.length}): ${keywords
        .map((k) => k.keyword)
        .join(', ')
        .substring(0, 500)}

Top competitors: ${competitors
        .slice(0, 5)
        .map((c) => c.website)
        .join(', ')}

Find:
1. High-opportunity keywords (search_volume > 500, difficulty < 40)
2. Competitor gaps (keywords competitors rank for, we don't)
3. Trending keywords (emerging, growing)
4. Long-tail opportunities (3-5 word phrases)

For each, provide: keyword, search_volume, difficulty, opportunity_score (0-100), gap_type, recommended_action`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                search_volume: { type: 'number' },
                difficulty: { type: 'number' },
                opportunity_score: { type: 'number' },
                gap_type: { type: 'string' },
                recommended_action: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Save opportunities
    const createdOps = [];
    for (const opp of analysis.opportunities || []) {
      const existing = await base44.asServiceRole.entities.KeywordOpportunity.filter({
        website_id,
        keyword: opp.keyword,
      });

      if (!existing.length) {
        const created = await base44.asServiceRole.entities.KeywordOpportunity.create({
          website_id,
          keyword: opp.keyword,
          search_volume: opp.search_volume,
          difficulty: opp.difficulty,
          opportunity_score: opp.opportunity_score,
          gap_type: opp.gap_type,
          recommended_action: opp.recommended_action,
          competitor_count: competitors.length,
          estimated_traffic: Math.round((opp.search_volume * 0.03 * (100 - opp.difficulty)) / 100),
        });
        createdOps.push(created);
      }
    }

    return Response.json({
      success: true,
      opportunities_found: createdOps.length,
      data: createdOps,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
