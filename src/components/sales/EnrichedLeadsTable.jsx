import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Mail, Phone, Briefcase, User } from 'lucide-react';

export default function EnrichedLeadsTable({ leads, onCreateContact }) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Enriched Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No enriched leads yet</p>
            <p className="text-gray-400 text-xs">
              Start enriching LinkedIn profiles to build your database
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{lead.full_name}</h4>
                      {lead.enrichment_score && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                          {lead.enrichment_score}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{lead.job_title}</p>
                    <p className="text-xs text-gray-500">{lead.company}</p>
                  </div>
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:text-violet-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.location && (
                    <div className="flex items-center gap-2 text-gray-600 text-xs">
                      <Briefcase className="w-3 h-3" />
                      <span className="truncate">{lead.location}</span>
                    </div>
                  )}
                </div>

                {!lead.contact_id && (
                  <Button size="sm" onClick={() => onCreateContact(lead)} className="w-full gap-2">
                    <User className="w-3 h-3" />
                    Create Contact
                  </Button>
                )}
                {lead.contact_id && (
                  <Badge className="w-full justify-center bg-emerald-100 text-emerald-700 border-0">
                    Added to Contacts
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
