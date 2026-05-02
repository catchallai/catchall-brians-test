import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, Calendar, Plus, Clock, Users, Link, Copy, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function MeetingsView({ user, channels }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30,
    channel_id: '',
  });

  const queryClient = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const calls = await base44.entities.VideoCall.list('-scheduled_at', 100);
      return calls.filter((c) => c.scheduled_at);
    },
  });

  const { data: activeCalls = [] } = useQuery({
    queryKey: ['active-calls'],
    queryFn: async () => {
      const calls = await base44.entities.VideoCall.list('-created_date', 50);
      return calls.filter((c) => c.status === 'active');
    },
    refetchInterval: 10000,
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowSchedule(false);
      setForm({ title: '', description: '', scheduled_at: '', duration_minutes: 30, channel_id: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VideoCall.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const handleSchedule = () => {
    if (!form.title || !form.scheduled_at) return;
    const roomId = `meeting-${Date.now()}`;
    scheduleMutation.mutate({
      title: form.title,
      description: form.description,
      channel_id: form.channel_id || null,
      room_id: roomId,
      host_email: user.email,
      started_by: user.email,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      status: 'scheduled',
      participants: [{ email: user.email, name: user.full_name }],
      settings: { waiting_room_enabled: true, allow_screen_share: true, auto_record: false },
    });
  };

  const copyLink = (roomId) => {
    const link = `${window.location.origin}/PublicCallJoin?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(roomId);
    setTimeout(() => setCopied(null), 2000);
  };

  const upcoming = meetings
    .filter((m) => new Date(m.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const past = meetings
    .filter((m) => new Date(m.scheduled_at) <= new Date())
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
    .slice(0, 10);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Meetings</h2>
          <p className="text-sm text-slate-500">Schedule and manage video meetings</p>
        </div>
        <Button onClick={() => setShowSchedule(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Active Calls */}
          {activeCalls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                🔴 Happening Now
              </h3>
              <div className="space-y-2">
                {activeCalls.map((call) => {
                  const ch = channels?.find((c) => c.id === call.channel_id);
                  return (
                    <Card key={call.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {call.title || (ch ? `#${ch.name}` : 'Active Call')}
                            </p>
                            <p className="text-sm text-slate-500">
                              {call.participants?.length || 0} participant(s) • Started{' '}
                              {format(new Date(call.started_at || call.created_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                          Join Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Upcoming Meetings ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No upcoming meetings</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowSchedule(true)}
                  >
                    Schedule one
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcoming.map((meeting) => {
                  const ch = channels?.find((c) => c.id === meeting.channel_id);
                  const isHost = meeting.host_email === user.email;
                  return (
                    <Card key={meeting.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Video className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {meeting.title || 'Untitled Meeting'}
                              </p>
                              {meeting.description && (
                                <p className="text-sm text-slate-500 mt-0.5">{meeting.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(meeting.scheduled_at), 'MMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(meeting.scheduled_at), 'h:mm a')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {meeting.participants?.length || 0} invited
                                </span>
                                {meeting.duration_minutes && (
                                  <span>{meeting.duration_minutes}min</span>
                                )}
                              </div>
                              {ch && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  #{ch.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyLink(meeting.room_id)}
                              className="text-slate-500 hover:text-slate-900"
                              title="Copy join link"
                            >
                              {copied === meeting.room_id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            {isHost && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(meeting.id)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past meetings */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Past Meetings
              </h3>
              <div className="space-y-2">
                {past.map((meeting) => (
                  <Card key={meeting.id} className="bg-white opacity-75">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Video className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {meeting.title || 'Untitled Meeting'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {format(new Date(meeting.scheduled_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">Past</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Meeting Title</Label>
              <Input
                placeholder="Weekly sync, Project review..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="Agenda, topics to cover..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Channel (optional)</Label>
              <select
                value={form.channel_id}
                onChange={(e) => setForm((f) => ({ ...f, channel_id: e.target.value }))}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm"
              >
                <option value="">No channel</option>
                {(channels || []).map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    #{ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSchedule(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              disabled={!form.title || !form.scheduled_at}
            >
              Schedule Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}