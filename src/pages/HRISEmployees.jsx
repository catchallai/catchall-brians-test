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
import { Users, Search, Plus, Pencil, Trash2, Mail, Phone, MapPin, Briefcase, ShieldCheck, UserPlus, Loader2, Upload, AlertCircle, Grid3x3, List } from "lucide-react";
import { toast } from "sonner";
import EmployeeAccessBadge from "@/components/hris/EmployeeAccessBadge";
import EmployeeProfileModal from "@/components/hris/EmployeeProfileModal";

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

const EMPTY_FORM = { status: "active", employment_type: "full_time", system_role: "user", system_access_status: "not_invited" };

export default function HRISEmployees() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [invitingId, setInvitingId] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
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
    setForm(emp || EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const closeDialog = () => { setIsDialogOpen(false); setEditingEmployee(null); setForm(EMPTY_FORM); };

  const handleSave = () => {
    if (!form.full_name || !form.email) { toast.error("Name and email are required"); return; }
    const manager = employees.find(e => e.id === form.manager_id);
    const data = { ...form, manager_name: manager?.full_name };
    if (editingEmployee) updateMutation.mutate({ id: editingEmployee.id, data });
    else createMutation.mutate(data);
  };

  // Invite an employee to the system
  const handleGrantAccess = async (emp) => {
    if (!emp.email) { toast.error("Employee must have an email"); return; }
    if (emp.system_role === "no_access") {
      toast.error("Set a system role (admin or user) before granting access.");
      return;
    }
    setInvitingId(emp.id);
    try {
      await base44.users.inviteUser(emp.email, emp.system_role || "user");
      await base44.entities.HRISEmployee.update(emp.id, { system_access_status: "invited" });
      queryClient.invalidateQueries({ queryKey: ["hris-employees"] });
      toast.success(`Invite sent to ${emp.email}`);
    } catch (err) {
      toast.error("Failed to send invite: " + (err?.message || "Unknown error"));
    } finally {
      setInvitingId(null);
    }
  };

  // Bulk import: parse CSV-style text (name, email, dept, title)
  const parseBulk = (text) => {
    const lines = text.trim().split("\n").filter(Boolean);
    return lines.map(line => {
      const [full_name, email, department, job_title] = line.split(",").map(s => s?.trim());
      return { full_name, email, department, job_title, status: "active", employment_type: "full_time", system_role: "user", system_access_status: "not_invited" };
    }).filter(r => r.full_name && r.email);
  };

  const handleBulkParse = () => {
    const parsed = parseBulk(bulkText);
    if (parsed.length === 0) { toast.error("No valid rows found. Format: Name, Email, Department, Title"); return; }
    setBulkParsed(parsed);
  };

  const handleBulkImport = async () => {
    setBulkImporting(true);
    let created = 0;
    for (const emp of bulkParsed) {
      try {
        await base44.entities.HRISEmployee.create(emp);
        created++;
      } catch {}
    }
    queryClient.invalidateQueries({ queryKey: ["hris-employees"] });
    setBulkImporting(false);
    setImportDialogOpen(false);
    setBulkText("");
    setBulkParsed([]);
    toast.success(`${created} employees imported`);
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q || emp.full_name?.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q) || emp.job_title?.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || emp.department === deptFilter;
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const accessStats = {
    active: employees.filter(e => e.system_access_status === "active").length,
    invited: employees.filter(e => e.system_access_status === "invited").length,
    notInvited: employees.filter(e => !e.system_access_status || e.system_access_status === "not_invited").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">{employees.filter(e => e.status === "active").length} active · {employees.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button onClick={() => openDialog()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* System Access Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{accessStats.active}</p>
          <p className="text-xs text-emerald-600">System Active</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{accessStats.invited}</p>
          <p className="text-xs text-amber-600">Invite Pending</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{accessStats.notInvited}</p>
          <p className="text-xs text-gray-500">No Access Yet</p>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "ghost"}
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => setViewMode("list")}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Employee View */}
      {isLoading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No employees found</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => openDialog()}>Add First Employee</Button>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => (
            <Card key={emp.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedEmployee(emp); setProfileModalOpen(true); }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
                      {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
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

                {/* System Access Section */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2" onClick={e => e.stopPropagation()}>
                  <EmployeeAccessBadge employee={emp} />
                  {(!emp.system_access_status || emp.system_access_status === "not_invited") && emp.system_role !== "no_access" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      disabled={invitingId === emp.id}
                      onClick={() => handleGrantAccess(emp)}
                    >
                      {invitingId === emp.id
                        ? <><Loader2 className="w-3 h-3 animate-spin" />Inviting...</>
                        : <><UserPlus className="w-3 h-3" />Grant System Access</>}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-2">
          {filtered.map(emp => (
            <div
              key={emp.id}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => { setSelectedEmployee(emp); setProfileModalOpen(true); }}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                  {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{emp.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{emp.email}</p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Badge className={STATUS_COLORS[emp.status] || "bg-gray-100 text-gray-600"}>{emp.status}</Badge>
              </div>

              <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
                <Briefcase className="w-3 h-3" />
                {emp.job_title || "—"}
              </div>

              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {emp.location || emp.department || "—"}
              </div>

              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openDialog(emp)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(emp.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

            {/* System Access */}
            <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">CatchAll System Access</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">System Role</Label>
                  <Select value={form.system_role || "user"} onValueChange={v => setForm(f => ({ ...f, system_role: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — Full Access</SelectItem>
                      <SelectItem value="user">User — Standard Access</SelectItem>
                      <SelectItem value="no_access">No Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Access Status</Label>
                  <Select value={form.system_access_status || "not_invited"} onValueChange={v => setForm(f => ({ ...f, system_access_status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_invited">Not Invited</SelectItem>
                      <SelectItem value="invited">Invite Sent</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.system_role !== "no_access" && (!form.system_access_status || form.system_access_status === "not_invited") && !editingEmployee && (
                <p className="text-xs text-indigo-500 mt-2">💡 After saving, use "Grant System Access" on the employee card to send an invite email.</p>
              )}
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

      {/* Bulk Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={() => { setImportDialogOpen(false); setBulkText(""); setBulkParsed([]); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Bulk Import Employees
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg flex items-start gap-2 text-sm text-blue-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Paste one employee per line in CSV format:<br />
                <code className="font-mono text-xs">Full Name, Email, Department, Job Title</code><br />
                All imported employees will default to <strong>User</strong> role with <strong>No Access</strong> — invite them individually after import.
              </span>
            </div>
            <textarea
              className="w-full h-40 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={"John Smith, john@company.com, Engineering, Software Engineer\nJane Doe, jane@company.com, HR, HR Manager"}
              value={bulkText}
              onChange={e => { setBulkText(e.target.value); setBulkParsed([]); }}
            />
            <Button variant="outline" onClick={handleBulkParse} disabled={!bulkText.trim()}>
              Preview Import ({parseBulk(bulkText).length} rows detected)
            </Button>

            {bulkParsed.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{bulkParsed.length} employees ready to import:</p>
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
                  {bulkParsed.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                          {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{emp.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.email}{emp.department ? ` · ${emp.department}` : ""}{emp.job_title ? ` · ${emp.job_title}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setBulkText(""); setBulkParsed([]); }}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={bulkParsed.length === 0 || bulkImporting}
              onClick={handleBulkImport}
            >
              {bulkImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : `Import ${bulkParsed.length} Employees`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Profile Modal */}
      <EmployeeProfileModal 
        employee={selectedEmployee} 
        open={profileModalOpen} 
        onOpenChange={setProfileModalOpen}
      />
    </div>
  );
}