import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Download, TrendingUp, Users, Play } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

export default function HRISPayroll() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ["hris-payrolls"],
    queryFn: () => base44.entities.HRISPayroll.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRISPayroll.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hris-payrolls"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRISPayroll.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-payrolls"] }); toast.success("Payroll updated"); },
  });

  const handleRunPayroll = () => {
    const periodEnd = moment().format("YYYY-MM-DD");
    const periodStart = moment().subtract(14, "days").format("YYYY-MM-DD");
    const activeEmployees = employees.filter(e => e.status === "active" && (e.salary));
    if (activeEmployees.length === 0) { toast.error("No active employees with salary data"); return; }

    const records = activeEmployees.map(emp => {
      const grossPay = (emp.salary / 12) * 2;
      const federal = grossPay * 0.22;
      const state = grossPay * 0.05;
      const ss = grossPay * 0.062;
      const medicare = grossPay * 0.0145;
      const totalDed = federal + state + ss + medicare;
      return {
        employee_id: emp.id,
        employee_name: emp.full_name,
        employee_email: emp.email,
        department: emp.department,
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        pay_date: moment(periodEnd).add(5, "days").format("YYYY-MM-DD"),
        base_salary: emp.salary,
        hours_worked: 80,
        gross_pay: grossPay,
        federal_tax: federal,
        state_tax: state,
        social_security: ss,
        medicare,
        total_deductions: totalDed,
        net_pay: grossPay - totalDed,
        status: "draft",
      };
    });

    Promise.all(records.map(r => base44.entities.HRISPayroll.create(r))).then(() => {
      queryClient.invalidateQueries({ queryKey: ["hris-payrolls"] });
      toast.success(`Payroll run created for ${records.length} employees`);
    });
  };

  const handleExport = () => {
    const csv = [
      ["Employee", "Department", "Period", "Pay Date", "Gross Pay", "Deductions", "Net Pay", "Status"],
      ...filtered.map(p => [p.employee_name, p.department, `${p.pay_period_start} - ${p.pay_period_end}`, p.pay_date, p.gross_pay, p.total_deductions, p.net_pay, p.status]),
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `payroll-${moment().format("YYYY-MM-DD")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = payrolls.filter(p => {
    const s = statusFilter === "all" || p.status === statusFilter;
    const d = deptFilter === "all" || p.department === deptFilter;
    return s && d;
  });

  const totalGross = filtered.reduce((s, p) => s + (p.gross_pay || 0), 0);
  const totalNet = filtered.reduce((s, p) => s + (p.net_pay || 0), 0);
  const totalDed = filtered.reduce((s, p) => s + (p.total_deductions || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee compensation</p>
        </div>
        <Button onClick={handleRunPayroll} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Play className="w-4 h-4" /> Run Payroll
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Gross Pay", value: `$${totalGross.toLocaleString()}`, icon: TrendingUp, color: "bg-blue-500" },
          { label: "Total Net Pay", value: `$${totalNet.toLocaleString()}`, icon: DollarSign, color: "bg-green-500" },
          { label: "Total Deductions", value: `$${totalDed.toLocaleString()}`, icon: Users, color: "bg-red-400" },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color}`}><card.icon className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Pay Date</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">No payroll records. Click "Run Payroll" to get started.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{p.employee_name}</p>
                    <p className="text-xs text-gray-400">{p.department}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{p.pay_period_start && moment(p.pay_period_start).format("MMM D")} – {p.pay_period_end && moment(p.pay_period_end).format("MMM D, YYYY")}</TableCell>
                <TableCell className="text-sm">{p.pay_date && moment(p.pay_date).format("MMM D, YYYY")}</TableCell>
                <TableCell>${p.gross_pay?.toLocaleString()}</TableCell>
                <TableCell>${p.total_deductions?.toLocaleString()}</TableCell>
                <TableCell className="font-semibold">${p.net_pay?.toLocaleString()}</TableCell>
                <TableCell><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {p.status === "draft" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: p.id, data: { status: "pending" } })}>Submit</Button>}
                    {p.status === "pending" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: p.id, data: { status: "approved" } })}>Approve</Button>}
                    {p.status === "approved" && <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateMutation.mutate({ id: p.id, data: { status: "paid" } })}>Mark Paid</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}