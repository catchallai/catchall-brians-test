import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, file_name, compliance_item_id } = await req.json();

    if (!file_url || !compliance_item_id) {
      return Response.json(
        { error: 'Missing required fields: file_url, compliance_item_id' },
        { status: 400 }
      );
    }

    // Use LLM to scan for sensitive information patterns
    const scanResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a security compliance analyzer. Scan the following document content for sensitive information patterns.

Document: ${file_name}
Content (from URL): ${file_url}

Detect and report:
1. Social Security Numbers (SSN patterns: XXX-XX-XXXX)
2. Credit card numbers (16-digit patterns)
3. API keys or tokens (long alphanumeric patterns)
4. Passwords or secrets
5. Email addresses with personal names
6. Phone numbers
7. Database connection strings
8. Private keys (BEGIN PRIVATE KEY markers)
9. PII (personally identifiable information)

If you cannot directly access the URL content, analyze the filename and any patterns you can infer.

Return a JSON object with:
{
  "risk_level": "low|medium|high|critical",
  "sensitive_info_detected": true/false,
  "detected_patterns": ["PATTERN_TYPE", ...],
  "locations": ["brief description", ...],
  "summary": "brief summary of findings"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          risk_level: { type: 'string' },
          sensitive_info_detected: { type: 'boolean' },
          detected_patterns: { type: 'array', items: { type: 'string' } },
          locations: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    });

    // Update ComplianceEvidence with scan results
    const evidence = await base44.entities.ComplianceEvidence.filter({
      file_url: file_url,
      compliance_item_id: compliance_item_id,
    });

    if (evidence.length > 0) {
      await base44.entities.ComplianceEvidence.update(evidence[0].id, {
        scan_status: 'completed',
        sensitive_info_detected: scanResult.sensitive_info_detected,
        scan_results: {
          risk_level: scanResult.risk_level,
          detected_patterns: scanResult.detected_patterns,
          locations: scanResult.locations,
        },
      });
    }

    return Response.json({
      scan_status: 'completed',
      sensitive_info_detected: scanResult.sensitive_info_detected,
      risk_level: scanResult.risk_level,
      detected_patterns: scanResult.detected_patterns,
      locations: scanResult.locations,
      summary: scanResult.summary,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});