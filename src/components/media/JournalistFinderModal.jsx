import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, Plus } from 'lucide-react';

export default function JournalistFinderModal({ open, onClose }) {
  const [industry, setIndustry] = useState('');
  const [topics, setTopics] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const queryClient = useQueryClient();

  const searchJournalists = async () => {
    setIsSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 5 relevant journalists/reporters who cover:
Industry: ${industry}
Topics: ${topics}

For each journalist provide realistic mock data:
- name: Full name
- outlet: Media outlet name
- outlet_type: newspaper/magazine/blog/online
- beat: Array of topics they cover
- relevance_score: 0-100 match score
- outlet_da: Domain authority estimate
- audience_size: Estimated audience`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            journalists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  outlet: { type: 'string' },
                  outlet_type: { type: 'string' },
                  beat: { type: 'array', items: { type: 'string' } },
                  relevance_score: { type: 'number' },
                  outlet_da: { type: 'number' },
                  audience_size: { type: 'number' },
                },
              },
            },
          },
        },
      });
      setResults(result.journalists || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsSearching(false);
  };

  const addJournalist = async (journalist) => {
    await base44.entities.Journalist.create(journalist);
    queryClient.invalidateQueries({ queryKey: ['journalists'] });
    setResults(results.filter((j) => j.name !== journalist.name));
  };

  const addAll = async () => {
    for (const j of results) {
      await base44.entities.Journalist.create(j);
    }
    queryClient.invalidateQueries({ queryKey: ['journalists'] });
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Journalist Finder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Industry</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>
          <div>
            <Label>Topics/Keywords</Label>
            <Input
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g., AI, startups, SaaS"
            />
          </div>

          <Button
            onClick={searchJournalists}
            disabled={isSearching || !industry}
            className="w-full gap-2"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Find Journalists
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Found {results.length} journalists</p>
                <Button size="sm" onClick={addAll}>
                  Add All
                </Button>
              </div>
              {results.map((j, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{j.name}</p>
                    <p className="text-sm text-gray-500">{j.outlet}</p>
                    <div className="flex gap-1 mt-1">
                      {j.beat?.slice(0, 2).map((b, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addJournalist(j)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
