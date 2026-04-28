import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

const getQualityGrade = (score) => {
  if (score >= 90) {
    return { grade: 'A', color: 'bg-green-100 text-green-700', label: 'Excellent' };
  }
  if (score >= 75) {
    return { grade: 'B', color: 'bg-blue-100 text-blue-700', label: 'Good' };
  }
  if (score >= 60) {
    return { grade: 'C', color: 'bg-yellow-100 text-yellow-700', label: 'Fair' };
  }
  return { grade: 'D', color: 'bg-red-100 text-red-700', label: 'Poor' };
};

export default function EnrichmentQualityDisplay({ lead }) {
  if (!lead) {
    return null;
  }

  const quality = getQualityGrade(lead.enrichment_score || 0);
  const hasEmail = !!lead.email;
  const hasPhone = !!lead.phone;
  const hasExperience = lead.experience?.length > 0;
  const hasEducation = lead.education?.length > 0;
  const hasSkills = lead.skills?.length > 0;

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Data Quality</h4>
            <p className="text-xs text-gray-500 mt-0.5">Enrichment completeness</p>
          </div>
          <Badge className={quality.color}>
            {quality.grade} - {quality.label}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Overall Score</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {lead.enrichment_score}/100
            </span>
          </div>
          <Progress value={lead.enrichment_score} className="h-1.5" />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={hasEmail ? '✓ text-green-600' : '✗ text-gray-400'}>
              {hasEmail ? '✓' : '✗'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={hasPhone ? '✓ text-green-600' : '✗ text-gray-400'}>
              {hasPhone ? '✓' : '✗'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Phone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={hasExperience ? '✓ text-green-600' : '✗ text-gray-400'}>
              {hasExperience ? '✓' : '✗'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Experience</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={hasEducation ? '✓ text-green-600' : '✗ text-gray-400'}>
              {hasEducation ? '✓' : '✗'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">Education</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={hasSkills ? '✓ text-green-600' : '✗ text-gray-400'}>
              {hasSkills ? '✓' : '✗'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Skills ({lead.skills?.length || 0})
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            {lead.connections || 0} connections
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
