import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
  Pencil, Trash2, LogOut, AlertCircle, SkipForward
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

const STATUS_CYCLE = { pending: "in_progress", in_progress: "completed", completed: "pending" };
const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  skipped: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300",
};
const CATEGORY_ICONS = { paperwork: "📄", it_setup: "💻", training: "🎓", access: "🔑", introduction: "🤝", equipment: "🖥️", other: "📌" };
const CATEGORIES = ["paperwork", "it_setup", "training", "access", "introduction", "equipment", "other"];

const DEFAULT_OFFBOARDING = [
  { task: "Collect company laptop and devices", category: "equipment", order: 1 },
  { task: "Collect ID badge and keys", category: "equipment", order: 2 },
  { task: "Revoke email and system access", category: "access", order: 3 },
  { task: "Remove from all software/SaaS tools", category: "access", order: 4 },
  { task: "Conduct exit interview", category: "introduction", order: 5 },
  { task: "Final payroll processing", category: "paperwork", order: 6 },
  { task: "Benefits termination / COBRA notice", category: "paperwork", order: 7 },
  { task: "Knowledge transfer / handover documentation", category: "training", order: 8 },
  { task: "Notify relevant departments", category: "other", order: 9 },
  { task: "Reference letter (if applicable)", category: "paperwork", order: 10 },
];

function StatusIcon({ status }) {
  if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
  if (status === "in_progress") return <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  if (status === "skipped") return <SkipForward className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
  return <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />;
}

export default function HRISOffboarding() {
  const qc = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [empSearch, setEmpSearch] = useState("");
  const [taskForm, setTaskForm] = useState({ task: "", category: "other", assigned_to_name: "", due_date: "", notes: "", employee_id: "", employee_name: "" });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({ queryKey: ["hris-offboarding-tasks"], queryFn: () => base44.entities.HRISOnboardingTask.filter({ type: "offboarding" }) });
  const { data: employees = [] } = useQuery({ queryKey: ["hris-employees"], queryFn: () => base44.entities.HRISEmployee.list() });

  const activeEmpIds = [...new Set(tasks.map(t => t.employee_id))];
  const offboardingEmployees = employees.filter(e => activeEmpIds.includes(e.id) || e.status === "terminated");

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const overdueTasks = tasks.filter(t => t.due_date && t.status !== "completed" && isPast(parseISO(t.due_date))).length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;

  const saveTask = useMutation({
    mutationFn: (d) => editingTask ? base44.entities.HRISOnboardingTask.update(editingTask.id, d) : base44.entities.HRISOnboardingTask.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hris-offboarding-tasks"] }); setShowTaskDialog(false); setEditingTask(null); }
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.HRISOnboardingTask.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-offboarding-tasks"] })
  });
  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.HRISOnboardingTask.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hris-offboarding-tasks"] })
  });

  const seedTasks = async (emp) => {
    for (const t of DEFAULT_OFFBOARDING) {
      await base44.entities.HRISOnboardingTask.create({ ...t, type: "offboarding", employee_id: emp.id, employee_name: emp.full_name, status: "pending" });
    }
    qc.invalidateQueries({ queryKey: ["hris-offboarding-tasks"] });
    setSelectedEmployee(emp.id);
    setShowStartDialog(false);
  };

  const openAddTask = (emp) => {
    setEditingTask(null);
    setTaskForm({ task: "", category: "other", assigned_to_name: "", due_date: "", notes: "", employee_id: emp.id, employee_name: emp.full_name });
    setShowTaskDialog(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({ task: task.task || "", category: task.category || "other", assigned_to_name: task.assigned_to_name || "", due_date: task.due_date || "", notes: task.notes || "", status: task.status || "pending", employee_id: task.employee_id, employee_name: task.employee_name });
    setShowTaskDialog(true);
  };

  const employeeTasks = (empId) => tasks.filter(t => t.employee_id === empId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const completionPct = (empId) => { const t = employeeTasks(empId); return t.length ? Math.round(t.filter(x => x.status === "completed").length / t.length * 100) : 0; };

  const filteredEmps = employees.filter(e => e.full_name?.toLowerCase().includes(empSearch.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offboarding</h1>
          <p className="text-sm text-gray-500 mt-1">{offboardingEmployees.length} employees offboarding</p>
        </div>
        <Button onClick={() => { setEmpSearch(""); setShowStartDialog(true); }}>
          <LogOut className="w-4 h-4 mr-2" />Start Offboarding
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: totalTasks, color: "text-gray-700 dark:text-gray-200" },
          { label: "Completed", value: completedTasks, color: "text-green-600" },
          { label: "In Progress", value: inProgressTasks, color: "text-blue-600" },
          { label: "Overdue", value: overdueTasks, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {/* Empty state */}
      {!tasksLoading && offboardingEmployees.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <LogOut className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-gray-500 font-medium">No active offboarding processes</p>
            <p className="text-sm text-gray-400">Click "Start Offboarding" to begin a departing employee's checklist.</p>
            <Button onClick={() => { setEmpSearch(""); setShowStartDialog(true); }} className="mt-2"><LogOut className="w-4 h-4 mr-2" />Start Offboarding</Button>
          </CardContent>
        </Card>
      )}

      {/* Employee Cards */}
      <div className="space-y-4">
        {offboardingEmployees.map(emp => {
          const empTasks = employeeTasks(emp.id);
          const pct = completionPct(emp.id);
          const isExpanded = selectedEmployee === emp.id;
          const empOverdue = empTasks.filter(t => t.due_date && t.status !== "completed" && isPast(parseISO(t.due_date))).length;

          return (
            <Card key={emp.id} className="overflow-hidden">
              <CardHeader className="cursor-pointer pb-3" onClick={() => setSelectedEmployee(isExpanded ? null : emp.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-700 dark:text-red-300 font-semibold text-sm">
                      {emp.full_name?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{emp.full_name}</p>
                        {empOverdue > 0 && <Badge className="bg-red-100 text-red-600 text-xs"><AlertCircle className="w-3 h-3 mr-1 inline" />{empOverdue} overdue</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{emp.job_title}{emp.department ? ` · ${emp.department}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{pct}%</p>
                      <div className="w-32 h-2 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {empTasks.length === 0 && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); seedTasks(emp); }}>
                        Load Default Tasks
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openAddTask(emp); }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                {/* Mobile progress */}
                <div className="sm:hidden mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{pct}% complete</span><span>{empTasks.filter(t=>t.status==="completed").length}/{empTasks.length} tasks</span></div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-4">
                  {empTasks.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-sm text-gray-400">No tasks yet.</p>
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => seedTasks(emp)}>Load Default Tasks</Button>
                        <Button size="sm" onClick={() => openAddTask(emp)}><Plus className="w-4 h-4 mr-1" />Add Task</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {CATEGORIES.map(cat => {
                        const catTasks = empTasks.filter(t => t.category === cat);
                        if (!catTasks.length) return null;
                        return (
                          <div key={cat}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1.5 px-1">
                              {CATEGORY_ICONS[cat]} {cat.replace(/_/g, " ")}
                            </p>
                            {catTasks.map(task => {
                              const isOverdue = task.due_date && task.status !== "completed" && isPast(parseISO(task.due_date));
                              return (
                                <div key={task.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                  <button
                                    className="flex-shrink-0"
                                    title={`Click to mark as ${STATUS_CYCLE[task.status] || "pending"}`}
                                    onClick={() => updateStatus.mutate({ id: task.id, status: STATUS_CYCLE[task.status] || "pending" })}
                                  >
                                    <StatusIcon status={task.status} />
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-sm ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200"}`}>{task.task}</span>
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                      {task.assigned_to_name && <span className="text-xs text-gray-400">→ {task.assigned_to_name}</span>}
                                      {task.due_date && (
                                        <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                          {isOverdue ? "⚠ " : ""}Due {format(parseISO(task.due_date), "MMM d")}
                                        </span>
                                      )}
                                      {task.notes && <span className="text-xs text-gray-400 italic truncate max-w-[200px]">{task.notes}</span>}
                                    </div>
                                  </div>
                                  <Badge className={`${STATUS_COLORS[task.status]} text-xs flex-shrink-0`}>{task.status.replace(/_/g, " ")}</Badge>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button onClick={() => updateStatus.mutate({ id: task.id, status: "skipped" })} title="Skip task" className="p-1 hover:bg-yellow-100 rounded"><SkipForward className="w-3.5 h-3.5 text-yellow-500" /></button>
                                    <button onClick={() => openEditTask(task)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                                    <button onClick={() => deleteTask.mutate(task.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-3">
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => openAddTask(emp)}><Plus className="w-3.5 h-3.5 mr-1" />Add Task</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Start Offboarding Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start Offboarding — Select Employee</DialogTitle></DialogHeader>
          <Input placeholder="Search employees..." value={empSearch} onChange={e => setEmpSearch(e.target.value)} autoFocus />
          <div className="max-h-72 overflow-y-auto space-y-1 mt-2">
            {filteredEmps.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No employees found.</p>}
            {filteredEmps.map(emp => (
              <button key={emp.id} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors" onClick={() => seedTasks(emp)}>
                <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-700 font-medium text-sm">{emp.full_name?.[0]}</div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.full_name}</p>
                  <p className="text-xs text-gray-400">{emp.job_title}{emp.department ? ` · ${emp.department}` : ""}</p>
                </div>
                <Badge className="ml-auto text-xs" variant="outline">{emp.status}</Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={(v) => { setShowTaskDialog(v); if (!v) setEditingTask(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add Offboarding Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Task *</Label><Input value={taskForm.task} onChange={e => setTaskForm({ ...taskForm, task: e.target.value })} placeholder="e.g. Collect company equipment" /></div>
            <div><Label>Category</Label>
              <Select value={taskForm.category} onValueChange={v => setTaskForm({ ...taskForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Assigned To</Label><Input value={taskForm.assigned_to_name} onChange={e => setTaskForm({ ...taskForm, assigned_to_name: e.target.value })} placeholder="Name or team" /></div>
              <div><Label>Due Date</Label><Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
            </div>
            {editingTask && (
              <div><Label>Status</Label>
                <Select value={taskForm.status || "pending"} onValueChange={v => setTaskForm({ ...taskForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["pending","in_progress","completed","skipped"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Notes</Label><Textarea value={taskForm.notes} onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." /></div>
            <Button className="w-full" onClick={() => saveTask.mutate({ ...taskForm, type: "offboarding", status: taskForm.status || "pending" })} disabled={!taskForm.task || saveTask.isPending}>
              {saveTask.isPending ? "Saving..." : editingTask ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}