import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";

const TYPE_COLORS = { holiday: "bg-red-100 text-red-700 border-red-200", team_event: "bg-blue-100 text-blue-700 border-blue-200", training: "bg-yellow-100 text-yellow-700 border-yellow-200", review_cycle: "bg-purple-100 text-purple-700 border-purple-200", all_hands: "bg-indigo-100 text-indigo-700 border-indigo-200", birthday: "bg-pink-100 text-pink-700 border-pink-200", work_anniversary: "bg-teal-100 text-teal-700 border-teal-200", other: "bg-gray-100 text-gray-700 border-gray-200" };

export default function HRISTeamCalendar() {
  const qc = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", type: "team_event", start_date: "", end_date: "", all_day: true, location: "", description: "", department: "" });

  const { data: events = [] } = useQuery({ queryKey: ["hris-calendar-events"], queryFn: () => base44.entities.HRISCalendarEvent.list() });

  const save = useMutation({ mutationFn: (d) => editing ? base44.entities.HRISCalendarEvent.update(editing.id, d) : base44.entities.HRISCalendarEvent.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-calendar-events"] }); setShowDialog(false); setEditing(null); } });
  const remove = useMutation({ mutationFn: (id) => base44.entities.HRISCalendarEvent.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-calendar-events"] }) });

  const openNew = (date) => { setEditing(null); setForm({ title: "", type: "team_event", start_date: date ? format(date, "yyyy-MM-dd") + "T09:00" : "", end_date: date ? format(date, "yyyy-MM-dd") + "T10:00" : "", all_day: true, location: "", description: "", department: "" }); setShowDialog(true); };
  const openEdit = (ev) => { setEditing(ev); setForm({ title: ev.title || "", type: ev.type || "team_event", start_date: ev.start_date ? ev.start_date.slice(0, 16) : "", end_date: ev.end_date ? ev.end_date.slice(0, 16) : "", all_day: ev.all_day ?? true, location: ev.location || "", description: ev.description || "", department: ev.department || "" }); setShowDialog(true); };

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const startPadding = startOfMonth(currentDate).getDay();

  const getEventsForDay = (day) => events.filter(ev => { try { return isSameDay(parseISO(ev.start_date), day); } catch { return false; } });

  const upcomingEvents = [...events].filter(ev => { try { return parseISO(ev.start_date) >= new Date(); } catch { return false; } }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).slice(0, 10);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} events</p>
        </div>
        <Button onClick={() => openNew(null)}><Plus className="w-4 h-4 mr-2" />Add Event</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{format(currentDate, "MMMM yyyy")}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-xs text-gray-400 font-medium text-center py-2">{d}</div>)}
                {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.toString()} className={`min-h-[72px] p-1 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isToday ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-transparent"}`} onClick={() => openNew(day)}>
                      <p className={`text-xs font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-600 dark:text-gray-300"}`}>{format(day, "d")}</p>
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} className={`text-xs truncate rounded px-1 mb-0.5 border ${TYPE_COLORS[ev.type] || TYPE_COLORS.other}`} onClick={(e) => { e.stopPropagation(); openEdit(ev); }}>{ev.title}</div>
                      ))}
                      {dayEvents.length > 2 && <p className="text-xs text-gray-400">+{dayEvents.length - 2} more</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcomingEvents.length === 0 && <p className="text-sm text-gray-400">No upcoming events.</p>}
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-2 group">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[ev.type]?.split(" ")[0] || "bg-gray-300"}`} style={{ marginTop: 6 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-400">{ev.start_date ? format(parseISO(ev.start_date), "MMM d, yyyy") : ""}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={() => openEdit(ev)}><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={() => remove.mutate(ev.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Event Types</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(TYPE_COLORS).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${cls.split(" ")[0]}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{type.replace(/_/g," ")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(TYPE_COLORS).map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start</Label><Input type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End</Label><Input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => save.mutate(form)} disabled={!form.title || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
              {editing && <Button variant="destructive" onClick={() => { remove.mutate(editing.id); setShowDialog(false); }}>Delete</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}