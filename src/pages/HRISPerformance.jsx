import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Star, TrendingUp, CheckCircle2, Plus, Edit, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const REVIEW_STATUS_COLORS = {
  pending_self_assessment: "bg-amber-100 text-amber-700",
  pending_manager_review: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const GOAL_STATUS_COLORS = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function HRISPerformance() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [goalDialog, setGoalDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [reviewForm, setReviewForm] = useState({});
  const [goalForm, setGoalForm] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["hris-employees"],
    queryFn: () => base44.entities.HRISEmployee.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["hris-reviews"],
    queryFn: () => base44.entities.HRISPerformanceReview.list("-created_date"),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["hris-goals"],
    queryFn: () => base44.entities.HRISPerformanceGoal.list("-created_date"),
  });

  useEffect(() => {
    if (user && employees.length > 0) setCurrentEmployee(employees.find(e => e.email === user?.email));
  }, [user, employees]);

  const createReview = useMutation({
    mutationFn: (data) => base44.entities.HRISPerformanceReview.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-reviews"] }); setReviewDialog(false); setReviewForm({}); toast.success("Review created"); },
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRISPerformanceReview.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-reviews"] }); setReviewDialog(false); setSelectedReview(null); toast.success("Review updated"); },
  });

  const createGoal = useMutation({
    mutationFn: (data) => base44.entities.HRISPerformanceGoal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-goals"] }); setGoalDialog(false); setGoalForm({}); toast.success("Goal created"); },
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HRISPerformanceGoal.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hris-goals"] }); setGoalDialog(false); setSelectedGoal(null); toast.success("Goal updated"); },
  });

  const isAdmin = user?.role === "admin";
  const myReviews = currentEmployee ? reviews.filter(r => r.employee_id === currentEmployee.id) : [];
  const myGoals = currentEmployee ? goals.filter(g => g.employee_id === currentEmployee.id) : [];

  const handleSaveReview = () => {
    if (!reviewForm.employee_id || !reviewForm.review_period) { toast.error("Employee and review period required"); return; }
    const emp = employees.find(e => e.id === reviewForm.employee_id);
    const data = {
      ...reviewForm,
      employee_name: emp?.full_name,
      reviewer_id: currentEmployee?.id,
      reviewer_name: currentEmployee?.full_name,
      status: selectedReview ? reviewForm.status : "pending_self_assessment",
    };
    if (selectedReview) updateReview.mutate({ id: selectedReview.id, data });
    else createReview.mutate(data);
  };

  const handleSaveGoal = () => {
    if (!goalForm.title) { toast.error("Goal title is required"); return; }
    const emp = employees.find(e => e.id === goalForm.employee_id);
    const data = {
      ...goalForm,
      employee_id: goalForm.employee_id || currentEmployee?.id,
      employee_name: emp?.full_name || currentEmployee?.full_name,
      set_by: currentEmployee?.id,
      set_by_name: currentEmployee?.full_name,
      status: goalForm.status || "not_started",
      progress: goalForm.progress || 0,
    };
    if (selectedGoal) updateGoal.mutate({ id: selectedGoal.id, data });
    else createGoal.mutate(data);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Reviews and goal tracking</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Pending Reviews</p><p className="text-2xl font-bold mt-1">{reviews.filter(r => r.status !== "completed").length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Completed Reviews</p><p className="text-2xl font-bold mt-1">{reviews.filter(r => r.status === "completed").length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Active Goals</p><p className="text-2xl font-bold mt-1">{goals.filter(g => g.status === "in_progress").length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Performance Reviews</h2>
            {isAdmin && (
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedReview(null); setReviewForm({}); setReviewDialog(true); }}>
                <Plus className="w-4 h-4" /> Create Review
              </Button>
            )}
          </div>
          {(isAdmin ? reviews : myReviews).length === 0 ? (
            <p className="text-center text-gray-400 py-8">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {(isAdmin ? reviews : myReviews).map(review => (
                <Card key={review.id}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">{review.employee_name}</p>
                        <Badge className={REVIEW_STATUS_COLORS[review.status] || "bg-gray-100 text-gray-600"}>
                          {review.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{review.review_period} · {review.review_type?.replace(/_/g, " ")}</p>
                      {review.overall_rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium">{review.overall_rating}/5</span>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => { setSelectedReview(review); setReviewForm(review); setReviewDialog(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Performance Goals</h2>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedGoal(null); setGoalForm({}); setGoalDialog(true); }}>
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </div>
          {(isAdmin ? goals : myGoals).length === 0 ? (
            <p className="text-center text-gray-400 py-8">No goals yet</p>
          ) : (
            <div className="space-y-3">
              {(isAdmin ? goals : myGoals).map(goal => (
                <Card key={goal.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{goal.title}</p>
                        <p className="text-sm text-gray-500">{goal.employee_name} · {goal.category?.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={GOAL_STATUS_COLORS[goal.status]}>{goal.status?.replace(/_/g, " ")}</Badge>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setSelectedGoal(goal); setGoalForm(goal); setGoalDialog(true); }}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {goal.description && <p className="text-sm text-gray-400 mb-2">{goal.description}</p>}
                    <div className="flex items-center gap-3">
                      <Progress value={goal.progress || 0} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{goal.progress || 0}%</span>
                    </div>
                    {goal.target_date && (
                      <p className="text-xs text-gray-400 mt-1">Target: {format(parseISO(goal.target_date), "MMM d, yyyy")}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={v => { if (!v) { setReviewDialog(false); setSelectedReview(null); setReviewForm({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedReview ? "Edit Review" : "Create Review"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Employee *</Label>
              <Select value={reviewForm.employee_id || ""} onValueChange={v => setReviewForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Review Period *</Label>
              <Input className="mt-1" placeholder="e.g. Q1 2026, Annual 2026" value={reviewForm.review_period || ""} onChange={e => setReviewForm(f => ({ ...f, review_period: e.target.value }))} />
            </div>
            <div>
              <Label>Review Type</Label>
              <Select value={reviewForm.review_type || "annual"} onValueChange={v => setReviewForm(f => ({ ...f, review_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="mid_year">Mid-Year</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedReview && (
              <>
                <div>
                  <Label>Status</Label>
                  <Select value={reviewForm.status || ""} onValueChange={v => setReviewForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_self_assessment">Pending Self Assessment</SelectItem>
                      <SelectItem value="pending_manager_review">Pending Manager Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Overall Rating (1-5)</Label>
                  <Input className="mt-1" type="number" min="1" max="5" step="0.1" value={reviewForm.overall_rating || ""} onChange={e => setReviewForm(f => ({ ...f, overall_rating: parseFloat(e.target.value) }))} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveReview}>{selectedReview ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={goalDialog} onOpenChange={v => { if (!v) { setGoalDialog(false); setSelectedGoal(null); setGoalForm({}); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedGoal ? "Edit Goal" : "Add Goal"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {isAdmin && (
              <div>
                <Label>Employee</Label>
                <Select value={goalForm.employee_id || ""} onValueChange={v => setGoalForm(f => ({ ...f, employee_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Goal Title *</Label>
              <Input className="mt-1" value={goalForm.title || ""} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" rows={2} value={goalForm.description || ""} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={goalForm.category || "performance"} onValueChange={v => setGoalForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="professional_development">Development</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={goalForm.status || "not_started"} onValueChange={v => setGoalForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Date</Label>
                <Input className="mt-1" type="date" value={goalForm.target_date || ""} onChange={e => setGoalForm(f => ({ ...f, target_date: e.target.value }))} />
              </div>
              <div>
                <Label>Progress %</Label>
                <Input className="mt-1" type="number" min="0" max="100" value={goalForm.progress || 0} onChange={e => setGoalForm(f => ({ ...f, progress: parseInt(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveGoal}>{selectedGoal ? "Save" : "Add Goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}