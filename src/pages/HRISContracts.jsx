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
import { Plus, FileText, Upload, Download, Pencil, Trash2, Shield } from "lucide-react";

const STATUS_COLORS = { draft: "bg-gray-100 text-gray-600", pending_signature: "bg-yellow-100 text-yellow-700", signed: "bg-green-100 text-green-700", expired: "bg-red-100 text-red-700", cancelled: "bg-red-100 text-red-600" };
const TYPE_LABELS = { employment: "Employment", nda: "NDA", non_compete: "Non-Compete", contractor: "Contractor", amendment: "Amendment", other: "Other" };

export default function HRISContracts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ employee_name: "", title: "", type: "employment", status: "draft", start_date: "", end_date: "", notes: "", file_url: "", is_sensitive: true });

  const { data: contracts = [] } = useQuery({ queryKey: ["hris-contracts"], queryFn: () => base44.entities.HRISContract.list("-created_date") });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const save = useMutation({ mutationFn: (d) => editing ? base44.entities.HRISContract.update(editing.id, d) : base44.entities.HRISContract.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-contracts"] }); setShowDialog(false); setEditing(null); } });
  const remove = useMutation({ mutationFn: (id) => base44.entities.HRISContract.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-contracts"] }) });
  const updateStatus = useMutation({ mutationFn: ({ id, status }) => base44.entities.HRISContract.update(id, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-contracts"] }) });

  const openNew = () => { setEditing(null); setForm({ employee_name: "", title: "", type: "employment", status: "draft", start_date: "", end_date: "", notes: "", file_url: "", is_sensitive: true }); setShowDialog(true); };
  const openEdit = (c) => { setEditing(c); setForm({ employee_name: c.employee_name || "", title: c.title || "", type: c.type || "employment", status: c.status || "draft", start_date: c.start_date || "", end_date: c.end_date || "", notes: c.notes || "", file_url: c.file_url || "", is_sensitive: c.is_sensitive ?? true }); setShowDialog(true); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const filtered = contracts.filter(c => {
    const matchSearch = c.employee_name?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const stats = { total: contracts.length, pending: contracts.filter(c => c.status === "pending_signature").length, signed: contracts.filter(c => c.status === "signed").length, expiring: contracts.filter(c => c.end_date && new Date(c.end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && c.status === "signed").length };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">{contracts.length} contracts</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Contract</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-700" },
          { label: "Pending Signature", value: stats.pending, color: "bg-yellow-100 text-yellow-700" },
          { label: "Signed", value: stats.signed, color: "bg-green-100 text-green-700" },
          { label: "Expiring Soon", value: stats.expiring, color: "bg-red-100 text-red-700" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search by employee or title..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem>{Object.entries(TYPE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{["draft","pending_signature","signed","expired","cancelled"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{c.title}</p>
                    {c.is_sensitive && <Shield className="w-3.5 h-3.5 text-amber-500" title="Sensitive" />}
                  </div>
                  <p className="text-sm text-gray-500">{c.employee_name} · {TYPE_LABELS[c.type] || c.type}</p>
                  {c.start_date && <p className="text-xs text-gray-400">{c.start_date}{c.end_date ? ` → ${c.end_date}` : ""}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[c.status]}>{c.status?.replace(/_/g," ")}</Badge>
                {c.file_url && <a href={c.file_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button></a>}
                {c.status === "pending_signature" && <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => updateStatus.mutate({ id: c.id, status: "signed" })}>Mark Signed</Button>}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No contracts found.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Contract" : "New Contract"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employee Name *</Label>
              <Input list="emp-list" value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} />
              <datalist id="emp-list">{employees.map(e => <option key={e.id} value={e.full_name} />)}</datalist>
            </div>
            <div><Label>Contract Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","pending_signature","signed","expired","cancelled"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Upload Contract File</Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
              {form.file_url && <p className="text-xs text-green-600 mt-1">✓ File uploaded</p>}
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={() => save.mutate(form)} disabled={!form.employee_name || !form.title || save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}