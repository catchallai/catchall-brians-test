import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, Trophy, Play, Square } from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export default function ABTestCard({ test, onStart, onComplete, onClick }) {
  const variantAEngagement = test.variant_a?.engagement || 0;
  const variantBEngagement = test.variant_b?.engagement || 0;
  const totalEngagement = variantAEngagement + variantBEngagement;
  const aPercent = totalEngagement > 0 ? (variantAEngagement / totalEngagement) * 100 : 50;
  const bPercent = totalEngagement > 0 ? (variantBEngagement / totalEngagement) * 100 : 50;

  return (
    <Card
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{test.name}</h4>
            <Badge className={`${statusColors[test.status]} text-xs border-0`}>{test.status}</Badge>
          </div>
        </div>
        {test.winner && (
          <div className="flex items-center gap-1 text-amber-600">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Variant {test.winner.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Variants Preview */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div
          className={`p-2 rounded-lg border ${test.winner === 'a' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Variant A</span>
            {test.winner === 'a' && <Trophy className="w-3 h-3 text-emerald-500" />}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {test.variant_a?.content || 'No content'}
          </p>
        </div>
        <div
          className={`p-2 rounded-lg border ${test.winner === 'b' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Variant B</span>
            {test.winner === 'b' && <Trophy className="w-3 h-3 text-emerald-500" />}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {test.variant_b?.content || 'No content'}
          </p>
        </div>
      </div>

      {/* Performance Comparison */}
      {test.status !== 'draft' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>A: {variantAEngagement} engagements</span>
            <span>B: {variantBEngagement} engagements</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="bg-violet-500 transition-all" style={{ width: `${aPercent}%` }} />
            <div className="bg-blue-500 transition-all" style={{ width: `${bPercent}%` }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {test.status === 'draft' && (
          <Button size="sm" className="flex-1 gap-1" onClick={() => onStart(test)}>
            <Play className="w-3 h-3" /> Start Test
          </Button>
        )}
        {test.status === 'running' && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => onComplete(test)}
          >
            <Square className="w-3 h-3" /> End Test
          </Button>
        )}
        {test.status === 'completed' && test.insights && (
          <div className="flex-1 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">{test.insights}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
