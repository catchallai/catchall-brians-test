import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Target, Calendar, FileText, Lightbulb, Search, Users } from 'lucide-react';
import ContentGapAnalyzer from '@/components/content/ContentGapAnalyzer';
import TopicGenerator from '@/components/content/TopicGenerator';
import ContentCalendarPlanner from '@/components/content/ContentCalendarPlanner';
import ContentOutlineGenerator from '@/components/content/ContentOutlineGenerator';

export default function ContentStrategy() {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 200),
  });

  const { data: competitors = [] } = useQuery({
    queryKey: ['competitors'],
    queryFn: () => base44.entities.Competitor.list('-created_date', 50),
  });

  const { data: contentInsights = [] } = useQuery({
    queryKey: ['content-insights'],
    queryFn: () => base44.entities.ContentInsight.list('-created_date', 50),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-violet-500" />
          Content Strategy Assistant
        </h1>
        <p className="text-gray-500 mt-1">
          AI-powered content planning, gap analysis, and topic generation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{keywords.length}</p>
                <p className="text-sm text-gray-500">Keywords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{competitors.length}</p>
                <p className="text-sm text-gray-500">Competitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{websites.length}</p>
                <p className="text-sm text-gray-500">Websites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contentInsights.length}</p>
                <p className="text-sm text-gray-500">Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="gaps" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="gaps" className="gap-2">
            <Search className="w-4 h-4" />
            Content Gaps
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Topic Ideas
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Content Calendar
          </TabsTrigger>
          <TabsTrigger value="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Outline Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gaps">
          <ContentGapAnalyzer
            websites={websites}
            keywords={keywords}
            competitors={competitors}
            onSelectTopic={setSelectedTopic}
          />
        </TabsContent>

        <TabsContent value="topics">
          <TopicGenerator
            keywords={keywords}
            competitors={competitors}
            contentInsights={contentInsights}
            onSelectTopic={setSelectedTopic}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <ContentCalendarPlanner keywords={keywords} selectedTopic={selectedTopic} />
        </TabsContent>

        <TabsContent value="outline">
          <ContentOutlineGenerator keywords={keywords} selectedTopic={selectedTopic} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
