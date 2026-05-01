import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Upload, Search, Trash2, Download, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const DOC_TYPE_LABELS = {
  contract: "Contract",
  offer_letter: "Offer Letter",
  performance_review: "Performance Review",
  feedback: "Feedback",
  tax_form: "Tax Form",
  handbook_ack: "Handbook Acknowledgment",
  nda: "NDA",
  other: "Other",
};

export default function HRISDocuments() {
  const [search, setSearch] = useState("");
  const [empFilter, setEmpFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploadDialog, setUploadDialog] = useState(false);
  const [form, setForm] = useState({ is_sensitive: true });
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["hris-documents"],
    queryFn: () => base44.entities.HRISEmployeeDocument.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const createDoc = useMutation({
    mutationFn: (data) => base44.entities.HRISEmployeeDocument.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-documents"] }); setUploadDialog(false); setForm({ is_sensitive: true }); setFile(null); toast.success("Document uploaded"); },
  });

  const deleteDoc = useMutation({
    mutationFn: (id) => base44.entities.HRISEmployeeDocument.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-documents"] }); toast.success("Document deleted"); },
  });

  const handleUpload = async () => {
    if (!form.employee_id || !form.document_type) { toast.error("Employee and document type required"); return; }
    if (!file) { toast.error("Please select a file"); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const emp = employees.find(e => e.id === form.employee_id);
    createDoc.mutate({
      ...form,
      employee_name: emp?.full_name,
      file_name: file.name,
      file_url,
      file_size: file.size,
      uploaded_by: emp?.email,
    });
    setUploading(false);
  };

  const filtered = documents.filter(doc => {
    const q = search.toLowerCase();
    const matchSearch = !q || doc.file_name?.toLowerCase().includes(q) || doc.employee_name?.toLowerCase().includes(q);
    const matchEmp = empFilter === "all" || doc.employee_id === empFilter;
    const matchType = typeFilter === "all" || doc.document_type === typeFilter;
    return matchSearch && matchEmp && matchType;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{documents.length} total documents</p>
        </div>
        <Button onClick={() => setUploadDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Employee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents found</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setUploadDialog(true)}>Upload First Document</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                      {doc.is_sensitive && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-gray-500">{doc.employee_name}</p>
                      <span className="text-gray-300">·</span>
                      <Badge variant="outline" className="text-xs">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</Badge>
                      {doc.created_date && (
                        <>
                          <span className="text-gray-300">·</span>
                          <p className="text-xs text-gray-400">{format(parseISO(doc.created_date), "MMM d, yyyy")}</p>
                        </>
                      )}
                    </div>
                    {doc.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{doc.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"><Download className="w-3.5 h-3.5" />View</Button>
                  </a>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => deleteDoc.mutate(doc.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employee_id || ""} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Type *</Label>
              <Select value={form.document_type || ""} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>File *</Label>
              <Input className="mt-1" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialog(false); setForm({ is_sensitive: true }); setFile(null); }}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleUpload} disabled={uploading || createDoc.isPending}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}