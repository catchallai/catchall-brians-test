import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { website_id } = await req.json();

    const website = await base44.asServiceRole.entities.Website.filter({ id: website_id });
    if (!website.length) return Response.json({ error: 'Website not found' }, { status: 404 });

    const seoChecks = await base44.asServiceRole.entities.SEOCheck.filter({ website_id });
    const keywords = await base44.asServiceRole.entities.Keyword.filter({ website_id });
    const backlinks = await base44.asServiceRole.entities.Backlink.filter({ website_id });

    const failures = seoChecks.filter((c) => c.status === 'fail');
    const warnings = seoChecks.filter((c) => c.status === 'warning');

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate weekly SEO action items for ${website[0].url}:
      
Site Score: ${website[0].seo_score || 0}/100
Keywords: ${keywords.length}
Backlinks: ${backlinks.length}
Technical Issues: ${failures.length}
Warnings: ${warnings.length}

Top Issues: ${failures
        .slice(0, 5)
        .map((f) => f.check_name)
        .join(', ')}

Prioritize by:
1. Traffic impact (estimated % improvement)
2. Implementation effort
3. Competitive advantage

For each action: title, description, category, priority, estimated_impact, estimated_effort, why_important`,
      response_json_schema: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                priority: { type: 'string' },
                estimated_impact: { type: 'string' },
                estimated_effort: { type: 'string' },
                why_important: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Delete old action items
    const oldItems = await base44.asServiceRole.entities.SEOActionItem.filter({ website_id });
    for (const item of oldItems) {
      await base44.asServiceRole.entities.SEOActionItem.delete(item.id);
    }

    // Create new action items
    const createdActions = [];
    for (const action of analysis.actions || []) {
      const created = await base44.asServiceRole.entities.SEOActionItem.create({
        website_id,
        title: action.title,
        description: `${action.description}\n\n${action.why_important}`,
        category: action.category,
        priority: action.priority,
        estimated_impact: action.estimated_impact,
        estimated_effort: action.estimated_effort,
      });
      createdActions.push(created);
    }

    return Response.json({
      success: true,
      actions_generated: createdActions.length,
      data: createdActions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
