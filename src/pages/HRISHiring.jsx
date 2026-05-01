import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Briefcase, User, Star, ChevronRight } from "lucide-react";

const STAGE_COLORS = { applied: "bg-gray-100 text-gray-700", screening: "bg-blue-100 text-blue-700", interview: "bg-yellow-100 text-yellow-700", offer: "bg-purple-100 text-purple-700", hired: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };
const JOB_STATUS_COLORS = { draft: "bg-gray-100 text-gray-600", open: "bg-green-100 text-green-700", on_hold: "bg-yellow-100 text-yellow-700", closed: "bg-red-100 text-red-700", filled: "bg-blue-100 text-blue-700" };

export default function HRISHiring() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("postings");
  const [search, setSearch] = useState("");
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [jobForm, setJobForm] = useState({ title: "", department: "", location: "", employment_type: "full_time", status: "draft", description: "", requirements: "", salary_min: "", salary_max: "", hiring_manager_name: "" });
  const [candidateForm, setCandidateForm] = useState({ full_name: "", email: "", phone: "", job_title: "", stage: "applied", source: "linkedin", notes: "", rating: "" });

  const { data: jobs = [] } = useQuery({ queryKey: ["hris-jobs"], queryFn: () => base44.entities.HRISJobPosting.list("-created_date") });
  const { data: candidates = [] } = useQuery({ queryKey: ["hris-candidates"], queryFn: () => base44.entities.HRISCandidate.list("-created_date") });

  const saveJob = useMutation({ mutationFn: (d) => editingJob ? base44.entities.HRISJobPosting.update(editingJob.id, d) : base44.entities.HRISJobPosting.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-jobs"] }); setShowJobDialog(false); setEditingJob(null); } });
  const saveCandidate = useMutation({ mutationFn: (d) => editingCandidate ? base44.entities.HRISCandidate.update(editingCandidate.id, d) : base44.entities.HRISCandidate.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-candidates"] }); setShowCandidateDialog(false); setEditingCandidate(null); } });
  const updateCandidateStage = useMutation({ mutationFn: ({ id, stage }) => base44.entities.HRISCandidate.update(id, { stage }), onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-candidates"] }) });

  const filteredJobs = jobs.filter(j => j.title?.toLowerCase().includes(search.toLowerCase()));
  const filteredCandidates = candidates.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.job_title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hiring</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.filter(j => j.status === "open").length} open positions · {candidates.length} candidates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingCandidate(null); setCandidateForm({ full_name: "", email: "", phone: "", job_title: "", stage: "applied", source: "linkedin", notes: "", rating: "" }); setShowCandidateDialog(true); }}><Plus className="w-4 h-4 mr-1" />Candidate</Button>
          <Button onClick={() => { setEditingJob(null); setJobForm({ title: "", department: "", location: "", employment_type: "full_time", status: "draft", description: "", requirements: "", salary_min: "", salary_max: "", hiring_manager_name: "" }); setShowJobDialog(true); }}><Plus className="w-4 h-4 mr-1" />Job Posting</Button>
        </div>
      </div>

      <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="postings">Job Postings ({jobs.length})</TabsTrigger>
          <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="postings" className="space-y-3 mt-4">
          {filteredJobs.map(job => (
            <Card key={job.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setEditingJob(job); setJobForm({ title: job.title || "", department: job.department || "", location: job.location || "", employment_type: job.employment_type || "full_time", status: job.status || "draft", description: job.description || "", requirements: job.requirements || "", salary_min: job.salary_min || "", salary_max: job.salary_max || "", hiring_manager_name: job.hiring_manager_name || "" }); setShowJobDialog(true); }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.department} · {job.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={JOB_STATUS_COLORS[job.status]}>{job.status?.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline">{job.employment_type?.replace(/_/g, " ")}</Badge>
                  <p className="text-sm text-gray-500">{candidates.filter(c => c.job_title === job.title).length} applicants</p>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredJobs.length === 0 && <p className="text-center text-gray-400 py-10">No job postings yet.</p>}
        </TabsContent>

        <TabsContent value="candidates" className="space-y-3 mt-4">
          {filteredCandidates.map(c => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setEditingCandidate(c); setCandidateForm({ full_name: c.full_name || "", email: c.email || "", phone: c.phone || "", job_title: c.job_title || "", stage: c.stage || "applied", source: c.source || "linkedin", notes: c.notes || "", rating: c.rating || "" }); setShowCandidateDialog(true); }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">{c.full_name?.[0]}</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{c.full_name}</p>
                    <p className="text-sm text-gray-500">{c.job_title} · {c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.rating && <div className="flex items-center gap-0.5 text-amber-500"><Star className="w-4 h-4 fill-current" /><span className="text-sm font-medium">{c.rating}</span></div>}
                  <Badge className={STAGE_COLORS[c.stage]}>{c.stage}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredCandidates.length === 0 && <p className="text-center text-gray-400 py-10">No candidates yet.</p>}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {["applied", "screening", "interview", "offer", "hired", "rejected"].map(stage => (
              <div key={stage} className="space-y-2">
                <div className={`px-3 py-1.5 rounded-lg text-center text-xs font-semibold ${STAGE_COLORS[stage]}`}>{stage} ({candidates.filter(c => c.stage === stage).length})</div>
                {candidates.filter(c => c.stage === stage).map(c => (
                  <Card key={c.id} className="p-2 cursor-pointer hover:shadow-sm text-xs">
                    <p className="font-medium truncate">{c.full_name}</p>
                    <p className="text-gray-400 truncate">{c.job_title}</p>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingJob ? "Edit Job Posting" : "New Job Posting"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div><Label>Job Title *</Label><Input value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department</Label><Input value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={jobForm.employment_type} onValueChange={v => setJobForm({ ...jobForm, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["full_time","part_time","contractor","intern"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={jobForm.status} onValueChange={v => setJobForm({ ...jobForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","open","on_hold","closed","filled"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Salary Min</Label><Input type="number" value={jobForm.salary_min} onChange={e => setJobForm({ ...jobForm, salary_min: e.target.value })} /></div>
              <div><Label>Salary Max</Label><Input type="number" value={jobForm.salary_max} onChange={e => setJobForm({ ...jobForm, salary_max: e.target.value })} /></div>
            </div>
            <div><Label>Hiring Manager</Label><Input value={jobForm.hiring_manager_name} onChange={e => setJobForm({ ...jobForm, hiring_manager_name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} rows={3} /></div>
            <div><Label>Requirements</Label><Textarea value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} rows={3} /></div>
            <Button className="w-full" onClick={() => saveJob.mutate({ ...jobForm, salary_min: jobForm.salary_min ? Number(jobForm.salary_min) : undefined, salary_max: jobForm.salary_max ? Number(jobForm.salary_max) : undefined })} disabled={!jobForm.title || saveJob.isPending}>{saveJob.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Dialog */}
      <Dialog open={showCandidateDialog} onOpenChange={setShowCandidateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCandidate ? "Edit Candidate" : "New Candidate"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Name *</Label><Input value={candidateForm.full_name} onChange={e => setCandidateForm({ ...candidateForm, full_name: e.target.value })} /></div>
              <div><Label>Email *</Label><Input value={candidateForm.email} onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={candidateForm.phone} onChange={e => setCandidateForm({ ...candidateForm, phone: e.target.value })} /></div>
              <div><Label>Applying For</Label><Input value={candidateForm.job_title} onChange={e => setCandidateForm({ ...candidateForm, job_title: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Stage</Label>
                <Select value={candidateForm.stage} onValueChange={v => setCandidateForm({ ...candidateForm, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["applied","screening","interview","offer","hired","rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Source</Label>
                <Select value={candidateForm.source} onValueChange={v => setCandidateForm({ ...candidateForm, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["linkedin","indeed","referral","website","other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" value={candidateForm.rating} onChange={e => setCandidateForm({ ...candidateForm, rating: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={candidateForm.notes} onChange={e => setCandidateForm({ ...candidateForm, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={() => saveCandidate.mutate({ ...candidateForm, rating: candidateForm.rating ? Number(candidateForm.rating) : undefined })} disabled={!candidateForm.full_name || !candidateForm.email || saveCandidate.isPending}>{saveCandidate.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}