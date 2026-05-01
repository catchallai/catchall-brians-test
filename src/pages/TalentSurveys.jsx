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
import { Plus, Pencil, Trash2, Eye, Send, BarChart2, MessageSquare, ToggleLeft } from "lucide-react";

const STATUS_COLORS = { draft: "bg-gray-100 text-gray-600", active: "bg-green-100 text-green-700", closed: "bg-red-100 text-red-600" };
const TYPE_COLORS = { engagement: "bg-blue-100 text-blue-700", pulse: "bg-purple-100 text-purple-700", exit: "bg-red-100 text-red-600", onboarding: "bg-green-100 text-green-700", performance: "bg-orange-100 text-orange-700", custom: "bg-gray-100 text-gray-600" };
const Q_TYPES = ["rating", "text", "yes_no", "multiple_choice"];

function QuestionBuilder({ questions, onChange }) {
  const [qForm, setQForm] = useState({ text: "", type: "rating", required: true, options: "" });

  const addQ = () => {
    if (!qForm.text.trim()) return;
    const newQ = { id: Date.now().toString(), text: qForm.text, type: qForm.type, required: qForm.required, options: qForm.type === "multiple_choice" ? qForm.options.split(",").map(s=>s.trim()).filter(Boolean) : [] };
    onChange([...questions, newQ]);
    setQForm({ text: "", type: "rating", required: true, options: "" });
  };

  const removeQ = (idx) => onChange(questions.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <Label>Questions</Label>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={q.id || i} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{i+1}. {q.text}</p>
              <p className="text-xs text-gray-400">{q.type.replace(/_/g," ")} {q.required ? "· required" : ""}</p>
            </div>
            <button onClick={() => removeQ(i)} className="text-red-400 hover:text-red-600 mt-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="border border-dashed rounded-lg p-3 space-y-2">
        <Input placeholder="Question text..." value={qForm.text} onChange={e => setQForm({ ...qForm, text: e.target.value })} />
        <div className="flex gap-2">
          <Select value={qForm.type} onValueChange={v => setQForm({ ...qForm, type: v })}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{Q_TYPES.map(t=><SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-1.5"><input type="checkbox" checked={qForm.required} onChange={e => setQForm({ ...qForm, required: e.target.checked })} /><span className="text-xs text-gray-500">Required</span></div>
        </div>
        {qForm.type === "multiple_choice" && <Input placeholder="Options (comma separated)" value={qForm.options} onChange={e => setQForm({ ...qForm, options: e.target.value })} />}
        <Button size="sm" variant="outline" onClick={addQ} disabled={!qForm.text.trim()}><Plus className="w-3.5 h-3.5 mr-1" />Add Question</Button>
      </div>
    </div>
  );
}

function SurveyResults({ survey }) {
  const responses = survey.responses || [];
  if (responses.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No responses yet.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{responses.length} response{responses.length !== 1 ? "s" : ""}</p>
      {(survey.questions || []).map((q, qi) => {
        const answers = responses.map(r => r.answers?.[q.id]).filter(Boolean);
        return (
          <div key={q.id || qi} className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{qi+1}. {q.text}</p>
            {q.type === "rating" && (
              <p className="text-sm text-gray-500">Avg: <span className="font-bold text-gray-800 dark:text-gray-100">{answers.length ? (answers.reduce((a,b)=>a+Number(b),0)/answers.length).toFixed(1) : "–"}</span> / 5</p>
            )}
            {q.type === "yes_no" && (
              <p className="text-sm text-gray-500">Yes: {answers.filter(a=>a==="yes").length} · No: {answers.filter(a=>a==="no").length}</p>
            )}
            {q.type === "text" && answers.slice(0,3).map((a,i) => <p key={i} className="text-xs text-gray-400 italic">"{a}"</p>)}
            {q.type === "multiple_choice" && (q.options || []).map(opt => (
              <div key={opt} className="flex items-center gap-2 text-xs">
                <div className="w-24 text-gray-500 truncate">{opt}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${answers.length ? answers.filter(a=>a===opt).length/answers.length*100 : 0}%` }} />
                </div>
                <span className="text-gray-400 w-6">{answers.filter(a=>a===opt).length}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function TalentSurveys() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showResults, setShowResults] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", type: "pulse", status: "draft", target_department: "", due_date: "", anonymous: true, questions: [] });

  const { data: surveys = [] } = useQuery({ queryKey: ["talent-surveys"], queryFn: () => base44.entities.TalentSurvey.list("-created_date") });

  const save = useMutation({
    mutationFn: (d) => editing ? base44.entities.TalentSurvey.update(editing.id, d) : base44.entities.TalentSurvey.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["talent-surveys"] }); setShowDialog(false); setEditing(null); }
  });
  const remove = useMutation({ mutationFn: (id) => base44.entities.TalentSurvey.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-surveys"] }) });
  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TalentSurvey.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talent-surveys"] })
  });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", type: "pulse", status: "draft", target_department: "", due_date: "", anonymous: true, questions: [] }); setShowDialog(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setShowDialog(true); };

  const filtered = surveys.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()));
  const stats = { total: surveys.length, active: surveys.filter(s=>s.status==="active").length, totalResponses: surveys.reduce((a,s)=>a+(s.responses||[]).length, 0) };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Surveys</h1><p className="text-sm text-gray-500 mt-1">Employee engagement & feedback</p></div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Survey</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Surveys", value: stats.total, color: "text-gray-700 dark:text-gray-200" }, { label: "Active", value: stats.active, color: "text-green-600" }, { label: "Total Responses", value: stats.totalResponses, color: "text-blue-600" }].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Input placeholder="Search surveys..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(survey => (
          <Card key={survey.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">{survey.title}</CardTitle>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <Badge className={STATUS_COLORS[survey.status]}>{survey.status}</Badge>
                    <Badge className={TYPE_COLORS[survey.type]}>{survey.type}</Badge>
                    {survey.anonymous && <Badge variant="outline" className="text-xs">Anonymous</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(survey)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove.mutate(survey.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {survey.description && <p className="text-xs text-gray-400 line-clamp-2">{survey.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span><MessageSquare className="w-3.5 h-3.5 inline mr-0.5" />{(survey.questions||[]).length} questions</span>
                <span><BarChart2 className="w-3.5 h-3.5 inline mr-0.5" />{(survey.responses||[]).length} responses</span>
                {survey.due_date && <span>Due: {survey.due_date}</span>}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowResults(survey)}><Eye className="w-3 h-3 mr-1" />Results</Button>
                {survey.status === "draft" && <Button size="sm" className="flex-1 text-xs bg-green-600 hover:bg-green-700" onClick={() => toggleStatus.mutate({ id: survey.id, status: "active" })}><Send className="w-3 h-3 mr-1" />Launch</Button>}
                {survey.status === "active" && <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => toggleStatus.mutate({ id: survey.id, status: "closed" })}><ToggleLeft className="w-3 h-3 mr-1" />Close</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No surveys yet.</p>}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Survey" : "New Survey"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["engagement","pulse","exit","onboarding","performance","custom"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","active","closed"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Target Department</Label><Input value={form.target_department} onChange={e => setForm({ ...form, target_department: e.target.value })} placeholder="Leave blank for all" /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.anonymous} onChange={e => setForm({ ...form, anonymous: e.target.checked })} className="rounded" /><Label>Anonymous responses</Label></div>
            <QuestionBuilder questions={form.questions || []} onChange={qs => setForm({ ...form, questions: qs })} />
            <Button className="w-full" onClick={() => save.mutate(form)} disabled={!form.title || save.isPending}>{save.isPending ? "Saving..." : "Save Survey"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!showResults} onOpenChange={() => setShowResults(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{showResults?.title} — Results</DialogTitle></DialogHeader>
          {showResults && <SurveyResults survey={showResults} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}