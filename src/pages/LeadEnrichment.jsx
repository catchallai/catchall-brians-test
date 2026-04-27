import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import LeadEnrichmentModal from '@/components/sales/LeadEnrichmentModal';
import EnrichedLeadsTable from '@/components/sales/EnrichedLeadsTable';
import EmptyState from '@/components/ui/EmptyState';
import EnrichmentQualityDisplay from '@/components/sales/EnrichmentQualityDisplay';

export default function LeadEnrichment() {
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const queryClient = useQueryClient();

  const { data: enrichedLeads = [] } = useQuery({
    queryKey: ['enriched-leads'],
    queryFn: () => base44.entities.LeadEnrichment.list('-enrichment_score', 100),
  });

  const enrichLinkedInMutation = useMutation({
    mutationFn: async (linkedinUrl) => {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract detailed professional information from this LinkedIn profile: ${linkedinUrl}

Extract:
1. Full name, first name, last name
2. Email (if visible or can be inferred from company domain)
3. Phone number (if available)
4. Current job title
5. Current company name
6. Company website
7. Location (city, state, country)
8. Industry
9. LinkedIn headline
10. Profile summary/about section
11. Last 3 work experiences (title, company, duration, description)
12. Education (school, degree, field)
13. Top 10 skills
14. Number of connections (approximate if not exact)
15. Any other contact information

Also provide an enrichment_score (0-100) based on how much data was found.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            job_title: { type: 'string' },
            company: { type: 'string' },
            company_website: { type: 'string' },
            location: { type: 'string' },
            industry: { type: 'string' },
            headline: { type: 'string' },
            summary: { type: 'string' },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  duration: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  school: { type: 'string' },
                  degree: { type: 'string' },
                  field: { type: 'string' },
                },
              },
            },
            skills: { type: 'array', items: { type: 'string' } },
            connections: { type: 'number' },
            enrichment_score: { type: 'number' },
          },
        },
      });

      const enrichedLead = await base44.entities.LeadEnrichment.create({
        linkedin_url: linkedinUrl,
        ...analysis,
      });

      return enrichedLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enriched-leads'] });
    },
  });

  const createContactFromLeadMutation = useMutation({
    mutationFn: async (lead) => {
      const contact = await base44.entities.Contact.create({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        job_title: lead.job_title,
        status: 'lead',
        source: 'LinkedIn Enrichment',
        notes: `Enriched from LinkedIn: ${lead.linkedin_url}\n\nSummary: ${lead.summary || 'N/A'}`,
      });

      await base44.entities.LeadEnrichment.update(lead.id, {
        contact_id: contact.id,
      });

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['enriched-leads'] });
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Lead Enrichment
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Enrich LinkedIn profiles with AI-powered data extraction
          </p>
        </div>
        <Button
          onClick={() => setShowEnrichmentModal(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Enrich Lead
        </Button>
      </div>

      {/* Quality Filter */}
      {enrichedLeads.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <label className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Min Quality Score:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="flex-1 max-w-xs"
              />
              <span className="text-sm font-bold text-gray-900 dark:text-white">{minScore}</span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Enriched Leads */}
      {enrichedLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No enriched leads yet"
          description="Start enriching LinkedIn profiles to gather detailed professional information automatically."
          actionLabel="Enrich First Lead"
          onAction={() => setShowEnrichmentModal(true)}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {enrichedLeads
              .filter((l) => l.enrichment_score >= minScore)
              .map((lead) => (
                <div key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <EnrichmentQualityDisplay lead={lead} />
                </div>
              ))}
          </div>

          {selectedLead && (
            <Card className="glass-card col-span-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedLead.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedLead.headline}</p>
                  </div>
                  <Button
                    onClick={() => createContactFromLeadMutation.mutate(selectedLead)}
                    disabled={createContactFromLeadMutation.isPending}
                  >
                    Add to Contacts
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {selectedLead.email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedLead.email}
                      </p>
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedLead.phone}
                      </p>
                    </div>
                  )}
                  {selectedLead.company && (
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedLead.company}
                      </p>
                    </div>
                  )}
                  {selectedLead.job_title && (
                    <div>
                      <p className="text-xs text-gray-500">Title</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedLead.job_title}
                      </p>
                    </div>
                  )}
                  {selectedLead.location && (
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedLead.location}
                      </p>
                    </div>
                  )}
                  {selectedLead.connections && (
                    <div>
                      <p className="text-xs text-gray-500">Connections</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedLead.connections}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              All Enriched Leads
            </h3>
            <EnrichedLeadsTable
              leads={enrichedLeads.filter((l) => l.enrichment_score >= minScore)}
              onCreateContact={(lead) => createContactFromLeadMutation.mutate(lead)}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <LeadEnrichmentModal
        open={showEnrichmentModal}
        onClose={() => setShowEnrichmentModal(false)}
        onEnrich={(url) => enrichLinkedInMutation.mutateAsync(url)}
        onSaveToContacts={(lead) => createContactFromLeadMutation.mutate(lead)}
        isEnriching={enrichLinkedInMutation.isPending}
      />
    </div>
  );
}
