import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, company_name, website } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id is required' }, { status: 400 });
    }

    // Fetch company data with AI
    const prompt = `Research the company "${company_name}" (${website || 'website not provided'}) and provide:
    
1. Industry Trends (3-5 current trends affecting this company)
2. Recent News (3-5 most recent significant news articles with title, brief summary, and approximate date)
3. Funding Rounds (if available, list recent funding rounds with type, amount, date, and key investors)
4. Key Competitors (5-7 main competitors)
5. Related Companies (subsidiaries, parent companies, key partners)

Format your response as JSON with this structure:
{
  "industry_trends": ["trend1", "trend2", ...],
  "recent_news": [{"title": "...", "summary": "...", "date": "...", "url": "..."}],
  "funding_rounds": [{"round_type": "...", "amount": 0, "date": "...", "investors": [...]}],
  "key_competitors": ["competitor1", "competitor2", ...],
  "related_companies": ["company1", "company2", ...]
}

Be concise and factual. If information is not available, return empty arrays.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          industry_trends: {
            type: 'array',
            items: { type: 'string' },
          },
          recent_news: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                date: { type: 'string' },
                url: { type: 'string' },
              },
            },
          },
          funding_rounds: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                round_type: { type: 'string' },
                amount: { type: 'number' },
                date: { type: 'string' },
                investors: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
          key_competitors: {
            type: 'array',
            items: { type: 'string' },
          },
          related_companies: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    });

    // Find or create related companies
    const relatedCompanyIds = [];
    if (result.related_companies && result.related_companies.length > 0) {
      for (const relatedName of result.related_companies.slice(0, 5)) {
        try {
          // Check if company already exists
          const existing = await base44.asServiceRole.entities.Company.filter({
            name: relatedName,
          });

          if (existing.length > 0) {
            relatedCompanyIds.push(existing[0].id);
          } else {
            // Create placeholder company
            const newCompany = await base44.asServiceRole.entities.Company.create({
              name: relatedName,
              description: `Related to ${company_name}`,
            });
            relatedCompanyIds.push(newCompany.id);
          }
        } catch (err) {
          console.log(`Failed to process related company: ${relatedName}`);
        }
      }
    }

    // Update company with enriched data
    await base44.asServiceRole.entities.Company.update(company_id, {
      industry_trends: result.industry_trends || [],
      recent_news: result.recent_news || [],
      funding_rounds: result.funding_rounds || [],
      key_competitors: result.key_competitors || [],
      related_company_ids: relatedCompanyIds,
      ai_enriched: true,
      ai_enriched_date: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      data: {
        ...result,
        related_company_ids: relatedCompanyIds,
      },
    });
  } catch (error) {
    console.error('Error enriching company:', error);
    return Response.json(
      {
        error: 'Failed to enrich company data',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
