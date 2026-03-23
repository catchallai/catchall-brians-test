import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Grid3X3, MapPin, Target, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MapRankTracker({ rankings, profiles }) {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async ({ profileId, keyword }) => {
      setIsScanning(true);
      // Simulate map ranking scan with AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate a local map ranking grid scan for keyword "${keyword}". 
Generate a 5x5 grid of rankings (25 points) around a central location.
Each point should have a rank between 1-20 (lower is better).
Calculate average rank and percentage in top 3.`,
        response_json_schema: {
          type: 'object',
          properties: {
            rankings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  rank: { type: 'number' },
                  location_name: { type: 'string' },
                },
              },
            },
            avg_rank: { type: 'number' },
            top3_percentage: { type: 'number' },
          },
        },
      });

      await base44.entities.MapRanking.create({
        profile_id: profileId,
        keyword: keyword,
        grid_size: '5x5',
        rankings: result.rankings,
        avg_rank: result.avg_rank,
        top3_percentage: result.top3_percentage,
        scan_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-rankings'] });
      setIsScanning(false);
      setKeyword('');
    },
    onError: () => setIsScanning(false),
  });

  const getProfile = (id) => profiles.find((p) => p.id === id);

  const getRankColor = (rank) => {
    if (rank <= 3) {
      return 'bg-emerald-500 text-white';
    }
    if (rank <= 10) {
      return 'bg-amber-500 text-white';
    }
    return 'bg-red-500 text-white';
  };

  return (
    <div className="space-y-4">
      {/* New Scan Form */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            New Map Rank Scan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter keyword to track..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Button
              onClick={() => scanMutation.mutate({ profileId: selectedProfile, keyword })}
              disabled={!selectedProfile || !keyword || isScanning}
              className="gap-2"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Scan Rankings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rankings List */}
      {rankings.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              No Map Rankings Yet
            </h3>
            <p className="text-gray-500">Scan your local rankings for any keyword</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rankings.map((ranking) => {
            const profile = getProfile(ranking.profile_id);
            return (
              <Card key={ranking.id} className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {ranking.keyword}
                      </h3>
                      <p className="text-sm text-gray-500">{profile?.business_name}</p>
                      <p className="text-xs text-gray-400">
                        Scanned{' '}
                        {ranking.scan_date
                          ? format(new Date(ranking.scan_date), 'MMM d, yyyy HH:mm')
                          : 'Unknown'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {ranking.avg_rank?.toFixed(1) || '-'}
                      </p>
                      <p className="text-xs text-gray-500">Avg Rank</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">
                        {ranking.top3_percentage || 0}%
                      </p>
                      <p className="text-xs text-gray-500">Top 3</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {ranking.grid_size}
                      </p>
                      <p className="text-xs text-gray-500">Grid</p>
                    </div>
                  </div>

                  {/* Mini Grid Visualization */}
                  <div className="grid grid-cols-5 gap-1">
                    {(ranking.rankings || []).slice(0, 25).map((point, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded text-xs flex items-center justify-center font-medium ${getRankColor(point.rank)}`}
                        title={point.location_name}
                      >
                        {point.rank}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span>Top 3</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-amber-500" />
                      <span>4-10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-500" />
                      <span>11+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
