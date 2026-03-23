import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, Building2 } from 'lucide-react';

export default function GBPProfileModal({ open, onClose, profile }) {
  const [formData, setFormData] = useState({
    business_name: '',
    google_place_id: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    category: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        google_place_id: profile.google_place_id || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip: profile.zip || '',
        phone: profile.phone || '',
        category: profile.category || '',
      });
    } else {
      setFormData({
        business_name: '',
        google_place_id: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        category: '',
      });
    }
  }, [profile, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.GBPProfile.update(profile.id, data);
      }
      return base44.entities.GBPProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
      onClose();
    },
  });

  const analyzeProfile = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this Google Business Profile for optimization:
Business: ${formData.business_name}
Category: ${formData.category}
Location: ${formData.city}, ${formData.state}

Provide an optimization score and list of issues to fix.`,
        response_json_schema: {
          type: 'object',
          properties: {
            optimization_score: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      const updateData = {
        ...formData,
        optimization_score: result.optimization_score,
        optimization_issues: result.issues,
      };

      if (profile) {
        await base44.entities.GBPProfile.update(profile.id, updateData);
      } else {
        await base44.entities.GBPProfile.create(updateData);
      }

      queryClient.invalidateQueries({ queryKey: ['gbp-profiles'] });
      onClose();
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {profile ? 'Edit GBP Profile' : 'Add GBP Profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Business Name *</Label>
            <Input
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <Label>Google Place ID</Label>
            <Input
              value={formData.google_place_id}
              onChange={(e) => setFormData({ ...formData, google_place_id: e.target.value })}
              placeholder="ChIJ..."
            />
          </div>

          <div>
            <Label>Category</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Restaurant, Plumber, Dentist"
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={analyzeProfile}
              disabled={isAnalyzing || !formData.business_name}
              className="gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Save & Analyze
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.business_name}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
