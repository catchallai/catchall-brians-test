import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REPO = 'briangibbs7/catchall-brians';
const BASE_URL = `https://api.github.com/repos/${REPO}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${accessToken}`,
    };

    let url;
    if (type === 'pulls') {
      url = `${BASE_URL}/pulls?state=open&per_page=30`;
    } else if (type === 'issues') {
      url = `${BASE_URL}/issues?state=open&per_page=30`;
    } else if (type === 'commits') {
      url = `${BASE_URL}/commits?per_page=30`;
    } else if (type === 'repo') {
      url = BASE_URL;
    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});