import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, Users, 
  CheckCircle, Clock, AlertCircle, FileText, Award, Target, Zap
} from "lucide-react";

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

export default function EmployeeProfileModal({ employee, open, onOpenChange }) {
  // Fetch related data from all modules - hooks must be called unconditionally
  const { data: performanceReviews } = useQuery({
    queryKey: ["performance-reviews", employee?.id],
    queryFn: () => base44.entities.HRISPerformanceReview?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  const { data: performanceGoals } = useQuery({
    queryKey: ["performance-goals", employee?.id],
    queryFn: () => base44.entities.HRISPerformanceGoal?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  const { data: trainingRecords } = useQuery({
    queryKey: ["talent-training", employee?.id],
    queryFn: () => base44.entities.TalentTraining?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", employee?.id],
    queryFn: () => base44.entities.ProjectTask?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  const { data: opportunities } = useQuery({
    queryKey: ["opportunities", employee?.id],
    queryFn: () => base44.entities.Opportunity?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  const { data: deals } = useQuery({
    queryKey: ["deals", employee?.id],
    queryFn: () => base44.entities.Deal?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  const { data: complianceRecords } = useQuery({
    queryKey: ["compliance-training", employee?.id],
    queryFn: () => base44.entities.ComplianceTraining?.list?.() || Promise.resolve([]),
    enabled: !!employee?.id,
  });

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4 pb-4 border-b">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
                {employee.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.full_name}</h2>
              <p className="text-lg text-gray-500">{employee.job_title || "—"}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={STATUS_COLORS[employee.status] || "bg-gray-100 text-gray-600"}>
                  {employee.status}
                </Badge>
                {employee.employment_type && (
                  <Badge variant="outline">{TYPE_LABELS[employee.employment_type]}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="general" className="w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="talent">Talent & Learning</TabsTrigger>
            <TabsTrigger value="projects">Projects & Sales</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900 dark:text-white break-all">{employee.email}</p>
                  </div>
                </div>
                {employee.phone && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Phone</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{employee.phone}</p>
                    </div>
                  </div>
                )}
                {employee.location && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Location</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{employee.location}</p>
                    </div>
                  </div>
                )}
                {employee.department && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Department</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{employee.department}</p>
                    </div>
                  </div>
                )}
                {employee.start_date && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Start Date</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{new Date(employee.start_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {employee.salary && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Annual Salary</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">${employee.salary.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {employee.manager_name && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Manager</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 dark:text-white">{employee.manager_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4" /> Performance Reviews
                  </h3>
                  {performanceReviews?.length > 0 ? (
                    <div className="space-y-2">
                      {performanceReviews.map(review => (
                        <div key={review.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">
                            {review.review_date ? new Date(review.review_date).toLocaleDateString() : 'N/A'}
                          </p>
                          {review.rating && <p className="text-gray-500 text-xs">Rating: {review.rating}/5</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No performance reviews yet</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" /> Performance Goals
                  </h3>
                  {performanceGoals?.length > 0 ? (
                    <div className="space-y-2">
                      {performanceGoals.map(goal => (
                        <div key={goal.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">{goal.goal_title || 'Goal'}</p>
                          {goal.status && <p className="text-gray-500 text-xs">Status: {goal.status}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No performance goals set</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Talent & Learning Tab */}
            <TabsContent value="talent" className="space-y-4">
              {trainingRecords?.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" /> Training & Development
                  </h3>
                  <div className="space-y-2">
                    {trainingRecords.map(training => (
                      <div key={training.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="text-gray-900 dark:text-white font-medium">{training.course_name || 'Training'}</p>
                        {training.completion_date && (
                          <p className="text-gray-500 text-xs">Completed: {new Date(training.completion_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No training records</p>
              )}
            </TabsContent>

            {/* Projects & Sales Tab */}
            <TabsContent value="projects" className="space-y-4">
              <div className="space-y-3">
                {tasks?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4" /> Assigned Tasks
                    </h3>
                    <div className="space-y-2">
                      {tasks.slice(0, 5).map(task => (
                        <div key={task.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">{task.title || 'Task'}</p>
                          {task.status && <p className="text-gray-500 text-xs">Status: {task.status}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deals?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4" /> Sales Deals
                    </h3>
                    <div className="space-y-2">
                      {deals.slice(0, 5).map(deal => (
                        <div key={deal.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">{deal.title || 'Deal'}</p>
                          {deal.value && <p className="text-gray-500 text-xs">${deal.value.toLocaleString()}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {opportunities?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4" /> Opportunities
                    </h3>
                    <div className="space-y-2">
                      {opportunities.slice(0, 5).map(opp => (
                        <div key={opp.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">{opp.title || 'Opportunity'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!tasks?.length && !deals?.length && !opportunities?.length && (
                  <p className="text-sm text-gray-400">No projects or sales data</p>
                )}
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              {complianceRecords?.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> Compliance Training
                  </h3>
                  <div className="space-y-2">
                    {complianceRecords.map(record => (
                      <div key={record.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="text-gray-900 dark:text-white font-medium">{record.training_name || 'Training'}</p>
                        {record.completion_date && (
                          <p className="text-gray-500 text-xs">Completed: {new Date(record.completion_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No compliance records</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}