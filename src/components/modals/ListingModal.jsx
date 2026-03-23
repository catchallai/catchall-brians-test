import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const platforms = [
  { value: 'google_business', label: 'Google Business' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'apple_maps', label: 'Apple Maps' },
  { value: 'bing_places', label: 'Bing Places' },
  { value: 'yellowpages', label: 'Yellow Pages' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'foursquare', label: 'Foursquare' },
  { value: 'other', label: 'Other' },
];

export default function ListingModal({ open, onClose, listing, websites = [], onSave, isLoading }) {
  const [formData, setFormData] = useState({
    business_name: '',
    website_id: '',
    platform: 'google_business',
    listing_url: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    phone: '',
    rating: 0,
    review_count: 0,
    status: 'pending',
  });

  useEffect(() => {
    if (listing) {
      setFormData({
        business_name: listing.business_name || '',
        website_id: listing.website_id || '',
        platform: listing.platform || 'google_business',
        listing_url: listing.listing_url || '',
        address: listing.address || '',
        city: listing.city || '',
        state: listing.state || '',
        zip_code: listing.zip_code || '',
        country: listing.country || '',
        phone: listing.phone || '',
        rating: listing.rating || 0,
        review_count: listing.review_count || 0,
        status: listing.status || 'pending',
      });
    } else {
      setFormData({
        business_name: '',
        website_id: websites[0]?.id || '',
        platform: 'google_business',
        listing_url: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        phone: '',
        rating: 0,
        review_count: 0,
        status: 'pending',
      });
    }
  }, [listing, open, websites]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? 'Edit Listing' : 'Add Listing'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Business Name *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Company Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Select
                value={formData.website_id}
                onValueChange={(v) => setFormData({ ...formData, website_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select website" />
                </SelectTrigger>
                <SelectContent>
                  {websites.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform *</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData({ ...formData, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Listing URL</Label>
              <Input
                value={formData.listing_url}
                onChange={(e) => setFormData({ ...formData, listing_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="needs_attention">Needs Attention</SelectItem>
                  <SelectItem value="not_found">Not Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {listing ? 'Update' : 'Add Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
