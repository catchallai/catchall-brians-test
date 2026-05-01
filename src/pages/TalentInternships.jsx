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
import { Plus, Pencil, Trash2, Star, GraduationCap, CheckCircle2 } from "lucide-react";

const STATUS_COLORS = { pending: "bg-gray-100 text-gray-600", active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", cancelled: "bg-red-100 text-red-600" };

export default function TalentInternships() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ intern_name: "", intern_email: "", department: "", supervisor_name: "", start_date: "", end_date: "", status: "pending", project: "", university: "", paid: false, stipend: "", offer_extended: false, offer_accepted: false, notes: "", performance_rating: "" });

  const { data: internships = [] } = useQuery({ queryKey: ["talent-internships"], queryFn: () => base44.entities.TalentInternship.list("-created_date") });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.TalentInternship.update(editing.id, d) : base44.entities.TalentInternship.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["talent-internships"] }); setShowDialog(false); setEditing(null); }
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.TalentInternship.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-internships"] }) });

  const openNew = () => { setEditing(null); setForm({ intern_name: "", intern_email: "", department: "", supervisor_name: "", start_date: "", end_date: "", status: "pending", project: "", university: "", paid: false, stipend: "", offer_extended: false, offer_accepted: false, notes: "", performance_rating: "" }); setShowDialog(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...i }); setShowDialog(true); };

  const filtered = internships.filter(i => {
    const ms = i.intern_name?.toLowerCase().includes(search.toLowerCase()) || i.department?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || i.status === statusFilter;
    return ms && mst;
  });

  const stats = { total: internships.length, active: internships.filter(i=>i.status==="active").length, offers: internships.filter(i=>i.offer_extended).length, converted: internships.filter(i=>i.offer_accepted).length };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Internships</h1><p className="text-sm text-gray-500 mt-1">{stats.active} active interns</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Intern</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ label: "Total", value: stats.total, color: "text-gray-700 dark:text-gray-200" }, { label: "Active", value: stats.active, color: "text-green-600" }, { label: "Offers Extended", value: stats.offers, color: "text-blue-600" }, { label: "Converted to FT", value: stats.converted, color: "text-purple-600" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search interns..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{["pending","active","completed","cancelled"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(intern => (
          <Card key={intern.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 font-semibold">{intern.intern_name?.[0]}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{intern.intern_name}</p>
                    <p className="text-xs text-gray-400">{intern.university || intern.intern_email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(intern)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove.mutate(intern.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge className={STATUS_COLORS[intern.status]}>{intern.status}</Badge>
                {intern.paid && <Badge className="bg-green-100 text-green-700">Paid</Badge>}
                {intern.offer_extended && <Badge className="bg-blue-100 text-blue-700">Offer Extended</Badge>}
                {intern.offer_accepted && <Badge className="bg-purple-100 text-purple-700">Hired</Badge>}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {intern.department && <p>🏢 {intern.department}</p>}
                {intern.supervisor_name && <p>👤 {intern.supervisor_name}</p>}
                {intern.project && <p>📋 {intern.project}</p>}
                {intern.start_date && <p>📅 {intern.start_date}{intern.end_date ? ` → ${intern.end_date}` : ""}</p>}
                {intern.stipend && <p>💰 ${Number(intern.stipend).toLocaleString()}</p>}
              </div>
              {intern.performance_rating && (
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= intern.performance_rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No internships found.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Internship" : "Add Intern"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Intern Name *</Label><Input value={form.intern_name} onChange={e => setForm({ ...form, intern_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.intern_email} onChange={e => setForm({ ...form, intern_email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>University</Label><Input value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} /></div>
            </div>
            <div><Label>Supervisor</Label>
              <Input list="sup-list" value={form.supervisor_name} onChange={e => setForm({ ...form, supervisor_name: e.target.value })} />
              <datalist id="sup-list">{employees.map(e => <option key={e.id} value={e.full_name} />)}</datalist>
            </div>
            <div><Label>Project</Label><Input value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pending","active","completed","cancelled"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Performance Rating (1-5)</Label><Input type="number" min="1" max="5" value={form.performance_rating} onChange={e => setForm({ ...form, performance_rating: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 mt-2"><input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} className="rounded" /><Label>Paid Internship</Label></div>
              {form.paid && <div><Label>Stipend ($)</Label><Input type="number" value={form.stipend} onChange={e => setForm({ ...form, stipend: e.target.value })} /></div>}
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.offer_extended} onChange={e => setForm({ ...form, offer_extended: e.target.checked })} className="rounded" /><Label>Offer Extended</Label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.offer_accepted} onChange={e => setForm({ ...form, offer_accepted: e.target.checked })} className="rounded" /><Label>Offer Accepted</Label></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={() => save.mutate({ ...form, stipend: form.stipend ? Number(form.stipend) : undefined, performance_rating: form.performance_rating ? Number(form.performance_rating) : undefined })} disabled={!form.intern_name || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}