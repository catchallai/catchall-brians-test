import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, CheckCircle } from "lucide-react";

export default function BusinessReviewScheduler({ contacts = [] }) {
  const [selectedContact, setSelectedContact] = useState('');
  const [reviewType, setReviewType] = useState('health');
  const [scheduledDate, setScheduledDate] = useState('');
  const [csmEmail, setCsmEmail] = useState('');
  const queryClient = useQueryClient();

  const scheduleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('scheduleBusinessReview', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csm-tasks'] });
      setSelectedContact('');
      setReviewType('health');
      setScheduledDate('');
      setCsmEmail('');
    }
  });

  const handleSchedule = () => {
    if (!selectedContact || !scheduledDate || !csmEmail) return;

    scheduleMutation.mutate({
      contact_id: selectedContact,
      review_type: reviewType === 'business' ? 'Business' : 'Health',
      scheduled_date: scheduledDate,
      csm_email: csmEmail
    });
  };

  const isLoading = scheduleMutation.isPending;
  const canSchedule = selectedContact && scheduledDate && csmEmail;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
          Schedule Business Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
          <Select value={selectedContact} onValueChange={setSelectedContact}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="Select customer..." />
            </SelectTrigger>
            <SelectContent>
              {contacts.filter(c => c.status === 'customer').map(contact => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <Select value={reviewType} onValueChange={setReviewType}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health">Health Check</SelectItem>
                <SelectItem value="business">Business Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">CSM Email</label>
          <input
            type="email"
            value={csmEmail}
            onChange={(e) => setCsmEmail(e.target.value)}
            placeholder="csm@company.com"
            className="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm"
          />
        </div>

        <Button
          onClick={handleSchedule}
          disabled={isLoading || !canSchedule}
          className="w-full gap-2 text-xs sm:text-sm"
        >
          {isLoading ? (
            <><Loader2 className="w-3 sm:w-4 h-3 sm:h-4 animate-spin" /> Scheduling...</>
          ) : (
            <><CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" /> Schedule Review</>
          )}
        </Button>

        {scheduleMutation.isSuccess && (
          <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800">
            <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">✓ Review scheduled and invites sent</p>
          </div>
        )}

        {scheduleMutation.isError && (
          <div className="p-2 sm:p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{scheduleMutation.error?.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}