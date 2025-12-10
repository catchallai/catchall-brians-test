import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import LeadEnrichmentModal from '@/components/sales/LeadEnrichmentModal';
import EnrichedLeadsTable from '@/components/sales/EnrichedLeadsTable';
import EmptyState from '@/components/ui/EmptyState';

export default function LeadEnrichment() {
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: enrichedLeads = [], isLoading } = useQuery({
    queryKey: ['enriched-leads'],
    queryFn: () => base44.entities.LeadEnrichment.list('-created_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
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
          type: "object",
          properties: {
            full_name: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            job_title: { type: "string" },
            company: { type: "string" },
            company_website: { type: "string" },
            location: { type: "string" },
            industry: { type: "string" },
            headline: { type: "string" },
            summary: { type: "string" },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  duration: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  school: { type: "string" },
                  degree: { type: "string" },
                  field: { type: "string" }
                }
              }
            },
            skills: { type: "array", items: { type: "string" } },
            connections: { type: "number" },
            enrichment_score: { type: "number" }
          }
        }
      });

      const enrichedLead = await base44.entities.LeadEnrichment.create({
        linkedin_url: linkedinUrl,
        ...analysis
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
        notes: `Enriched from LinkedIn: ${lead.linkedin_url}\n\nSummary: ${lead.summary || 'N/A'}`
      });

      await base44.entities.LeadEnrichment.update(lead.id, {
        contact_id: contact.id
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Lead Enrichment</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Enrich LinkedIn profiles with AI-powered data extraction</p>
        </div>
        <Button 
          onClick={() => setShowEnrichmentModal(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Enrich Lead
        </Button>
      </div>

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
        <EnrichedLeadsTable
          leads={enrichedLeads}
          onCreateContact={(lead) => createContactFromLeadMutation.mutate(lead)}
        />
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