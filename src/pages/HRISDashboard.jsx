import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, DollarSign, Calendar, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Briefcase, Target, Award, ChevronRight
} from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HRISDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["hris-timeoff"],
    queryFn: () => base44.entities.HRISTimeOffRequest.list("-created_date"),
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ["hris-payrolls"],
    queryFn: () => base44.entities.HRISPayroll.list("-created_date"),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["hris-reviews"],
    queryFn: () => base44.entities.HRISPerformanceReview.list("-created_date"),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["hris-goals"],
    queryFn: () => base44.entities.HRISPerformanceGoal.list("-created_date"),
  });

  const activeEmployees = employees.filter(e => e.status === "active").length;
  const onboardingEmployees = employees.filter(e => e.status === "onboarding").length;
  const pendingTimeOff = timeOffRequests.filter(r => r.status === "pending_approval" || r.status === "manager_review").length;
  const pendingPayrolls = payrolls.filter(p => p.status === "pending").length;
  const pendingReviews = reviews.filter(r => r.status !== "completed").length;
  const activeGoals = goals.filter(g => g.status === "in_progress").length;

  const totalPayroll = payrolls.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.net_pay || 0), 0);

  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department || "Other";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const recentRequests = timeOffRequests.slice(0, 5);

  const quickLinks = [
    { label: "Employees", path: "/HRISEmployees", icon: Users, color: "bg-blue-500" },
    { label: "Time Off", path: "/HRISTimeOff", icon: Calendar, color: "bg-green-500" },
    { label: "Payroll", path: "/HRISPayroll", icon: DollarSign, color: "bg-indigo-500" },
    { label: "Benefits", path: "/HRISBenefits", icon: Award, color: "bg-pink-500" },
    { label: "Performance", path: "/HRISPerformance", icon: Target, color: "bg-purple-500" },
    { label: "Documents", path: "/HRISDocuments", icon: Briefcase, color: "bg-orange-500" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HRIS Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Human Resources Information System Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={activeEmployees} icon={Users} color="bg-blue-500" subtitle={`${onboardingEmployees} onboarding`} />
        <StatCard title="Pending Time Off" value={pendingTimeOff} icon={Clock} color="bg-amber-500" />
        <StatCard title="Total Payroll Paid" value={`$${(totalPayroll / 1000).toFixed(0)}K`} icon={DollarSign} color="bg-indigo-500" />
        <StatCard title="Open Reviews" value={pendingReviews} icon={Target} color="bg-purple-500" subtitle={`${activeGoals} active goals`} />
      </div>

      {/* Quick Nav */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={`p-2 rounded-xl ${link.color}`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employees by Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(departmentData).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No employees yet</p>
            ) : (
              Object.entries(departmentData).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{dept}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(count / activeEmployees) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-4">{count}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Time Off */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Time Off Requests</CardTitle>
            <Link to="/HRISTimeOff">
              <Button variant="ghost" size="sm">View All <ChevronRight className="w-3 h-3 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No requests yet</p>
            ) : (
              recentRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{req.employee_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{req.type?.replace(/_/g, " ")} · {req.days_requested} day{req.days_requested !== 1 ? "s" : ""}</p>
                  </div>
                  <Badge className={
                    req.status === "approved" ? "bg-green-100 text-green-700" :
                    req.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }>
                    {req.status?.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}