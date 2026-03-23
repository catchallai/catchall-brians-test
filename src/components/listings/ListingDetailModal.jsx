import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Phone,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Send,
  Loader2,
  Building2,
  FileText,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const platformNames = {
  google_business: 'Google Business Profile',
  yelp: 'Yelp',
  facebook: 'Facebook',
  apple_maps: 'Apple Maps',
  bing_places: 'Bing Places',
  yellowpages: 'Yellow Pages',
  tripadvisor: 'TripAdvisor',
  foursquare: 'Foursquare',
  other: 'Other',
};

const statusConfig = {
  verified: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Verified' },
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  needs_attention: {
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700',
    label: 'Needs Attention',
  },
  not_found: { icon: XCircle, color: 'bg-gray-100 text-gray-700', label: 'Not Found' },
};

export default function ListingDetailModal({ open, onClose, listing, onUpdate }) {
  const [submitting, setSubmitting] = useState(false);
  const [fixNotes, setFixNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!listing) {
    return null;
  }

  const status = statusConfig[listing.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleSubmitFix = async () => {
    setSubmitting(true);

    // Generate fix request using AI
    const fixRequest = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional fix request email/message for the following listing issues:

Business: ${listing.business_name}
Platform: ${platformNames[listing.platform]}
Current Issues:
${listing.issues?.map((i) => `- ${i}`).join('\n') || 'None specified'}

Suggested Corrections:
${listing.suggested_corrections?.map((c) => `- ${c}`).join('\n') || 'None specified'}

Additional Notes from User: ${fixNotes || 'None'}

Generate a clear, professional message that can be sent to the platform or used as documentation for fixing the listing.`,
      response_json_schema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          message: { type: 'string' },
          priority: { type: 'string' },
          estimated_fix_time: { type: 'string' },
        },
      },
    });

    // Update listing with fix request
    await onUpdate(listing.id, {
      fix_request_submitted: true,
      fix_request_date: new Date().toISOString(),
      fix_request_notes: fixNotes,
      fix_request_message: fixRequest.message,
      status: 'pending',
    });

    setSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-violet-600" />
            Listing Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{listing.business_name}</h3>
              <p className="text-sm text-gray-500">{platformNames[listing.platform]}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={status.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
                {listing.severity && listing.severity !== 'ok' && (
                  <Badge
                    className={
                      listing.severity === 'critical'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
                    }
                  >
                    {listing.severity}
                  </Badge>
                )}
              </div>
            </div>
            {listing.rating > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-xl font-bold">{listing.rating?.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-500">{listing.review_count} reviews</p>
              </div>
            )}
          </div>

          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="fix">Submit Fix</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Address</span>
                  </div>
                  <p className="text-gray-900">
                    {listing.address || 'Not listed'}
                    {listing.city && `, ${listing.city}`}
                    {listing.state && `, ${listing.state}`}
                    {listing.zip_code && ` ${listing.zip_code}`}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">Phone</span>
                  </div>
                  <p className="text-gray-900">{listing.phone || 'Not listed'}</p>
                </div>
              </div>

              {/* NAP Consistency */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">NAP Consistency</span>
                  {listing.nap_consistent ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3 h-3 mr-1" /> Consistent
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Inconsistent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {listing.nap_consistent
                    ? 'Name, Address, and Phone match across platforms'
                    : 'Discrepancies found in Name, Address, or Phone information'}
                </p>
              </div>

              {/* Last Scanned */}
              {listing.last_scanned && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  Last scanned: {new Date(listing.last_scanned).toLocaleDateString()}
                </div>
              )}

              {/* External Link */}
              {listing.listing_url && (
                <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View on {platformNames[listing.platform]}
                  </Button>
                </a>
              )}
            </TabsContent>

            <TabsContent value="issues" className="space-y-4 mt-4">
              {listing.issues?.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Issues Found</h4>
                  {listing.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      <span className="text-sm text-red-800">{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-gray-500">No issues found</p>
                </div>
              )}

              {listing.suggested_corrections?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Suggested Corrections</h4>
                  {listing.suggested_corrections.map((correction, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                      <span className="text-sm text-blue-800">{correction}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="fix" className="space-y-4 mt-4">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900">Fix Request Submitted!</h4>
                  <p className="text-sm text-gray-500">We'll track the progress of this fix.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Submit Fix Request</h4>
                    <p className="text-sm text-blue-700">
                      Submit a fix request to address the issues found on this listing. We'll
                      generate a professional request based on the detected issues.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (optional)
                    </label>
                    <Textarea
                      value={fixNotes}
                      onChange={(e) => setFixNotes(e.target.value)}
                      placeholder="Add any additional context or specific fixes needed..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitFix}
                    disabled={submitting}
                    className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Fix Request'}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
