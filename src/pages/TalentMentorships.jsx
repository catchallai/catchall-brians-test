import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, ArrowRight, Pencil, Trash2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_COLORS = { active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", paused: "bg-yellow-100 text-yellow-600", cancelled: "bg-red-100 text-red-600" };
const FREQ_LABELS = { weekly: "Weekly", bi_weekly: "Bi-Weekly", monthly: "Monthly", as_needed: "As Needed" };

export default function TalentMentorships() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ mentor_name: "", mentee_name: "", focus_area: "", goals: "", status: "active", start_date: "", end_date: "", meeting_frequency: "bi_weekly", notes: "", next_meeting_date: "" });

  const { data: mentorships = [] } = useQuery({ queryKey: ["talent-mentorships"], queryFn: () => base44.entities.TalentMentorship.list("-created_date") });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.TalentMentorship.update(editing.id, d) : base44.entities.TalentMentorship.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["talent-mentorships"] }); setShowDialog(false); setEditing(null); }
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.TalentMentorship.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-mentorships"] }) });
  const updateStatus = useMutation({ mutationFn: ({ id, status }) => base44.entities.TalentMentorship.update(id, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-mentorships"] }) });

  const openNew = () => { setEditing(null); setForm({ mentor_name: "", mentee_name: "", focus_area: "", goals: "", status: "active", start_date: "", end_date: "", meeting_frequency: "bi_weekly", notes: "", next_meeting_date: "" }); setShowDialog(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setShowDialog(true); };

  const filtered = mentorships.filter(m => {
    const ms = m.mentor_name?.toLowerCase().includes(search.toLowerCase()) || m.mentee_name?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || m.status === statusFilter;
    return ms && mst;
  });

  const stats = { total: mentorships.length, active: mentorships.filter(m=>m.status==="active").length, completed: mentorships.filter(m=>m.status==="completed").length };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentorships</h1><p className="text-sm text-gray-500 mt-1">{stats.active} active mentorship pairs</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Mentorship</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total", value: stats.total, color: "text-gray-700 dark:text-gray-200" }, { label: "Active", value: stats.active, color: "text-green-600" }, { label: "Completed", value: stats.completed, color: "text-blue-600" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search by mentor or mentee..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{["active","completed","paused","cancelled"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(m => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-700 font-medium text-sm">{m.mentor_name?.[0]}</div>
                  <div>
                    <p className="text-xs text-gray-400">Mentor</p>
                    <p className="font-semibold text-sm">{m.mentor_name}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 font-medium text-sm">{m.mentee_name?.[0]}</div>
                  <div>
                    <p className="text-xs text-gray-400">Mentee</p>
                    <p className="font-semibold text-sm">{m.mentee_name}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove.mutate(m.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge>
                {m.focus_area && <Badge variant="outline" className="text-xs">{m.focus_area}</Badge>}
                <span className="text-xs text-gray-400">{FREQ_LABELS[m.meeting_frequency]}</span>
              </div>
              {m.goals && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{m.goals}</p>}
              {m.next_meeting_date && <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />Next: {m.next_meeting_date}</p>}
              {m.status === "active" && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: m.id, status: "paused" })}>Pause</Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: m.id, status: "completed" })}>Complete</Button>
                </div>
              )}
              {m.status === "paused" && <Button size="sm" variant="outline" className="text-xs mt-3" onClick={() => updateStatus.mutate({ id: m.id, status: "active" })}>Resume</Button>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 col-span-2 text-center py-12">No mentorships found.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Mentorship" : "New Mentorship"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mentor *</Label>
                <Input list="emp-list" value={form.mentor_name} onChange={e => setForm({ ...form, mentor_name: e.target.value })} />
              </div>
              <div><Label>Mentee *</Label>
                <Input list="emp-list" value={form.mentee_name} onChange={e => setForm({ ...form, mentee_name: e.target.value })} />
              </div>
            </div>
            <datalist id="emp-list">{employees.map(e => <option key={e.id} value={e.full_name} />)}</datalist>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Focus Area</Label><Input value={form.focus_area} onChange={e => setForm({ ...form, focus_area: e.target.value })} placeholder="e.g. Leadership" /></div>
              <div><Label>Meeting Frequency</Label>
                <Select value={form.meeting_frequency} onValueChange={v => setForm({ ...form, meeting_frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(FREQ_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label>Next Meeting</Label><Input type="date" value={form.next_meeting_date} onChange={e => setForm({ ...form, next_meeting_date: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["active","completed","paused","cancelled"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Goals</Label><Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={2} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={() => save.mutate(form)} disabled={!form.mentor_name || !form.mentee_name || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}