import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle2, XCircle, Plus, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending_approval: "bg-amber-100 text-amber-700",
  manager_review: "bg-blue-100 text-blue-700",
  hr_review: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function HRISTimeOff() {
  const [user, setUser] = useState(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["hris-timeoff"],
    queryFn: () => base44.entities.HRISTimeOffRequest.list("-created_date"),
  });

  const currentEmployee = employees.find(e => e.email === user?.email);
  const isAdmin = user?.role === "admin";

  const myRequests = allRequests.filter(r => r.employee_id === currentEmployee?.id);
  const pendingManagerReview = allRequests.filter(r => r.manager_id === currentEmployee?.id && r.status === "manager_review");

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRISTimeOffRequest.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-timeoff"] }); setNewRequestOpen(false); setForm({}); toast.success("Request submitted"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRISTimeOffRequest.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-timeoff"] }); toast.success("Request updated"); },
  });

  const handleSubmit = () => {
    if (!form.type || !form.start_date || !form.end_date) { toast.error("Please fill all required fields"); return; }
    const days = Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const manager = employees.find(e => e.id === currentEmployee?.manager_id);
    createMutation.mutate({
      employee_id: currentEmployee?.id || "admin",
      employee_name: currentEmployee?.full_name || user?.full_name,
      employee_email: currentEmployee?.email || user?.email,
      manager_id: manager?.id,
      manager_name: manager?.full_name,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      days_requested: days,
      reason: form.reason,
      status: "pending_approval",
      requires_hr_review: days > 5 || ["parental", "bereavement"].includes(form.type),
    });
  };

  const handleDecision = (request, decision, role) => {
    const isManager = role === "manager";
    updateMutation.mutate({
      id: request.id,
      data: {
        status: decision === "approved" ? (isManager && request.requires_hr_review ? "hr_review" : "approved") : "rejected",
        ...(isManager ? { manager_decision: decision, manager_reviewed_at: new Date().toISOString() } : { hr_decision: decision, hr_reviewed_at: new Date().toISOString() }),
        ...(decision === "approved" && !request.requires_hr_review ? { approved_date: new Date().toISOString().split("T")[0] } : {}),
      },
    });
  };

  const RequestCard = ({ request, showActions, role }) => (
    <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
          {request.employee_name?.[0] || "?"}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{request.employee_name || "Unknown"}</p>
          <p className="text-sm text-gray-500 capitalize">{request.type?.replace(/_/g, " ")} · {request.days_requested} day{request.days_requested !== 1 ? "s" : ""}</p>
          {request.start_date && (
            <p className="text-xs text-gray-400 mt-1">
              {format(parseISO(request.start_date), "MMM d")} – {request.end_date && format(parseISO(request.end_date), "MMM d, yyyy")}
            </p>
          )}
          {request.reason && <p className="text-xs text-gray-400 mt-1 italic">"{request.reason}"</p>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge className={STATUS_STYLES[request.status] || "bg-gray-100 text-gray-600"}>
          {request.status?.replace(/_/g, " ")}
        </Badge>
        {showActions && (
          <div className="flex gap-1">
            <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700" onClick={() => handleDecision(request, "approved", role)}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="h-7 border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleDecision(request, "rejected", role)}>
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Off</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leave requests and approvals</p>
        </div>
        <Button onClick={() => setNewRequestOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Balance Cards */}
      {currentEmployee && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Vacation", value: currentEmployee.vacation_balance || 0, color: "bg-blue-50 text-blue-700" },
            { label: "Sick", value: currentEmployee.sick_balance || 0, color: "bg-rose-50 text-rose-700" },
            { label: "Personal", value: currentEmployee.personal_balance || 0, color: "bg-purple-50 text-purple-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`px-4 py-3 rounded-xl border ${color} border-current/20 text-center min-w-24`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-xs opacity-70">days left</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Requests</TabsTrigger>
          {pendingManagerReview.length > 0 && <TabsTrigger value="manager">Pending Review ({pendingManagerReview.length})</TabsTrigger>}
          {isAdmin && <TabsTrigger value="all">All Requests</TabsTrigger>}
        </TabsList>

        <TabsContent value="my" className="space-y-3 mt-4">
          {myRequests.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No time off requests yet</p>
          ) : myRequests.map(r => <RequestCard key={r.id} request={r} showActions={false} />)}
        </TabsContent>

        <TabsContent value="manager" className="space-y-3 mt-4">
          {pendingManagerReview.map(r => <RequestCard key={r.id} request={r} showActions role="manager" />)}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {allRequests.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No requests found</p>
          ) : allRequests.map(r => <RequestCard key={r.id} request={r} showActions={isAdmin} role="hr" />)}
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Time Off</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Type of Leave *</Label>
              <Select value={form.type || ""} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="bereavement">Bereavement</SelectItem>
                  <SelectItem value="parental">Parental Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input className="mt-1" type="date" value={form.end_date || ""} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Reason (Optional)</Label>
              <Textarea className="mt-1" rows={3} value={form.reason || ""} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewRequestOpen(false); setForm({}); }}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmit} disabled={createMutation.isPending}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}