import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function TimesheetApproval() {
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['contractor-timesheets'],
    queryFn: () => base44.entities.ContractorTimesheet.list('-submitted_date', 50),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractorTimesheet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-timesheets'] });
      setSelectedTimesheet(null);
    },
  });

  const handleApprove = (timesheet) => {
    approveMutation.mutate({
      id: timesheet.id,
      data: {
        status: 'approved',
        approved_by: user?.email,
        approved_date: new Date().toISOString(),
      },
    });
  };

  const handleReject = (timesheet) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    approveMutation.mutate({
      id: timesheet.id,
      data: {
        status: 'rejected',
        approved_by: user?.email,
        approved_date: new Date().toISOString(),
        rejection_reason: rejectionReason,
      },
    });
  };

  const pendingTimesheets = timesheets.filter((t) => t.status === 'pending');
  const recentTimesheets = timesheets.filter((t) => t.status !== 'pending').slice(0, 10);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      {/* Pending Timesheets */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Timesheets
            {pendingTimesheets.length > 0 && (
              <Badge className="bg-yellow-500">{pendingTimesheets.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTimesheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No pending timesheets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTimesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {timesheet.contractor_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {timesheet.project_name}
                      </p>
                    </div>
                    <Badge className={statusColors[timesheet.status]}>{timesheet.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <div className="text-gray-500 text-xs">Period</div>
                      <div className="font-medium">
                        {format(new Date(timesheet.period_start), 'MMM d')} -{' '}
                        {format(new Date(timesheet.period_end), 'MMM d')}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Hours</div>
                      <div className="font-medium">{timesheet.hours_logged}h</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Rate</div>
                      <div className="font-medium">${timesheet.hourly_rate}/hr</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Total</div>
                      <div className="font-semibold text-green-600">
                        ${timesheet.total_amount || timesheet.hours_logged * timesheet.hourly_rate}
                      </div>
                    </div>
                  </div>

                  {timesheet.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                      "{timesheet.notes}"
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(timesheet)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTimesheet(timesheet)}
                      disabled={approveMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Timesheets */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTimesheets.map((timesheet) => (
              <div
                key={timesheet.id}
                className="p-3 rounded-lg border flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{timesheet.contractor_name}</div>
                  <div className="text-xs text-gray-500">
                    {timesheet.project_name} • {timesheet.hours_logged}h • $
                    {timesheet.total_amount || timesheet.hours_logged * timesheet.hourly_rate}
                  </div>
                </div>
                <Badge className={statusColors[timesheet.status]}>{timesheet.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <Dialog open={!!selectedTimesheet} onOpenChange={() => setSelectedTimesheet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Rejecting timesheet for <strong>{selectedTimesheet?.contractor_name}</strong>
              </p>
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason..."
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedTimesheet(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(selectedTimesheet)}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Timesheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
