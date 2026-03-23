import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Link2, CheckCircle, XCircle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import MeetingLinkModal from '@/components/modals/MeetingLinkModal';
import GoogleCalendarConnect from '@/components/settings/GoogleCalendarConnect';
import MeetingNoShowAnalysis from '@/components/sales/MeetingNoShowAnalysis';

export default function MeetingScheduler() {
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const queryClient = useQueryClient();

  const { data: meetingLinks = [] } = useQuery({
    queryKey: ['meeting-links'],
    queryFn: () => base44.entities.MeetingLink.list('-created_date', 50),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['meeting-bookings'],
    queryFn: () => base44.entities.MeetingBooking.list('-scheduled_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      data.id
        ? base44.entities.MeetingLink.update(data.id, data)
        : base44.entities.MeetingLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-links'] });
      setShowModal(false);
      setEditingLink(null);
    },
  });

  const getBookingsForLink = (linkId) => {
    return bookings.filter((b) => b.meeting_link_id === linkId);
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'scheduled' && new Date(b.scheduled_date) > new Date()
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Meeting Scheduler
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Calendly-style booking links</p>
        </div>
        <Button
          onClick={() => {
            setEditingLink(null);
            setShowModal(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Meeting Link
        </Button>
      </div>

      {/* Google Calendar Integration */}
      <GoogleCalendarConnect />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter((b) => b.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">No Shows</p>
            <p className="text-2xl font-bold text-red-600">
              {bookings.filter((b) => b.status === 'no_show').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Meeting Links</h2>
        {meetingLinks.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No meeting links yet"
            description="Create shareable booking links for prospects to schedule meetings. Connect Google Calendar for automatic syncing."
            actionLabel="Create Link"
            onAction={() => {
              setEditingLink(null);
              setShowModal(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetingLinks.map((link) => (
              <Card key={link.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{link.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                    </div>
                    <Badge variant={link.is_active ? 'default' : 'secondary'}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{link.duration_minutes} minutes</span>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Bookings</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {getBookingsForLink(link.id).length}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      const url = `${window.location.origin}/book/${link.id}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Meeting Patterns & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MeetingNoShowAnalysis bookings={bookings} />

        {upcomingBookings.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Meetings
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {booking.attendee_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{booking.attendee_email}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(booking.scheduled_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MeetingLinkModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingLink(null);
        }}
        meetingLink={editingLink}
        onSave={(data) => saveMutation.mutate(data)}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}
