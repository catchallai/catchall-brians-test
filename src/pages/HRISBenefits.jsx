import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Shield, Eye, Briefcase, Users, TrendingUp, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_CONFIG = {
  health_insurance: { label: "Health Insurance", icon: Heart, color: "bg-red-100 text-red-700" },
  dental_insurance: { label: "Dental Insurance", icon: Shield, color: "bg-blue-100 text-blue-700" },
  vision_insurance: { label: "Vision Insurance", icon: Eye, color: "bg-purple-100 text-purple-700" },
  life_insurance: { label: "Life Insurance", icon: Shield, color: "bg-green-100 text-green-700" },
  retirement_401k: { label: "401(k)", icon: TrendingUp, color: "bg-indigo-100 text-indigo-700" },
  pto: { label: "PTO", icon: Briefcase, color: "bg-amber-100 text-amber-700" },
  wellness: { label: "Wellness", icon: Heart, color: "bg-pink-100 text-pink-700" },
  education: { label: "Education", icon: Briefcase, color: "bg-cyan-100 text-cyan-700" },
};

export default function HRISBenefits() {
  const [benefitDialog, setBenefitDialog] = useState(false);
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [form, setForm] = useState({});
  const [enrollForm, setEnrollForm] = useState({});
  const queryClient = useQueryClient();

  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ["hris-benefits"],
    queryFn: () => base44.entities.HRISBenefit.filter({ is_active: true }),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["hris-enrollments"],
    queryFn: () => base44.entities.HRISBenefitEnrollment.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const createBenefit = useMutation({
    mutationFn: (data) => base44.entities.HRISBenefit.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-benefits"] }); setBenefitDialog(false); setForm({}); toast.success("Benefit created"); },
  });

  const updateBenefit = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRISBenefit.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-benefits"] }); setBenefitDialog(false); setSelectedBenefit(null); setForm({}); toast.success("Benefit updated"); },
  });

  const createEnrollment = useMutation({
    mutationFn: (data) => base44.entities.HRISBenefitEnrollment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-enrollments"] }); setEnrollDialog(false); setEnrollForm({}); toast.success("Enrollment created"); },
  });

  const handleSaveBenefit = () => {
    if (!form.name || !form.category) { toast.error("Name and category are required"); return; }
    if (selectedBenefit) updateBenefit.mutate({ id: selectedBenefit.id, data: form });
    else createBenefit.mutate({ ...form, is_active: true });
  };

  const handleEnroll = () => {
    if (!enrollForm.employee_id || !enrollForm.benefit_id) { toast.error("Select employee and benefit"); return; }
    const emp = employees.find(e => e.id === enrollForm.employee_id);
    const ben = benefits.find(b => b.id === enrollForm.benefit_id);
    createEnrollment.mutate({
      employee_id: emp.id,
      employee_name: emp.full_name,
      employee_email: emp.email,
      benefit_id: ben.id,
      benefit_name: ben.name,
      benefit_category: ben.category,
      coverage_type: enrollForm.coverage_type || "employee_only",
      enrollment_date: new Date().toISOString().split("T")[0],
      effective_date: enrollForm.effective_date,
      status: "active",
      employee_contribution: ben.employee_cost_monthly || 0,
      employer_contribution: ben.employer_cost_monthly || 0,
    });
  };

  const activeEnrollments = enrollments.filter(e => e.status === "active").length;
  const monthlyCost = enrollments.filter(e => e.status === "active").reduce((s, e) => s + (e.employer_contribution || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Benefits</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee benefits and enrollments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEnrollForm({}); setEnrollDialog(true); }}>Enroll Employee</Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedBenefit(null); setForm({}); setBenefitDialog(true); }}>
            <Plus className="w-4 h-4" /> Add Benefit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Total Benefits</p><p className="text-2xl font-bold mt-1">{benefits.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Active Enrollments</p><p className="text-2xl font-bold mt-1">{activeEnrollments}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Monthly Employer Cost</p><p className="text-2xl font-bold mt-1">${monthlyCost.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Benefits Catalog</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          {isLoading ? <p className="text-center text-gray-400 py-8">Loading...</p> :
            benefits.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No benefits yet</p>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setBenefitDialog(true)}>Add First Benefit</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map(benefit => {
                  const cfg = CATEGORY_CONFIG[benefit.category] || { label: benefit.category, icon: Briefcase, color: "bg-gray-100 text-gray-600" };
                  const Icon = cfg.icon;
                  return (
                    <Card key={benefit.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-xl ${cfg.color}`}><Icon className="w-5 h-5" /></div>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setSelectedBenefit(benefit); setForm(benefit); setBenefitDialog(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Badge className={`${cfg.color} text-xs mb-2`}>{cfg.label}</Badge>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.name}</h3>
                        {benefit.description && <p className="text-sm text-gray-500 mt-1">{benefit.description}</p>}
                        <div className="mt-3 flex justify-between text-xs text-gray-500">
                          <span>Employee: <strong>${benefit.employee_cost_monthly || 0}/mo</strong></span>
                          <span>Employer: <strong>${benefit.employer_cost_monthly || 0}/mo</strong></span>
                        </div>
                        <Button size="sm" variant="outline" className="mt-3 w-full text-xs" onClick={() => { setEnrollForm({ benefit_id: benefit.id }); setEnrollDialog(true); }}>
                          Enroll Employee
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          }
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          {enrollments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No enrollments yet</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{e.employee_name}</p>
                    <p className="text-sm text-gray-500">{e.benefit_name} · {e.coverage_type?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${e.employee_contribution}/mo</span>
                    <Badge className={e.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{e.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Benefit Dialog */}
      <Dialog open={benefitDialog} onOpenChange={v => { if (!v) { setBenefitDialog(false); setSelectedBenefit(null); setForm({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedBenefit ? "Edit Benefit" : "Add Benefit"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Benefit Name *</Label>
              <Input className="mt-1" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Health Plan" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category || ""} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Employee Cost/mo</Label>
                <Input className="mt-1" type="number" value={form.employee_cost_monthly || ""} onChange={e => setForm(f => ({ ...f, employee_cost_monthly: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <Label>Employer Cost/mo</Label>
                <Input className="mt-1" type="number" value={form.employer_cost_monthly || ""} onChange={e => setForm(f => ({ ...f, employer_cost_monthly: parseFloat(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBenefitDialog(false); setForm({}); }}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveBenefit}>{selectedBenefit ? "Save Changes" : "Create Benefit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollDialog} onOpenChange={setEnrollDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enroll Employee in Benefit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Employee *</Label>
              <Select value={enrollForm.employee_id || ""} onValueChange={v => setEnrollForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Benefit *</Label>
              <Select value={enrollForm.benefit_id || ""} onValueChange={v => setEnrollForm(f => ({ ...f, benefit_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select benefit" /></SelectTrigger>
                <SelectContent>{benefits.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coverage Type</Label>
              <Select value={enrollForm.coverage_type || "employee_only"} onValueChange={v => setEnrollForm(f => ({ ...f, coverage_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_only">Employee Only</SelectItem>
                  <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input className="mt-1" type="date" value={enrollForm.effective_date || ""} onChange={e => setEnrollForm(f => ({ ...f, effective_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollDialog(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleEnroll}>Enroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}