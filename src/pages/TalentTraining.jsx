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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, BookOpen, Users, Clock, Link, Pencil, Trash2, CheckCircle2 } from "lucide-react";

const STATUS_COLORS = { draft: "bg-gray-100 text-gray-600", scheduled: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", completed: "bg-purple-100 text-purple-700", cancelled: "bg-red-100 text-red-600" };
const FORMAT_ICONS = { in_person: "🏢", online: "💻", hybrid: "🔀", self_paced: "📖" };

export default function TalentTraining() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", category: "other", format: "online", status: "draft", instructor: "", start_date: "", end_date: "", duration_hours: "", max_participants: "", department: "", required: false, url: "" });

  const { data: trainings = [] } = useQuery({ queryKey: ["talent-trainings"], queryFn: () => base44.entities.TalentTraining.list("-created_date") });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.TalentTraining.update(editing.id, d) : base44.entities.TalentTraining.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["talent-trainings"] }); setShowDialog(false); setEditing(null); }
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.TalentTraining.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-trainings"] }) });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", category: "other", format: "online", status: "draft", instructor: "", start_date: "", end_date: "", duration_hours: "", max_participants: "", department: "", required: false, url: "" }); setShowDialog(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setShowDialog(true); };

  const filtered = trainings.filter(t => {
    const ms = t.title?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === "all" || t.category === catFilter;
    return ms && mc;
  });

  const stats = { total: trainings.length, active: trainings.filter(t => t.status === "active").length, required: trainings.filter(t => t.required).length, completed: trainings.filter(t => t.status === "completed").length };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training</h1><p className="text-sm text-gray-500 mt-1">Learning & development programs</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Training</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ label: "Total Programs", value: stats.total, color: "text-gray-700 dark:text-gray-200" }, { label: "Active", value: stats.active, color: "text-green-600" }, { label: "Required", value: stats.required, color: "text-blue-600" }, { label: "Completed", value: stats.completed, color: "text-purple-600" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search trainings..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{["technical","soft_skills","compliance","leadership","onboarding","other"].map(c => <SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{FORMAT_ICONS[t.format] || "📚"}</span>
                    <CardTitle className="text-sm font-semibold leading-tight">{t.title}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge>
                    {t.required && <Badge className="bg-orange-100 text-orange-700">Required</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {t.description && <p className="text-xs text-gray-400 line-clamp-2">{t.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {t.instructor && <span>👤 {t.instructor}</span>}
                {t.duration_hours && <span><Clock className="w-3 h-3 inline mr-0.5" />{t.duration_hours}h</span>}
                {t.department && <span>🏢 {t.department}</span>}
              </div>
              {t.start_date && <p className="text-xs text-gray-400">{t.start_date}{t.end_date ? ` → ${t.end_date}` : ""}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />{(t.enrolled_employee_ids || []).length} enrolled · {(t.completed_employee_ids || []).length} completed
                {t.max_participants && <span>/ {t.max_participants} max</span>}
              </div>
              {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 flex items-center gap-1"><Link className="w-3 h-3" />Access Training</a>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No training programs found.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Training" : "Add Training Program"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["technical","soft_skills","compliance","leadership","onboarding","other"].map(c => <SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Format</Label>
                <Select value={form.format} onValueChange={v => setForm({ ...form, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["in_person","online","hybrid","self_paced"].map(f => <SelectItem key={f} value={f}>{f.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","scheduled","active","completed","cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Instructor</Label><Input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (hours)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: e.target.value })} /></div>
              <div><Label>Max Participants</Label><Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} /></div>
            </div>
            <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Training URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="required" checked={form.required} onChange={e => setForm({ ...form, required: e.target.checked })} className="rounded" /><Label htmlFor="required">Required training</Label></div>
            <Button className="w-full" onClick={() => save.mutate({ ...form, duration_hours: form.duration_hours ? Number(form.duration_hours) : undefined, max_participants: form.max_participants ? Number(form.max_participants) : undefined })} disabled={!form.title || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}