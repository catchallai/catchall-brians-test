import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  Star,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Lightbulb,
  Flag,
  Settings,
  Eye,
  Send,
} from 'lucide-react';

const platformLogos = {
  google_business: '🔍',
  yelp: '⭐',
  facebook: '📘',
  apple_maps: '🍎',
  bing_places: '🔷',
  yellowpages: '📒',
  tripadvisor: '🦉',
  foursquare: '📍',
  other: '🌐',
};

const platformNames = {
  google_business: 'Google Business',
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

const severityConfig = {
  critical: { color: 'bg-red-500 text-white', label: 'Critical' },
  warning: { color: 'bg-amber-500 text-white', label: 'Warning' },
  ok: { color: 'bg-emerald-500 text-white', label: 'OK' },
};

export default function ListingCard({ listing, onEdit, onManageGBP, onViewDetails, onSubmitFix }) {
  const status = statusConfig[listing.status] || statusConfig.pending;
  const severity = severityConfig[listing.severity] || severityConfig.ok;
  const StatusIcon = status.icon;

  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-all ${listing.needs_manual_review ? 'ring-2 ring-red-300' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{platformLogos[listing.platform]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{listing.business_name}</h3>
                <Badge className={`${status.color} text-xs gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>
                {listing.severity && listing.severity !== 'ok' && (
                  <Badge className={`${severity.color} text-xs`}>{severity.label}</Badge>
                )}
                {listing.needs_manual_review && (
                  <Badge className="bg-red-600 text-white text-xs gap-1">
                    <Flag className="w-3 h-3" />
                    Manual Review
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">{platformNames[listing.platform]}</p>

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {listing.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.city}, {listing.state}
                  </span>
                )}
                {listing.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {listing.phone}
                  </span>
                )}
              </div>

              {listing.rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{listing.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-500">({listing.review_count} reviews)</span>
                </div>
              )}

              {listing.issues?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {listing.issues.slice(0, 3).map((issue, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs text-red-600 border-red-200"
                    >
                      {issue}
                    </Badge>
                  ))}
                  {listing.issues.length > 3 && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      +{listing.issues.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {!listing.nap_consistent && (
                <Badge variant="outline" className="mt-2 text-xs text-amber-600 border-amber-200">
                  NAP Inconsistency Detected
                </Badge>
              )}

              {listing.suggested_corrections?.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-1">
                    <Lightbulb className="w-3 h-3" />
                    Suggested Corrections
                  </div>
                  <ul className="text-xs text-blue-600 space-y-1">
                    {listing.suggested_corrections.slice(0, 3).map((correction, idx) => (
                      <li key={idx}>• {correction}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => onViewDetails(listing)}
              >
                <Eye className="w-3 h-3" />
                Details
              </Button>
            )}
            {onSubmitFix &&
              (listing.status === 'needs_attention' || listing.issues?.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-violet-600 border-violet-200 hover:bg-violet-50"
                  onClick={() => onSubmitFix(listing)}
                >
                  <Send className="w-3 h-3" />
                  Submit Fix
                </Button>
              )}
            {onManageGBP && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={onManageGBP}
              >
                <Settings className="w-3 h-3" />
                Manage GBP
              </Button>
            )}
            {listing.listing_url && (
              <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(listing)}>
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
