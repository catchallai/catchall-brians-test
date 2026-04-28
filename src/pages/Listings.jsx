import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  MapPin,
  Scan,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Building2,
  Flag,
} from 'lucide-react';
import ListingCard from '@/components/listings/ListingCard';
import ListingModal from '@/components/modals/ListingModal';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import GBPManager from '@/components/seo/GBPManager';

export default function Listings() {
  const [showModal, setShowModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWebsite, setFilterWebsite] = useState('all');
  const [scanning, setScanning] = useState(false);
  const [selectedGBPListing, setSelectedGBPListing] = useState(null);
  const [detailListing, setDetailListing] = useState(null);
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list('-created_date', 500),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Listing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setShowModal(false);
      setSelectedListing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Listing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setShowModal(false);
      setSelectedListing(null);
    },
  });

  const handleSave = (data) => {
    if (selectedListing) {
      updateMutation.mutate({ id: selectedListing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (listing) => {
    setSelectedListing(listing);
    setShowModal(true);
  };

  const handleUpdateListing = async (id, data) => {
    await base44.entities.Listing.update(id, data);
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  };

  const scanListings = async () => {
    if (websites.length === 0) {
      return;
    }

    setScanning(true);

    for (const website of websites) {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze business listings for SyberJet Aircraft locations ONLY in the following areas:
        - Utah
        - West Virginia (WV)
        - Arizona
        - San Antonio, Texas
        
        Website: ${website.url}
        
        Search ALL major listing platforms: Google Business Profile, Yelp, Facebook Business, Apple Maps, Bing Places, TripAdvisor, Foursquare, Yellow Pages, and any other relevant directories.
        
        CRITICAL: Only include listings for SyberJet Aircraft in the specified locations. Ignore any other locations or businesses.
        
        For EACH platform found, perform a detailed audit:
        
        1. NAP CONSISTENCY CHECK:
           - Compare business name spelling/formatting across platforms
           - Verify address matches exactly (including suite numbers, abbreviations)
           - Check phone number format and accuracy
           - Flag ANY discrepancies between platforms
        
        2. BUSINESS HOURS AUDIT:
           - Check if hours are listed
           - Identify outdated or missing hours
           - Note holiday hours if applicable
        
        3. INFORMATION QUALITY:
           - Check for broken or outdated website links
           - Verify business description exists and is accurate
           - Check for missing photos or outdated images
           - Identify incomplete profile sections
        
        4. REVIEW HEALTH:
           - Note rating and review count
           - Flag if there are unanswered negative reviews
        
        For each listing, provide:
        - Platform name
        - Business name as listed (exact spelling)
        - Full address, city, state, zip
        - Phone number as displayed
        - Rating and review count
        - List of specific issues found
        - Whether NAP is consistent with other listings
        - Suggested corrections for any issues
        - Whether this needs manual review (true if critical issues found)
        - Severity: "critical", "warning", or "ok"`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            reference_nap: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { type: 'string' },
                phone: { type: 'string' },
              },
            },
            listings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  business_name: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zip_code: { type: 'string' },
                  phone: { type: 'string' },
                  rating: { type: 'number' },
                  review_count: { type: 'number' },
                  issues: { type: 'array', items: { type: 'string' } },
                  nap_consistent: { type: 'boolean' },
                  suggested_corrections: { type: 'array', items: { type: 'string' } },
                  needs_manual_review: { type: 'boolean' },
                  severity: { type: 'string' },
                },
              },
            },
          },
        },
      });

      if (analysis.listings?.length > 0) {
        for (const listing of analysis.listings) {
          const platformMap = {
            'google business': 'google_business',
            'google business profile': 'google_business',
            google: 'google_business',
            yelp: 'yelp',
            facebook: 'facebook',
            'facebook business': 'facebook',
            'apple maps': 'apple_maps',
            apple: 'apple_maps',
            'bing places': 'bing_places',
            bing: 'bing_places',
            tripadvisor: 'tripadvisor',
            'trip advisor': 'tripadvisor',
            foursquare: 'foursquare',
            'yellow pages': 'yellowpages',
            yellowpages: 'yellowpages',
          };

          const platform = platformMap[listing.platform?.toLowerCase()] || 'other';
          const severity = listing.severity?.toLowerCase() || 'ok';
          const hasIssues = listing.issues?.length > 0 || listing.needs_manual_review;

          let status = 'verified';
          if (severity === 'critical' || listing.needs_manual_review) {
            status = 'needs_attention';
          } else if (severity === 'warning' || hasIssues) {
            status = 'pending';
          }

          await base44.entities.Listing.create({
            website_id: website.id,
            business_name: listing.business_name || website.name,
            platform,
            address: listing.address,
            city: listing.city,
            state: listing.state,
            zip_code: listing.zip_code,
            phone: listing.phone,
            rating: listing.rating || 0,
            review_count: listing.review_count || 0,
            status,
            issues: listing.issues || [],
            nap_consistent: listing.nap_consistent !== false,
            suggested_corrections: listing.suggested_corrections || [],
            needs_manual_review: listing.needs_manual_review || false,
            severity: severity,
            last_scanned: new Date().toISOString(),
          });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['listings'] });
    setScanning(false);
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      !searchTerm ||
      l.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || l.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchesWebsite = filterWebsite === 'all' || l.website_id === filterWebsite;
    return matchesSearch && matchesPlatform && matchesStatus && matchesWebsite;
  });

  const stats = {
    total: listings.length,
    verified: listings.filter((l) => l.status === 'verified').length,
    needsAttention: listings.filter((l) => l.status === 'needs_attention').length,
    napIssues: listings.filter((l) => !l.nap_consistent).length,
    manualReview: listings.filter((l) => l.needs_manual_review).length,
    critical: listings.filter((l) => l.severity === 'critical').length,
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Location Listings</h1>
          <p className="text-gray-500 mt-1">
            Manage and monitor your business listings across platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={scanListings}
            variant="outline"
            className="gap-2"
            disabled={scanning || websites.length === 0}
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Scan Listings'}
          </Button>
          <Button
            onClick={() => {
              setSelectedListing(null);
              setShowModal(true);
            }}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Listing
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.needsAttention}</p>
                <p className="text-sm text-gray-500">Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.napIssues}</p>
                <p className="text-sm text-gray-500">NAP Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.manualReview}</p>
                <p className="text-sm text-gray-500">Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterWebsite} onValueChange={setFilterWebsite}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {websites.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="google_business">Google Business</SelectItem>
            <SelectItem value="yelp">Yelp</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="apple_maps">Apple Maps</SelectItem>
            <SelectItem value="bing_places">Bing Places</SelectItem>
            <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
            <SelectItem value="foursquare">Foursquare</SelectItem>
            <SelectItem value="yellowpages">Yellow Pages</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
            <SelectItem value="not_found">Not Found</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* GBP Manager */}
      {selectedGBPListing && <GBPManager listing={selectedGBPListing} />}

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500 mb-4">
              {listings.length === 0
                ? "Click 'Scan Listings' to automatically find your business listings across platforms."
                : 'Try adjusting your filters to see more results.'}
            </p>
            {listings.length === 0 && websites.length > 0 && (
              <Button onClick={scanListings} disabled={scanning}>
                {scanning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Scan className="w-4 h-4 mr-2" />
                )}
                Scan Listings
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={handleEdit}
              onViewDetails={(l) => setDetailListing(l)}
              onSubmitFix={(l) => setDetailListing(l)}
              onManageGBP={
                listing.platform === 'google_business'
                  ? () => setSelectedGBPListing(listing)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ListingModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedListing(null);
        }}
        listing={selectedListing}
        websites={websites}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail Modal */}
      <ListingDetailModal
        open={!!detailListing}
        onClose={() => setDetailListing(null)}
        listing={detailListing}
        onUpdate={handleUpdateListing}
      />
    </div>
  );
}
