import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  MessageSquare,
  Eye,
} from 'lucide-react';
import GBPOptimizationCard from '@/components/local/GBPOptimizationCard';
import ReviewManagement from '@/components/local/ReviewManagement';
import MapRankTracker from '@/components/local/MapRankTracker';
import GBPProfileModal from '@/components/local/GBPProfileModal';

export default function LocalSEO() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['gbp-profiles'],
    queryFn: () => base44.entities.GBPProfile.list('-created_date', 50),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 200),
  });

  const { data: mapRankings = [] } = useQuery({
    queryKey: ['map-rankings'],
    queryFn: () => base44.entities.MapRanking.list('-scan_date', 100),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list('-created_date', 100),
  });

  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;
  const avgOptimization = profiles.length
    ? Math.round(
        profiles.reduce((sum, p) => sum + (p.optimization_score || 0), 0) / profiles.length
      )
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Local SEO</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage GBP profiles, reviews, and local rankings
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProfile(null);
            setShowProfileModal(true);
          }}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Add GBP Profile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profiles.length}
                </p>
                <p className="text-sm text-gray-500">GBP Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
                <p className="text-sm text-gray-500">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
                <p className="text-sm text-gray-500">Total Reviews</p>
              </div>
            </div>
            {pendingReviews > 0 && (
              <Badge className="mt-2 bg-amber-100 text-amber-700">{pendingReviews} pending</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgOptimization}%
                </p>
                <p className="text-sm text-gray-500">Optimization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">GBP Profiles</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1">
            Reviews
            {pendingReviews > 0 && (
              <Badge className="bg-amber-500 text-white text-xs ml-1">{pendingReviews}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rankings">Map Rankings</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-4">
          {profiles.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No GBP Profiles
                </h3>
                <p className="text-gray-500 mb-4">
                  Add your Google Business Profiles to optimize local SEO
                </p>
                <Button onClick={() => setShowProfileModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <GBPOptimizationCard
                  key={profile.id}
                  profile={profile}
                  onEdit={() => {
                    setEditingProfile(profile);
                    setShowProfileModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ReviewManagement reviews={reviews} profiles={profiles} />
        </TabsContent>

        <TabsContent value="rankings" className="mt-4">
          <MapRankTracker rankings={mapRankings} profiles={profiles} />
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Listing Management</span>
                <Button variant="outline" size="sm" className="gap-1">
                  <RefreshCw className="w-4 h-4" />
                  Scan All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {listings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No listings found. Go to Listings page to add them.
                  </p>
                ) : (
                  listings.slice(0, 10).map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{listing.platform}</Badge>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {listing.business_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.nap_consistent ? (
                          <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                            <CheckCircle className="w-3 h-3" />
                            NAP OK
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Issues
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GBPProfileModal
        open={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setEditingProfile(null);
        }}
        profile={editingProfile}
      />
    </div>
  );
}
