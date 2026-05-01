import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, Users, Pencil, Trash2, DollarSign } from "lucide-react";

export default function HRISDepartments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", head_employee_name: "", location: "", budget: "", headcount_target: "", description: "" });

  const { data: departments = [] } = useQuery({ queryKey: ["hris-departments"], queryFn: () => base44.entities.HRISDepartment.list() });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.HRISDepartment.update(editing.id, d) : base44.entities.HRISDepartment.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-departments"] }); setShowDialog(false); setEditing(null); }
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.HRISDepartment.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-departments"] })
  });

  const openNew = () => { setEditing(null); setForm({ name: "", code: "", head_employee_name: "", location: "", budget: "", headcount_target: "", description: "" }); setShowDialog(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name || "", code: d.code || "", head_employee_name: d.head_employee_name || "", location: d.location || "", budget: d.budget || "", headcount_target: d.headcount_target || "", description: d.description || "" }); setShowDialog(true); };

  const filtered = departments.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));

  const getHeadcount = (deptName) => employees.filter(e => e.department === deptName && e.status === "active").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">{departments.length} departments</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Department</Button>
      </div>

      <Input placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(dept => (
          <Card key={dept.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                  {dept.code && <Badge variant="outline" className="text-xs mt-0.5">{dept.code}</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(dept)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove.mutate(dept.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dept.head_employee_name && <p className="text-sm text-gray-600 dark:text-gray-300">Head: <span className="font-medium">{dept.head_employee_name}</span></p>}
              {dept.location && <p className="text-sm text-gray-500">{dept.location}</p>}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />{getHeadcount(dept.name)} active
                </div>
                {dept.budget && <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4" />{Number(dept.budget).toLocaleString()}
                </div>}
              </div>
              {dept.description && <p className="text-xs text-gray-400 line-clamp-2">{dept.description}</p>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No departments found.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Department" : "New Department"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Code</Label><Input placeholder="e.g. ENG" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            </div>
            <div><Label>Department Head</Label><Input value={form.head_employee_name} onChange={e => setForm({ ...form, head_employee_name: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Budget ($)</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
              <div><Label>Headcount Target</Label><Input type="number" value={form.headcount_target} onChange={e => setForm({ ...form, headcount_target: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={() => save.mutate({ ...form, budget: form.budget ? Number(form.budget) : undefined, headcount_target: form.headcount_target ? Number(form.headcount_target) : undefined })} disabled={!form.name || save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}