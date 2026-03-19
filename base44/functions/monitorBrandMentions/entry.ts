import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { brand_name } = await req.json();

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Find recent mentions of "${brand_name}" online (last 7 days):
      
Search across:
- Twitter/X
- Reddit
- News sites
- Blogs
- Forums

For each mention: mention_text, source, source_url, author, sentiment (positive/neutral/negative), reach, mentions_competitor (true/false)

Include at least 10 mentions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          mentions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mention_text: { type: 'string' },
                source: { type: 'string' },
                source_url: { type: 'string' },
                author: { type: 'string' },
                sentiment: { type: 'string' },
                reach: { type: 'number' },
                mentions_competitor: { type: 'boolean' },
              },
            },
          },
        },
      },
    });

    // Save mentions
    const createdMentions = [];
    const negativeMentions = [];

    for (const mention of analysis.mentions || []) {
      const created = await base44.asServiceRole.entities.SocialMention.create({
        brand_name,
        mention_text: mention.mention_text,
        source: mention.source,
        source_url: mention.source_url,
        author: mention.author,
        sentiment: mention.sentiment,
        reach: mention.reach,
        mentions_competitor: mention.mentions_competitor,
        is_alert: mention.sentiment === 'negative' || mention.mentions_competitor,
      });
      createdMentions.push(created);

      if (mention.sentiment === 'negative') {
        negativeMentions.push(created);
      }
    }

    return Response.json({
      success: true,
      total_mentions: createdMentions.length,
      negative_mentions: negativeMentions.length,
      data: createdMentions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
