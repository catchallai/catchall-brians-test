import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { social_account_id } = await req.json();

    const account = await base44.asServiceRole.entities.SocialAccount.filter({
      id: social_account_id,
    });
    if (!account.length) return Response.json({ error: 'Account not found' }, { status: 404 });

    const posts = await base44.asServiceRole.entities.SocialPost.filter({ social_account_id });

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze audience for @${account[0].account_name} on ${account[0].platform}:

Followers: ${account[0].followers_count}
Posts analyzed: ${posts.length}
Topics: ${posts
        .slice(0, 10)
        .map((p) => p.topics?.join(', '))
        .filter(Boolean)
        .join('; ')}

Provide:
1. Demographics: age_groups (%), gender (%), top 5 countries
2. Top 5 interests
3. Audience behaviors and traits
4. Recommended segment name`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          demographics: {
            type: 'object',
            properties: {
              age_groups: { type: 'object' },
              gender: { type: 'object' },
              top_countries: { type: 'array', items: { type: 'string' } },
            },
          },
          interests: { type: 'array', items: { type: 'string' } },
          behaviors: { type: 'array', items: { type: 'string' } },
          segment_name: { type: 'string' },
        },
      },
    });

    const audienceData = await base44.asServiceRole.entities.SocialAudience.create({
      social_account_id,
      platform: account[0].platform,
      total_followers: account[0].followers_count,
      follower_growth_rate: 5,
      demographics: analysis.demographics,
      interests: analysis.interests,
      behaviors: analysis.behaviors,
      segment_name: analysis.segment_name,
    });

    return Response.json({
      success: true,
      data: audienceData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
