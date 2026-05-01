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
import { Plus, CheckCircle2, Circle, Clock, Users, ChevronDown, ChevronRight } from "lucide-react";

const STATUS_COLORS = { pending: "bg-gray-100 text-gray-600", in_progress: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", skipped: "bg-yellow-100 text-yellow-600" };
const CATEGORY_ICONS = { paperwork: "📄", it_setup: "💻", training: "🎓", access: "🔑", introduction: "🤝", equipment: "🖥️", other: "📌" };

const DEFAULT_TASKS = [
  { task: "Complete I-9 and W-4 forms", category: "paperwork", order: 1 },
  { task: "Set up company email account", category: "it_setup", order: 2 },
  { task: "Assign laptop and equipment", category: "equipment", order: 3 },
  { task: "Grant system access", category: "access", order: 4 },
  { task: "HR policy orientation", category: "training", order: 5 },
  { task: "Meet with manager", category: "introduction", order: 6 },
  { task: "Team introductions", category: "introduction", order: 7 },
];

export default function HRISOnboarding() {
  const qc = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ task: "", category: "other", assigned_to_name: "", due_date: "", notes: "" });

  const { data: tasks = [] } = useQuery({ queryKey: ["hris-onboarding-tasks"], queryFn: () => base44.entities.HRISOnboardingTask.filter({ type: "onboarding" }) });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const newEmployees = employees.filter(e => e.status === "onboarding" || (e.start_date && new Date(e.start_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

  const save = useMutation({ mutationFn: (d) => base44.entities.HRISOnboardingTask.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-onboarding-tasks"] }); setShowDialog(false); } });
  const updateStatus = useMutation({ mutationFn: ({ id, status }) => base44.entities.HRISOnboardingTask.update(id, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-onboarding-tasks"] }) });

  const seedTasks = async (emp) => {
    for (const t of DEFAULT_TASKS) {
      await base44.entities.HRISOnboardingTask.create({ ...t, type: "onboarding", employee_id: emp.id, employee_name: emp.full_name, status: "pending" });
    }
    qc.invalidateQueries({ queryKey: ["hris-onboarding-tasks"] });
  };

  const employeeTasks = (empId) => tasks.filter(t => t.employee_id === empId);
  const completionPct = (empId) => { const t = employeeTasks(empId); return t.length ? Math.round(t.filter(x => x.status === "completed").length / t.length * 100) : 0; };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">{newEmployees.length} employees onboarding</p>
        </div>
      </div>

      {newEmployees.length === 0 && (
        <Card className="border-dashed text-center py-12">
          <p className="text-gray-400">No employees currently onboarding. Employees with "onboarding" status or recent start dates will appear here.</p>
        </Card>
      )}

      <div className="space-y-4">
        {newEmployees.map(emp => {
          const empTasks = employeeTasks(emp.id);
          const pct = completionPct(emp.id);
          const isSelected = selectedEmployee === emp.id;
          return (
            <Card key={emp.id}>
              <CardHeader className="cursor-pointer" onClick={() => setSelectedEmployee(isSelected ? null : emp.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-700 font-medium">{emp.full_name?.[0]}</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{emp.full_name}</p>
                      <p className="text-sm text-gray-500">{emp.job_title} · {emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{pct}% complete</p>
                      <div className="w-32 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {empTasks.length === 0 && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); seedTasks(emp); }}>Load Default Tasks</Button>}
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp.id); setForm({ task: "", category: "other", assigned_to_name: "", due_date: "", notes: "", employee_id: emp.id, employee_name: emp.full_name }); setShowDialog(true); }}><Plus className="w-4 h-4" /></Button>
                    {isSelected ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </CardHeader>
              {isSelected && empTasks.length > 0 && (
                <CardContent className="pt-0 space-y-2">
                  {empTasks.sort((a, b) => (a.order || 0) - (b.order || 0)).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <button onClick={() => updateStatus.mutate({ id: task.id, status: task.status === "completed" ? "pending" : "completed" })}>
                        {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
                      </button>
                      <span className="text-sm mr-1">{CATEGORY_ICONS[task.category] || "📌"}</span>
                      <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200"}`}>{task.task}</span>
                      {task.assigned_to_name && <span className="text-xs text-gray-400">→ {task.assigned_to_name}</span>}
                      <Badge className={`${STATUS_COLORS[task.status]} text-xs`}>{task.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Onboarding Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Task *</Label><Input value={form.task} onChange={e => setForm({ ...form, task: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["paperwork","it_setup","training","access","introduction","equipment","other"].map(c => <SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Assigned To</Label><Input value={form.assigned_to_name} onChange={e => setForm({ ...form, assigned_to_name: e.target.value })} /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={() => save.mutate({ ...form, type: "onboarding", status: "pending" })} disabled={!form.task || save.isPending}>{save.isPending ? "Saving..." : "Add Task"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}