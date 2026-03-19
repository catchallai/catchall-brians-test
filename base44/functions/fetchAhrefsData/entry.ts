import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, target_url } = await req.json();
    const apiKey = Deno.env.get('AHREFS_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'Ahrefs API key not configured' }, { status: 500 });
    }

    const targetDomain = target_url || domain;

    // Fetch domain metrics
    const metricsResponse = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/metrics-extended?target=${encodeURIComponent(targetDomain)}&protocol=https`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      }
    );

    if (!metricsResponse.ok) {
      return Response.json({ error: 'Ahrefs API error' }, { status: metricsResponse.status });
    }

    const metrics = await metricsResponse.json();

    // Fetch backlinks
    const backlinksResponse = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/backlinks?target=${encodeURIComponent(targetDomain)}&protocol=https&limit=100&order_by=domain_rating:desc`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      }
    );

    let backlinks = [];
    if (backlinksResponse.ok) {
      const backlinksData = await backlinksResponse.json();
      backlinks = (backlinksData.backlinks || []).map((bl) => ({
        source_url: bl.url_from,
        source_domain: bl.domain_from,
        target_url: bl.url_to,
        anchor_text: bl.anchor,
        domain_rating: bl.domain_rating,
        url_rating: bl.url_rating,
        is_dofollow: bl.is_dofollow,
        first_seen: bl.first_seen,
        last_seen: bl.last_seen,
        link_type: bl.is_dofollow ? 'dofollow' : 'nofollow',
      }));
    }

    // Fetch organic keywords
    const keywordsResponse = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/organic-keywords?target=${encodeURIComponent(targetDomain)}&protocol=https&limit=100&order_by=position:asc`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      }
    );

    let keywords = [];
    if (keywordsResponse.ok) {
      const keywordsData = await keywordsResponse.json();
      keywords = (keywordsData.keywords || []).map((kw) => ({
        keyword: kw.keyword,
        position: kw.position,
        search_volume: kw.volume,
        keyword_difficulty: kw.difficulty,
        cpc: kw.cpc,
        traffic: kw.traffic,
        target_url: kw.url,
      }));
    }

    return Response.json({
      domain_metrics: {
        domain_rating: metrics.domain_rating || 0,
        url_rating: metrics.url_rating || 0,
        backlinks: metrics.backlinks || 0,
        referring_domains: metrics.refdomains || 0,
        organic_traffic: metrics.organic_traffic || 0,
        organic_keywords: metrics.organic_keywords || 0,
        organic_value: metrics.organic_value || 0,
      },
      backlinks: backlinks,
      keywords: keywords,
    });
  } catch (error) {
    console.error('Ahrefs fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
