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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, Pencil, Trash2, Copy } from "lucide-react";

const CATEGORY_COLORS = { onboarding: "bg-green-100 text-green-700", offboarding: "bg-red-100 text-red-700", hiring: "bg-blue-100 text-blue-700", performance: "bg-purple-100 text-purple-700", benefits: "bg-yellow-100 text-yellow-700", general: "bg-gray-100 text-gray-700" };

const DEFAULTS = [
  { name: "Welcome Email", category: "onboarding", subject: "Welcome to the team, {{employee_name}}!", body: "Dear {{employee_name}},\n\nWe're thrilled to have you join us on {{start_date}}. Please find your onboarding details below.\n\nBest regards,\nHR Team", variables: ["employee_name", "start_date"] },
  { name: "Offer Letter", category: "hiring", subject: "Job Offer – {{job_title}} at {{company_name}}", body: "Dear {{candidate_name}},\n\nWe are pleased to offer you the position of {{job_title}}...\n\nBest regards,\nHR Team", variables: ["candidate_name", "job_title", "company_name"] },
  { name: "Offboarding Notice", category: "offboarding", subject: "Important: Your Offboarding Process", body: "Dear {{employee_name}},\n\nAs your last day approaches on {{last_day}}, here's what to expect...\n\nThank you for your contributions.\nHR Team", variables: ["employee_name", "last_day"] },
];

export default function HRISEmailTemplates() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "general", subject: "", body: "" });

  const { data: templates = [] } = useQuery({ queryKey: ["hris-email-templates"], queryFn: () => base44.entities.HRISEmailTemplate.list() });

  const save = useMutation({ mutationFn: (d) => editing ? base44.entities.HRISEmailTemplate.update(editing.id, d) : base44.entities.HRISEmailTemplate.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-email-templates"] }); setShowDialog(false); setEditing(null); } });
  const remove = useMutation({ mutationFn: (id) => base44.entities.HRISEmailTemplate.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-email-templates"] }) });

  const openNew = () => { setEditing(null); setForm({ name: "", category: "general", subject: "", body: "" }); setShowDialog(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name || "", category: t.category || "general", subject: t.subject || "", body: t.body || "" }); setShowDialog(true); };
  const duplicate = (t) => save.mutate({ name: `${t.name} (Copy)`, category: t.category, subject: t.subject, body: t.body });
  const loadDefault = (d) => { setForm({ name: d.name, category: d.category, subject: d.subject, body: d.body }); };

  const filtered = templates.filter(t => {
    const matchSearch = t.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">{templates.length} templates</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Template</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["onboarding","offboarding","hiring","performance","benefits","general"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {templates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Start with a default template:</p>
            <div className="flex gap-2 flex-wrap">
              {DEFAULTS.map(d => <Button key={d.name} variant="outline" size="sm" onClick={() => { loadDefault(d); setShowDialog(true); }}>{d.name}</Button>)}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(t)}><Copy className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={`${CATEGORY_COLORS[t.category]} text-xs mb-2`}>{t.category}</Badge>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{t.subject}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.body}</p>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && templates.length > 0 && <p className="text-gray-400 col-span-3 text-center py-10">No templates match your search.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Email Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Template Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["onboarding","offboarding","hiring","performance","benefits","general"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Use {{variable}} for dynamic fields" /></div>
            <div><Label>Body *</Label><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={10} placeholder="Use {{employee_name}}, {{start_date}}, etc." /></div>
            <p className="text-xs text-gray-400">Use double curly braces for variables: {'{{employee_name}}'}, {'{{start_date}}'}, etc.</p>
            <Button className="w-full" onClick={() => save.mutate(form)} disabled={!form.name || !form.subject || !form.body || save.isPending}>{save.isPending ? "Saving..." : "Save Template"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}