import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { website_id } = await req.json();

    const website = await base44.asServiceRole.entities.Website.filter({ id: website_id });
    if (!website.length) return Response.json({ error: 'Website not found' }, { status: 404 });

    const backlinks = await base44.asServiceRole.entities.Backlink.filter({ website_id });

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Find backlink opportunities for ${website[0].url}:
      
Current backlinks (${backlinks.length}): ${backlinks
        .slice(0, 5)
        .map((b) => b.source_domain)
        .join(', ')}

Identify:
1. Broken links on competitor sites (where we can replace with our content)
2. Competitor backlinks (high DA sources linking to competitors)
3. Industry directories and resource pages
4. Guest post opportunities (relevant blogs)

For each opportunity: source_domain, source_url, opportunity_type, domain_authority, relevance_score (0-100), difficulty_score (0-100), contact_email`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source_domain: { type: 'string' },
                source_url: { type: 'string' },
                opportunity_type: { type: 'string' },
                domain_authority: { type: 'number' },
                relevance_score: { type: 'number' },
                difficulty_score: { type: 'number' },
                contact_email: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Save opportunities
    const createdOpps = [];
    for (const opp of analysis.opportunities || []) {
      const created = await base44.asServiceRole.entities.BacklinkOpportunity.create({
        website_id,
        source_domain: opp.source_domain,
        source_url: opp.source_url,
        opportunity_type: opp.opportunity_type,
        domain_authority: opp.domain_authority,
        relevance_score: opp.relevance_score,
        difficulty_score: opp.difficulty_score,
        contact_email: opp.contact_email,
      });
      createdOpps.push(created);
    }

    return Response.json({
      success: true,
      opportunities_found: createdOpps.length,
      data: createdOpps,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
