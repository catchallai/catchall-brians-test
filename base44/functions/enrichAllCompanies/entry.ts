import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all companies
    const companies = await base44.entities.Company.list();

    if (!companies || companies.length === 0) {
      return Response.json({ message: 'No companies to enrich', count: 0 });
    }

    let enrichedCount = 0;
    const results = [];

    for (const company of companies) {
      // Skip if already enriched recently
      if (company.ai_enriched && company.ai_enriched_date) {
        const enrichDate = new Date(company.ai_enriched_date);
        const daysSinceEnrich = (Date.now() - enrichDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEnrich < 30) {
          continue;
        }
      }

      try {
        const enrichmentPrompt = `Based on the company "${company.name}" in the ${company.industry || 'unknown'} industry, provide a detailed JSON response with the following information:
- description: A 2-3 sentence company overview
- industry_trends: List 3 current trends affecting this industry
- key_competitors: List 3-5 main competitors

Focus on factual, current information.`;

        const enrichmentData = await base44.integrations.Core.InvokeLLM({
          prompt: enrichmentPrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              industry_trends: { type: 'array', items: { type: 'string' } },
              key_competitors: { type: 'array', items: { type: 'string' } },
            },
          },
        });

        if (enrichmentData) {
          // Update company with enriched data
          await base44.entities.Company.update(company.id, {
            description: enrichmentData.description || company.description,
            industry_trends: enrichmentData.industry_trends || company.industry_trends || [],
            key_competitors: enrichmentData.key_competitors || company.key_competitors || [],
            ai_enriched: true,
            ai_enriched_date: new Date().toISOString(),
          });

          enrichedCount++;
          results.push({ id: company.id, name: company.name, status: 'enriched' });
        }
      } catch (error) {
        results.push({
          id: company.id,
          name: company.name,
          status: 'failed',
          error: error.message,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return Response.json({
      message: 'Company enrichment complete',
      total: companies.length,
      enriched: enrichedCount,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
