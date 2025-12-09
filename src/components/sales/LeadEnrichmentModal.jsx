import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ExternalLink, User, Briefcase, Mail, Phone, MapPin } from "lucide-react";

export default function LeadEnrichmentModal({ 
  open, 
  onClose, 
  onEnrich, 
  onSaveToContacts,
  isEnriching 
}) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [enrichedData, setEnrichedData] = useState(null);

  const handleEnrich = async () => {
    const data = await onEnrich(linkedinUrl);
    setEnrichedData(data);
  };

  const handleSave = async () => {
    await onSaveToContacts(enrichedData);
    setEnrichedData(null);
    setLinkedinUrl('');
    onClose();
  };

  const handleClose = () => {
    setEnrichedData(null);
    setLinkedinUrl('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            LinkedIn Lead Enrichment
          </DialogTitle>
        </DialogHeader>

        {!enrichedData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>LinkedIn Profile URL</Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
              />
              <p className="text-xs text-gray-500">
                Paste a LinkedIn profile URL to extract contact information and professional details
              </p>
            </div>

            <Button
              onClick={handleEnrich}
              disabled={!linkedinUrl || isEnriching}
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {isEnriching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enriching...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Enrich Profile</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{enrichedData.full_name}</h3>
                <p className="text-sm text-gray-600">{enrichedData.headline}</p>
                <a 
                  href={enrichedData.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 mt-1"
                >
                  View LinkedIn Profile <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                Score: {enrichedData.enrichment_score}/100
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium truncate">{enrichedData.email || 'Not found'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{enrichedData.phone || 'Not found'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="text-sm font-medium truncate">{enrichedData.company || 'Not found'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium truncate">{enrichedData.location || 'Not found'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">Current Position</p>
                <p className="text-sm text-gray-900">{enrichedData.job_title}</p>
                {enrichedData.company_website && (
                  <a 
                    href={enrichedData.company_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                  >
                    {enrichedData.company_website} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {enrichedData.summary && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Summary</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{enrichedData.summary}</p>
                </div>
              )}
            </div>

            {/* Experience */}
            {enrichedData.experience?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Experience</p>
                <div className="space-y-2">
                  {enrichedData.experience.slice(0, 3).map((exp, i) => (
                    <div key={i} className="p-2 border rounded-lg text-sm">
                      <p className="font-medium text-gray-900">{exp.title}</p>
                      <p className="text-xs text-gray-600">{exp.company} • {exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {enrichedData.skills?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {enrichedData.skills.slice(0, 10).map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <User className="w-4 h-4" />
                Save to Contacts
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}