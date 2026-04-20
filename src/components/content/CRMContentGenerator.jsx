import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Building2,
  Target,
  Sparkles,
  Loader2,
  TrendingUp,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const CONTENT_ANGLES = [
  {
    id: 'pain_points',
    label: 'Address Pain Points',
    description: 'Content solving customer challenges',
  },
  {
    id: 'industry_trends',
    label: 'Industry Trends',
    description: 'Relevant trends for target industries',
  },
  {
    id: 'case_studies',
    label: 'Case Studies',
    description: 'Success stories from similar customers',
  },
  {
    id: 'product_education',
    label: 'Product Education',
    description: 'How-to guides and tutorials',
  },
  {
    id: 'thought_leadership',
    label: 'Thought Leadership',
    description: 'Expert insights and opinions',
  },
];

export default function CRMContentGenerator({ contacts, companies, deals }) {
  const [selectedSource, setSelectedSource] = useState('deals');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedAngles, setSelectedAngles] = useState(['pain_points']);
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const queryClient = useQueryClient();

  // Segment options based on source
  const segmentOptions = {
    deals: [
      { value: 'all', label: 'All Deals' },
      { value: 'discovery', label: 'Discovery Stage' },
      { value: 'proposal', label: 'Proposal Stage' },
      { value: 'negotiation', label: 'Negotiation Stage' },
      { value: 'lost', label: 'Lost Deals (Win-back)' },
    ],
    contacts: [
      { value: 'all', label: 'All Contacts' },
      { value: 'lead', label: 'Leads' },
      { value: 'prospect', label: 'Prospects' },
      { value: 'customer', label: 'Customers' },
      { value: 'churned', label: 'Churned' },
    ],
    companies: [
      { value: 'all', label: 'All Companies' },
      ...[...new Set(companies?.map((c) => c.industry).filter(Boolean))]
        .slice(0, 5)
        .map((i) => ({ value: i, label: i })),
    ],
  };

  const getSegmentData = () => {
    if (selectedSource === 'deals') {
      const filtered =
        selectedSegment === 'all' ? deals : deals?.filter((d) => d.stage === selectedSegment);
      return {
        count: filtered?.length || 0,
        data: filtered?.slice(0, 10).map((d) => ({
          title: d.title,
          value: d.value,
          stage: d.stage,
          notes: d.notes,
        })),
      };
    }
    if (selectedSource === 'contacts') {
      const filtered =
        selectedSegment === 'all'
          ? contacts
          : contacts?.filter((c) => c.status === selectedSegment);
      return {
        count: filtered?.length || 0,
        data: filtered?.slice(0, 10).map((c) => ({
          name: `${c.first_name} ${c.last_name}`,
          status: c.status,
          job_title: c.job_title,
          source: c.source,
        })),
      };
    }
    if (selectedSource === 'companies') {
      const filtered =
        selectedSegment === 'all'
          ? companies
          : companies?.filter((c) => c.industry === selectedSegment);
      return {
        count: filtered?.length || 0,
        data: filtered?.slice(0, 10).map((c) => ({
          name: c.name,
          industry: c.industry,
          size: c.size,
          notes: c.notes,
        })),
      };
    }
    return { count: 0, data: [] };
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const segmentData = getSegmentData();
      const anglesText = selectedAngles
        .map((a) => CONTENT_ANGLES.find((x) => x.id === a)?.label)
        .join(', ');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 targeted content ideas for marketing/SEO based on CRM data.

Data Source: ${selectedSource}
Segment: ${selectedSegment} (${segmentData.count} records)
Content Angles: ${anglesText}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Sample CRM Data:
${JSON.stringify(segmentData.data, null, 2)}

Create content ideas that:
1. Address specific needs/pain points of this segment
2. Would resonate with similar prospects/customers
3. Help move deals through the pipeline
4. Are SEO-optimized with realistic keyword targets

For each idea provide:
- title: Compelling article title
- description: How this connects to the CRM segment
- target_keyword: Primary SEO keyword
- keyword_difficulty: Estimated 0-100
- search_volume: Estimated monthly searches
- opportunity_score: Quality of opportunity 0-100
- content_type: One of blog, guide, listicle, how-to, comparison, case-study
- target_segment: Which CRM segment this targets
- funnel_stage: top, middle, or bottom of funnel`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  target_keyword: { type: 'string' },
                  keyword_difficulty: { type: 'number' },
                  search_volume: { type: 'number' },
                  opportunity_score: { type: 'number' },
                  content_type: { type: 'string' },
                  target_segment: { type: 'string' },
                  funnel_stage: { type: 'string' },
                },
              },
            },
          },
        },
      });

      return result.ideas || [];
    },
    onSuccess: (ideas) => {
      setGeneratedIdeas(ideas);
      toast.success(`Generated ${ideas.length} content ideas`);
    },
    onError: () => toast.error('Failed to generate ideas'),
  });

  const saveIdeasMutation = useMutation({
    mutationFn: async (ideas) => {
      for (const idea of ideas) {
        await base44.entities.ContentIdea.create({
          ...idea,
          source: `crm_${selectedSource}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      toast.success('Ideas saved to Content Studio');
      setGeneratedIdeas([]);
    },
  });

  const toggleAngle = (angleId) => {
    setSelectedAngles((prev) =>
      prev.includes(angleId) ? prev.filter((a) => a !== angleId) : [...prev, angleId]
    );
  };

  const segmentData = getSegmentData();

  return (
    <div className="space-y-6">
      {/* Source Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all ${selectedSource === 'deals' ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          onClick={() => {
            setSelectedSource('deals');
            setSelectedSegment('all');
          }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Deals</p>
              <p className="text-sm text-gray-500">{deals?.length || 0} deals</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedSource === 'contacts' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          onClick={() => {
            setSelectedSource('contacts');
            setSelectedSegment('all');
          }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Contacts</p>
              <p className="text-sm text-gray-500">{contacts?.length || 0} contacts</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedSource === 'companies' ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          onClick={() => {
            setSelectedSource('companies');
            setSelectedSegment('all');
          }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Companies</p>
              <p className="text-sm text-gray-500">{companies?.length || 0} companies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment & Angles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Target Segment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions[selectedSource]?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {segmentData.count}
                </span>{' '}
                records selected
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Content Angles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CONTENT_ANGLES.map((angle) => (
                <div
                  key={angle.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => toggleAngle(angle.id)}
                >
                  <Checkbox checked={selectedAngles.includes(angle.id)} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {angle.label}
                    </p>
                    <p className="text-xs text-gray-500">{angle.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Context */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4">
          <Label className="text-sm font-medium mb-2 block">Additional Context (optional)</Label>
          <Textarea
            placeholder="Add any specific topics, products, or pain points you want to focus on..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending || selectedAngles.length === 0}
        className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
        size="lg"
      >
        {generateMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        Generate Content Ideas from CRM Data
      </Button>

      {/* Generated Ideas */}
      {generatedIdeas.length > 0 && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Generated Ideas</CardTitle>
            <Button
              onClick={() => saveIdeasMutation.mutate(generatedIdeas)}
              disabled={saveIdeasMutation.isPending}
              className="gap-2"
            >
              {saveIdeasMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Save All to Content Studio
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedIdeas.map((idea, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{idea.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{idea.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline">{idea.content_type}</Badge>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {idea.funnel_stage} funnel
                      </Badge>
                      <Badge className="bg-violet-100 text-violet-700">{idea.target_segment}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-emerald-600">{idea.opportunity_score}</p>
                    <p className="text-xs text-gray-500">score</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>
                    Keyword: <strong>{idea.target_keyword}</strong>
                  </span>
                  <span>Volume: {idea.search_volume?.toLocaleString()}</span>
                  <span>Difficulty: {idea.keyword_difficulty}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
