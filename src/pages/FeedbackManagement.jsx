import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import FeedbackReviewPanel from '@/components/feedback/FeedbackReviewPanel';

export default function FeedbackManagement() {
  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.CustomerFeedback.list('-created_date', 200),
  });

  // Calculate stats
  const totalFeedback = feedback.length;
  const newFeedback = feedback.filter((f) => f.status === 'new').length;
  const negativeFeedback = feedback.filter((f) => f.sentiment === 'negative').length;
  const avgNps =
    feedback.filter((f) => f.nps_score).length > 0
      ? Math.round(
          feedback.filter((f) => f.nps_score).reduce((sum, f) => sum + f.nps_score, 0) /
            feedback.filter((f) => f.nps_score).length
        )
      : 0;

  // Sentiment breakdown
  const sentimentData = [
    { name: 'Positive', value: feedback.filter((f) => f.sentiment === 'positive').length },
    { name: 'Neutral', value: feedback.filter((f) => f.sentiment === 'neutral').length },
    { name: 'Negative', value: feedback.filter((f) => f.sentiment === 'negative').length },
  ];

  // Category breakdown
  const categoryData = Array.from(
    feedback.reduce((acc, f) => {
      const cat = f.category || 'uncategorized';
      acc.set(cat, (acc.get(cat) || 0) + 1);
      return acc;
    }, new Map())
  ).map(([name, value]) => ({ name, value }));

  // NPS distribution
  const npsDistribution = Array.from({ length: 11 }).map((_, i) => ({
    score: i,
    count: feedback.filter((f) => f.nps_score === i).length,
  }));

  const COLORS = ['#10b981', '#6b7280', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Customer Feedback
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Capture, analyze, and act on customer feedback
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {totalFeedback}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Unreviewed</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1">{newFeedback}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Negative</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{negativeFeedback}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg NPS</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{avgNps}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="review" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="review">Review & Categorize</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-6">
            <FeedbackReviewPanel />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">NPS Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={npsDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="score" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {categoryData.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Feedback by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
