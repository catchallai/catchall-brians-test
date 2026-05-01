import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, ArrowRight, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";

const STATUS_COLORS = { active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", on_hold: "bg-yellow-100 text-yellow-600", cancelled: "bg-red-100 text-red-600" };

export default function TalentCareerPaths() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", department: "", current_role: "", target_role: "", employee_name: "", status: "active", target_date: "", progress: 0, required_skills: "", milestones: [] });
  const [newMilestone, setNewMilestone] = useState("");

  const { data: paths = [] } = useQuery({ queryKey: ["talent-career-paths"], queryFn: () => base44.entities.TalentCareerPath.list("-created_date") });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.TalentCareerPath.update(editing.id, d) : base44.entities.TalentCareerPath.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["talent-career-paths"] }); setShowDialog(false); setEditing(null); }
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.TalentCareerPath.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-career-paths"] }) });
  const toggleMilestone = useMutation({
    mutationFn: ({ path, idx }) => {
      const milestones = [...(path.milestones || [])];
      milestones[idx] = { ...milestones[idx], completed: !milestones[idx].completed };
      const progress = Math.round(milestones.filter(m => m.completed).length / milestones.length * 100);
      return base44.entities.TalentCareerPath.update(path.id, { milestones, progress });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-career-paths"] })
  });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", department: "", current_role: "", target_role: "", employee_name: "", status: "active", target_date: "", progress: 0, required_skills: "", milestones: [] }); setShowDialog(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p, required_skills: (p.required_skills || []).join(", ") }); setShowDialog(true); };

  const addMilestone = () => { if (!newMilestone.trim()) return; setForm(f => ({ ...f, milestones: [...(f.milestones || []), { title: newMilestone, completed: false }] })); setNewMilestone(""); };
  const removeMilestone = (idx) => setForm(f => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }));

  const filtered = paths.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.employee_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Career Paths</h1><p className="text-sm text-gray-500 mt-1">{paths.length} career paths defined</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Career Path</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ label: "Total", value: paths.length, color: "text-gray-700 dark:text-gray-200" }, { label: "Active", value: paths.filter(p=>p.status==="active").length, color: "text-green-600" }, { label: "Completed", value: paths.filter(p=>p.status==="completed").length, color: "text-blue-600" }, { label: "Avg Progress", value: paths.length ? Math.round(paths.reduce((a,p)=>a+(p.progress||0),0)/paths.length) + "%" : "–", color: "text-purple-600" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Input placeholder="Search by title or employee..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="space-y-4">
        {filtered.map(path => (
          <Card key={path.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{path.title}</h3>
                    <Badge className={STATUS_COLORS[path.status]}>{path.status?.replace(/_/g," ")}</Badge>
                  </div>
                  {path.employee_name && <p className="text-sm text-gray-500 mt-0.5">Employee: {path.employee_name}</p>}
                  {(path.current_role || path.target_role) && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {path.current_role && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{path.current_role}</span>}
                      {path.current_role && path.target_role && <ArrowRight className="w-4 h-4 text-gray-400" />}
                      {path.target_role && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{path.target_role}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(path)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove.mutate(path.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Progress value={path.progress || 0} className="flex-1 h-2" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-10 text-right">{path.progress || 0}%</span>
              </div>

              {path.description && <p className="text-sm text-gray-500 mb-3">{path.description}</p>}

              {(path.required_skills || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {path.required_skills.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              )}

              {(path.milestones || []).length > 0 && (
                <div>
                  <button className="text-xs font-medium text-gray-400 hover:text-gray-600 mb-2" onClick={() => setExpandedId(expandedId === path.id ? null : path.id)}>
                    {expandedId === path.id ? "▼" : "▶"} {(path.milestones || []).length} milestones · {(path.milestones || []).filter(m=>m.completed).length} done
                  </button>
                  {expandedId === path.id && (
                    <div className="space-y-1.5 mt-1">
                      {(path.milestones || []).map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <button onClick={() => toggleMilestone.mutate({ path, idx: i })}>
                            {m.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                          </button>
                          <span className={m.completed ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200"}>{m.title}</span>
                          {m.target_date && <span className="text-xs text-gray-400 ml-auto">{m.target_date}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No career paths yet.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Career Path" : "New Career Path"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Employee</Label>
              <Input list="emp-list" value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} />
              <datalist id="emp-list">{employees.map(e => <option key={e.id} value={e.full_name} />)}</datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Current Role</Label><Input value={form.current_role} onChange={e => setForm({ ...form, current_role: e.target.value })} /></div>
              <div><Label>Target Role</Label><Input value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["active","completed","on_hold","cancelled"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Target Date</Label><Input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></div>
              <div><Label>Progress %</Label><Input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Required Skills (comma separated)</Label><Input value={form.required_skills} onChange={e => setForm({ ...form, required_skills: e.target.value })} placeholder="e.g. Python, Leadership, SQL" /></div>
            <div>
              <Label>Milestones</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="Milestone title" onKeyDown={e => e.key === "Enter" && addMilestone()} />
                <Button type="button" variant="outline" onClick={addMilestone}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-1 mt-2">
                {(form.milestones || []).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded">
                    <span className="flex-1">{m.title}</span>
                    <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => save.mutate({ ...form, required_skills: form.required_skills ? form.required_skills.split(",").map(s=>s.trim()).filter(Boolean) : [], progress: Number(form.progress) })} disabled={!form.title || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}