import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_name } = await req.json();

    if (!company_name) {
      return Response.json({ error: 'company_name is required' }, { status: 400 });
    }

    const prompt = `Find the official website for the company "${company_name}". Return only the website URL, nothing else. If you cannot find a definitive match, return null.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          website: {
            type: 'string',
          },
        },
      },
    });

    return Response.json({
      success: true,
      website: result.website,
    });
  } catch (error) {
    console.error('Error finding company website:', error);
    return Response.json(
      {
        error: 'Failed to find company website',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
