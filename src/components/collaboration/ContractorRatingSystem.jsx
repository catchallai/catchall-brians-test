import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Heart, ThumbsUp, Award } from "lucide-react";

export default function ContractorRatingSystem() {
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [rating, setRating] = useState({
    overall: 0,
    quality: 0,
    communication: 0,
    timeliness: 0,
    feedback: '',
    wouldRehire: true
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-rating', 100)
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['completed-schedules'],
    queryFn: async () => {
      const all = await base44.entities.ContractorSchedule.list('-end_date', 100);
      return all.filter(s => s.status === 'completed');
    }
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['contractor-ratings'],
    queryFn: () => base44.entities.ContractorRating.list('-created_date', 100)
  });

  const rateMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractorRating.create(data),
    onSuccess: async (data, variables) => {
      // Update contractor's average rating
      const contractorRatings = ratings.filter(r => r.contractor_id === variables.contractor_id);
      const totalRatings = contractorRatings.length + 1;
      const avgRating = (contractorRatings.reduce((sum, r) => sum + r.rating, 0) + variables.rating) / totalRatings;

      const contractor = contractors.find(c => c.id === variables.contractor_id);
      await base44.entities.Contractor.update(variables.contractor_id, {
        rating: avgRating,
        total_ratings: totalRatings,
        completed_projects: (contractor?.completed_projects || 0) + 1
      });

      queryClient.invalidateQueries({ queryKey: ['contractor-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      setShowRateModal(false);
      resetForm();
    }
  });

  const togglePreferredMutation = useMutation({
    mutationFn: ({ id, isPreferred }) => 
      base44.entities.Contractor.update(id, { is_preferred: !isPreferred }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contractors'] })
  });

  const resetForm = () => {
    setRating({
      overall: 0,
      quality: 0,
      communication: 0,
      timeliness: 0,
      feedback: '',
      wouldRehire: true
    });
    setSelectedSchedule(null);
  };

  const handleSubmitRating = () => {
    if (rating.overall === 0) {
      alert('Please select an overall rating');
      return;
    }

    rateMutation.mutate({
      contractor_id: selectedSchedule.contractor_id,
      schedule_id: selectedSchedule.id,
      project_name: selectedSchedule.project_name,
      rating: rating.overall,
      quality_score: rating.quality,
      communication_score: rating.communication,
      timeliness_score: rating.timeliness,
      feedback: rating.feedback,
      would_rehire: rating.wouldRehire,
      rated_by: user?.email,
      rated_by_name: user?.full_name
    });
  };

  const StarRating = ({ value, onChange, label }) => (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );

  const unratedSchedules = schedules.filter(s => 
    !ratings.some(r => r.schedule_id === s.id)
  );

  const topContractors = contractors
    .filter(c => c.rating && c.rating >= 4)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Rate Completed Projects */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Rate Completed Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unratedSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No completed projects to rate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unratedSchedules.map((schedule) => (
                <div key={schedule.id} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {schedule.contractor_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {schedule.project_name}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowRateModal(true);
                      }}
                    >
                      Rate Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Contractors */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Contractors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topContractors.map((contractor, idx) => (
              <div key={contractor.id} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {contractor.name}
                      </h4>
                      {contractor.is_preferred && (
                        <Badge className="bg-violet-100 text-violet-800">
                          <Heart className="w-3 h-3 mr-1 fill-current" />
                          Preferred
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {contractor.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{contractor.rating?.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {contractor.completed_projects || 0} projects
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePreferredMutation.mutate({ 
                      id: contractor.id, 
                      isPreferred: contractor.is_preferred 
                    })}
                  >
                    {contractor.is_preferred ? (
                      <Heart className="w-4 h-4 fill-current" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating Modal */}
      <Dialog open={showRateModal} onOpenChange={setShowRateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rate Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-1">{selectedSchedule?.contractor_name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedSchedule?.project_name}
              </div>
            </div>

            <StarRating
              label="Overall Rating *"
              value={rating.overall}
              onChange={(val) => setRating({ ...rating, overall: val })}
            />

            <div className="grid grid-cols-3 gap-4">
              <StarRating
                label="Quality"
                value={rating.quality}
                onChange={(val) => setRating({ ...rating, quality: val })}
              />
              <StarRating
                label="Communication"
                value={rating.communication}
                onChange={(val) => setRating({ ...rating, communication: val })}
              />
              <StarRating
                label="Timeliness"
                value={rating.timeliness}
                onChange={(val) => setRating({ ...rating, timeliness: val })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Feedback</label>
              <Textarea
                value={rating.feedback}
                onChange={(e) => setRating({ ...rating, feedback: e.target.value })}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rating.wouldRehire}
                onChange={(e) => setRating({ ...rating, wouldRehire: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm">I would hire this contractor again</label>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRating} disabled={rateMutation.isPending}>
                Submit Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}