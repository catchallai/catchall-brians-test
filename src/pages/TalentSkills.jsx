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
import { Plus, Pencil, Trash2, Zap, Star } from "lucide-react";

const CAT_COLORS = { technical: "bg-blue-100 text-blue-700", soft_skills: "bg-green-100 text-green-700", leadership: "bg-purple-100 text-purple-700", domain: "bg-orange-100 text-orange-700", tool: "bg-cyan-100 text-cyan-700", language: "bg-yellow-100 text-yellow-700", certification: "bg-pink-100 text-pink-700", other: "bg-gray-100 text-gray-600" };
const CATEGORIES = ["technical","soft_skills","leadership","domain","tool","language","certification","other"];

export default function TalentSkills() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "technical", description: "", is_critical: false, departments: "" });

  const { data: skills = [] } = useQuery({ queryKey: ["talent-skills"], queryFn: () => base44.entities.TalentSkill.list() });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.TalentSkill.update(editing.id, d) : base44.entities.TalentSkill.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["talent-skills"] }); setShowDialog(false); setEditing(null); }
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.TalentSkill.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-skills"] }) });

  const openNew = () => { setEditing(null); setForm({ name: "", category: "technical", description: "", is_critical: false, departments: "" }); setShowDialog(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, departments: (s.departments || []).join(", ") }); setShowDialog(true); };

  const filtered = skills.filter(s => {
    const ms = s.name?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === "all" || s.category === catFilter;
    return ms && mc;
  });

  // Employee skill coverage
  const getEmployeeCount = (skillName) => employees.filter(e => (e.skills || []).includes(skillName)).length;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catSkills = filtered.filter(s => s.category === cat);
    if (catSkills.length) acc[cat] = catSkills;
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Skills</h1><p className="text-sm text-gray-500 mt-1">{skills.length} skills in catalog · {skills.filter(s=>s.is_critical).length} critical</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Skill</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATEGORIES.slice(0,4).map(cat => (
          <Card key={cat} className="cursor-pointer hover:shadow-sm" onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{skills.filter(s=>s.category===cat).length}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{cat.replace(/_/g," ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {Object.entries(grouped).map(([cat, catSkills]) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Badge className={CAT_COLORS[cat]}>{cat.replace(/_/g," ")}</Badge>
            <span>{catSkills.length} skills</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catSkills.map(skill => (
              <Card key={skill.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {skill.is_critical && <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" title="Critical skill" />}
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{skill.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(skill)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => remove.mutate(skill.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {skill.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{skill.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{getEmployeeCount(skill.name)} employees</span>
                    {(skill.departments || []).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {skill.departments.slice(0,2).map((d,i) => <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{d}</span>)}
                        {skill.departments.length > 2 && <span className="text-xs text-gray-400">+{skill.departments.length-2}</span>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No skills found.</p>}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Skill" : "Add Skill"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Skill Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Departments (comma separated)</Label><Input value={form.departments} onChange={e => setForm({ ...form, departments: e.target.value })} placeholder="e.g. Engineering, Product" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_critical} onChange={e => setForm({ ...form, is_critical: e.target.checked })} className="rounded" /><Label>Critical / High-priority skill</Label></div>
            <Button className="w-full" onClick={() => save.mutate({ ...form, departments: form.departments ? form.departments.split(",").map(s=>s.trim()).filter(Boolean) : [] })} disabled={!form.name || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}