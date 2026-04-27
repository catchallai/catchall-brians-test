import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Sparkles,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'YouTube'];

export default function AutoScheduleAssistant({ campaignBriefId, onSuccess }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['Instagram', 'LinkedIn']);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const qc = useQueryClient();

  const togglePlatform = (p) => {
    setSelectedPlatforms((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));
  };

  const getSuggestions = async () => {
    if (!campaignBriefId || selectedPlatforms.length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('suggestOptimalSchedule', {
        campaignBriefId,
        platforms: selectedPlatforms,
      });
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoPopulate = async (postCount = 20) => {
    if (!campaignBriefId || selectedPlatforms.length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('autoPopulateCalendar', {
        campaignBriefId,
        platforms: selectedPlatforms,
        postCount,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res.data?.success) {
        qc.invalidateQueries({ queryKey: ['calendar-posts'] });
        onSuccess?.(res.data.postsCreated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 dark:from-violet-950/40 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-base">AI Scheduling Assistant</CardTitle>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Get AI-powered posting recommendations and auto-populate your calendar
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Platforms</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                  selectedPlatforms.includes(p)
                    ? 'border-violet-400 bg-violet-600 text-white'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                }`}
              >
                <Checkbox checked={selectedPlatforms.includes(p)} className="pointer-events-none" />
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Suggestions Display */}
        {suggestions && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
            {suggestions.schedule &&
              suggestions.schedule.map((sched, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">
                        {sched.platform}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {sched.preferredHours
                            .slice(0, 3)
                            .map((h) => `${h}:00`)
                            .join(', ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {sched.frequency} / week
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        {sched.rationale}
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            {suggestions.strategyNotes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-300 font-medium mb-1">
                  Strategy
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  {suggestions.strategyNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={getSuggestions}
            disabled={loading || selectedPlatforms.length === 0}
            className="gap-1.5 flex-1 bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Get Suggestions
          </Button>
          <Button
            size="sm"
            onClick={() => autoPopulate(20)}
            disabled={loading || selectedPlatforms.length === 0}
            variant="outline"
            className="gap-1.5 flex-1"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Auto-Populate (20)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
