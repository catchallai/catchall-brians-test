import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, BookOpen, TrendingUp, Users, GraduationCap, Zap, BarChart2 } from 'lucide-react';
import HRISPerformance from './HRISPerformance';
import TalentTraining from './TalentTraining';
import TalentCareerPaths from './TalentCareerPaths';
import TalentMentorships from './TalentMentorships';
import TalentInternships from './TalentInternships';
import TalentSkills from './TalentSkills';
import TalentSurveys from './TalentSurveys';

const TABS = [
  { value: 'performance', label: 'Performance', icon: Target },
  { value: 'training', label: 'Training', icon: BookOpen },
  { value: 'career', label: 'Career Paths', icon: TrendingUp },
  { value: 'mentorship', label: 'Mentorships', icon: Users },
  { value: 'internships', label: 'Internships', icon: GraduationCap },
  { value: 'skills', label: 'Skills', icon: Zap },
  { value: 'surveys', label: 'Surveys', icon: BarChart2 },
];

export default function TalentModule() {
  const [tab, setTab] = useState('performance');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Talent</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Manage performance, learning, career growth, and employee engagement
        </p>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto bg-transparent p-0 gap-1 flex-wrap">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 data-[state=active]:bg-transparent bg-transparent"
              >
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="performance" className="mt-0"><HRISPerformance /></TabsContent>
          <TabsContent value="training" className="mt-0"><TalentTraining /></TabsContent>
          <TabsContent value="career" className="mt-0"><TalentCareerPaths /></TabsContent>
          <TabsContent value="mentorship" className="mt-0"><TalentMentorships /></TabsContent>
          <TabsContent value="internships" className="mt-0"><TalentInternships /></TabsContent>
          <TabsContent value="skills" className="mt-0"><TalentSkills /></TabsContent>
          <TabsContent value="surveys" className="mt-0"><TalentSurveys /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}