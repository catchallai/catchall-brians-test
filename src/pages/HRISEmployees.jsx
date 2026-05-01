import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Plus, Pencil, Trash2, Mail, Phone, MapPin, Briefcase, Filter } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  onboarding: "bg-blue-100 text-blue-700",
  on_leave: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-700",
};

const TYPE_LABELS = {
  full_time: "Full Time",
  part_time: "Part Time",
  contractor: "Contractor",
  intern: "Intern",
};

export default function HRISEmployees() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRISEmployee.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-employees"] }); closeDialog(); toast.success("Employee added"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRISEmployee.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-employees"] }); closeDialog(); toast.success("Employee updated"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HRISEmployee.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-employees"] }); toast.success("Employee removed"); },
  });

  const openDialog = (emp = null) => {
    setEditingEmployee(emp);
    setForm(emp || { status: "active", employment_type: "full_time" });
    setIsDialogOpen(true);
  };

  const closeDialog = () => { setIsDialogOpen(false); setEditingEmployee(null); setForm({}); };

  const handleSave = () => {
    if (!form.full_name || !form.email) { toast.error("Name and email are required"); return; }
    const manager = employees.find(e => e.id === form.manager_id);
    const data = { ...form, manager_name: manager?.full_name };
    if (editingEmployee) updateMutation.mutate({ id: editingEmployee.id, data });
    else createMutation.mutate(data);
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q || emp.full_name?.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q) || emp.job_title?.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || emp.department === deptFilter;
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">{employees.filter(e => e.status === "active").length} active · {employees.length} total</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No employees found</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => openDialog()}>Add First Employee</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => (
            <Card key={emp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
                      {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openDialog(emp)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(emp.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{emp.full_name}</p>
                <p className="text-sm text-gray-500">{emp.job_title || "—"}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge className={STATUS_COLORS[emp.status] || "bg-gray-100 text-gray-600"}>{emp.status}</Badge>
                  {emp.employment_type && <Badge variant="outline" className="text-xs">{TYPE_LABELS[emp.employment_type]}</Badge>}
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-400">
                  {emp.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</div>}
                  {emp.department && <div className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{emp.department}</div>}
                  {emp.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.location}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input className="mt-1" value={form.full_name || ""} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Email *</Label>
              <Input className="mt-1" type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Location</Label>
              <Input className="mt-1" value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <Label>Department</Label>
              <Input className="mt-1" value={form.department || ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input className="mt-1" value={form.job_title || ""} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
            </div>
            <div>
              <Label>Employment Type</Label>
              <Select value={form.employment_type || "full_time"} onValueChange={v => setForm(f => ({ ...f, employment_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "active"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <Label>Annual Salary</Label>
              <Input className="mt-1" type="number" value={form.salary || ""} onChange={e => setForm(f => ({ ...f, salary: parseFloat(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <Label>Manager</Label>
              <Select value={form.manager_id || ""} onValueChange={v => setForm(f => ({ ...f, manager_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.id !== editingEmployee?.id).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}