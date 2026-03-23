import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, TrendingUp, TrendingDown, History, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function HistoricalAnalysisCard({ account, onAnalyzeHistory, isAnalyzing }) {
  const [historicalData, setHistoricalData] = useState(null);

  const handleAnalyze = async () => {
    const data = await onAnalyzeHistory(account);
    setHistoricalData(data);
  };

  if (!historicalData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <History className="w-12 h-12 text-violet-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Historical Analysis</h3>
          <p className="text-sm text-gray-500 mb-4">
            Analyze 5+ years of data to uncover long-term trends and patterns
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isAnalyzing ? 'Analyzing 5 Years...' : 'Analyze History'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-violet-600" />
            5-Year Historical Analysis
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            <Calendar className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Growth Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Follower Growth</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {historicalData.follower_growth_rate > 0 ? '+' : ''}
              {historicalData.follower_growth_rate}%
            </p>
            <p className="text-xs text-gray-500">Since {historicalData.start_year}</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Engagement Trend</p>
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              {historicalData.engagement_trend === 'up' ? (
                <>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-600">Up</span>
                </>
              ) : historicalData.engagement_trend === 'down' ? (
                <>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">Down</span>
                </>
              ) : (
                <span className="text-gray-600">Stable</span>
              )}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Posts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {historicalData.total_posts_analyzed || 0}
            </p>
            <p className="text-xs text-gray-500">Analyzed</p>
          </div>
        </div>

        {/* Historical Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Growth Over Time
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historicalData.timeline || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="followers" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="engagement_rate" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Milestones */}
        {historicalData.milestones && historicalData.milestones.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Key Milestones
            </h4>
            <div className="space-y-2">
              {historicalData.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <Calendar className="w-4 h-4 text-violet-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {milestone.event}
                    </p>
                    <p className="text-xs text-gray-500">
                      {milestone.date} • {milestone.impact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolution Summary */}
        <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
          <h4 className="font-medium text-violet-900 dark:text-violet-300 mb-2">AI Insights</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{historicalData.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
