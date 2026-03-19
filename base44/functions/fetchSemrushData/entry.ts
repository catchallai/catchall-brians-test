import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, keywords } = await req.json();
    const apiKey = Deno.env.get('SEMRUSH_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'Semrush API key not configured' }, { status: 500 });
    }

    // Fetch domain overview
    const domainResponse = await fetch(
      `https://api.semrush.com/?type=domain_ranks&key=${apiKey}&export_columns=Or,Ot,Oc,Ad,At,Ac&domain=${domain}&database=us`
    );

    if (!domainResponse.ok) {
      return Response.json({ error: 'Semrush API error' }, { status: domainResponse.status });
    }

    const domainText = await domainResponse.text();
    const [header, ...rows] = domainText.trim().split('\n');
    const domainData = rows[0]?.split(';') || [];

    // Fetch keyword positions
    const keywordData = [];

    if (keywords && keywords.length > 0) {
      for (const keyword of keywords.slice(0, 10)) {
        // Limit to 10 keywords per call
        try {
          const kwResponse = await fetch(
            `https://api.semrush.com/?type=phrase_all&key=${apiKey}&export_columns=Ph,Po,Nq,Cp,Co,Nr,Td&phrase=${encodeURIComponent(keyword)}&database=us&display_limit=1`
          );

          if (kwResponse.ok) {
            const kwText = await kwResponse.text();
            const [kwHeader, ...kwRows] = kwText.trim().split('\n');
            const kwData = kwRows[0]?.split('\t') || [];

            if (kwData.length > 0) {
              keywordData.push({
                keyword: kwData[0] || keyword,
                position: parseInt(kwData[1]) || 0,
                search_volume: parseInt(kwData[2]) || 0,
                cpc: parseFloat(kwData[3]) || 0,
                competition: parseFloat(kwData[4]) || 0,
                results: parseInt(kwData[5]) || 0,
                difficulty: parseFloat(kwData[6]) || 0,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching keyword ${keyword}:`, error);
        }
      }
    }

    // Fetch backlinks overview
    const backlinksResponse = await fetch(
      `https://api.semrush.com/?type=backlinks_overview&key=${apiKey}&target=${domain}&target_type=root_domain&export_columns=ascore,total,domains_num,urls_num,ips_num,ipclassc_num,follows_num,nofollows_num,sponsored_num,ugc_num,texts_num,forms_num,frames_num`
    );

    let backlinksData = {};
    if (backlinksResponse.ok) {
      const backlinksText = await backlinksResponse.text();
      const [blHeader, ...blRows] = backlinksText.trim().split('\n');
      const blData = blRows[0]?.split('\t') || [];

      backlinksData = {
        authority_score: parseInt(blData[0]) || 0,
        total_backlinks: parseInt(blData[1]) || 0,
        referring_domains: parseInt(blData[2]) || 0,
        referring_ips: parseInt(blData[4]) || 0,
        dofollow: parseInt(blData[6]) || 0,
        nofollow: parseInt(blData[7]) || 0,
      };
    }

    return Response.json({
      domain_metrics: {
        organic_keywords: parseInt(domainData[0]) || 0,
        organic_traffic: parseInt(domainData[1]) || 0,
        organic_cost: parseInt(domainData[2]) || 0,
        adwords_keywords: parseInt(domainData[3]) || 0,
        adwords_traffic: parseInt(domainData[4]) || 0,
        adwords_cost: parseInt(domainData[5]) || 0,
      },
      keywords: keywordData,
      backlinks: backlinksData,
    });
  } catch (error) {
    console.error('Semrush fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
