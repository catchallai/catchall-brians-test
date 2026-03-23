import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Filter, X, Save } from 'lucide-react';

export default function AdvancedFilters({ onApply, onSaveAsAlert }) {
  const [filters, setFilters] = useState({
    company_type: 'all',
    revenue_growth_min: '',
    employee_count_min: '',
    news_sentiment: [],
    rd_focus_keywords: '',
    contract_value_min: '',
    funding_round_types: [],
    incident_severity: [],
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      company_type: 'all',
      revenue_growth_min: '',
      employee_count_min: '',
      news_sentiment: [],
      rd_focus_keywords: '',
      contract_value_min: '',
      funding_round_types: [],
      incident_severity: [],
    };
    setFilters(clearedFilters);
    onApply(clearedFilters);
  };

  const toggleSentiment = (sentiment) => {
    setFilters((prev) => ({
      ...prev,
      news_sentiment: prev.news_sentiment.includes(sentiment)
        ? prev.news_sentiment.filter((s) => s !== sentiment)
        : [...prev.news_sentiment, sentiment],
    }));
  };

  const toggleSeverity = (severity) => {
    setFilters((prev) => ({
      ...prev,
      incident_severity: prev.incident_severity.includes(severity)
        ? prev.incident_severity.filter((s) => s !== severity)
        : [...prev.incident_severity, severity],
    }));
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'company_type' && value === 'all') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '';
  }).length;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-sm gap-2 justify-start"
      >
        <Filter className="w-4 h-4" />
        Advanced Filters
        {activeFilterCount > 0 && (
          <Badge className="ml-auto bg-violet-600 text-white">{activeFilterCount}</Badge>
        )}
      </Button>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-violet-500" />
              Advanced Filters
            </DialogTitle>
            <DialogDescription>Filter companies by specific criteria</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Type */}
              <div>
                <Label>Company Type</Label>
                <Select
                  value={filters.company_type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, company_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="public">Public Only</SelectItem>
                    <SelectItem value="private">Private Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Revenue Growth */}
              <div>
                <Label>Min Revenue Growth (%)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 15"
                  value={filters.revenue_growth_min}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, revenue_growth_min: e.target.value }))
                  }
                />
              </div>

              {/* Employee Count */}
              <div>
                <Label>Min Employee Count</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1000"
                  value={filters.employee_count_min}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, employee_count_min: e.target.value }))
                  }
                />
              </div>

              {/* Contract Value */}
              <div>
                <Label>Min Contract Value (millions)</Label>
                <Input
                  placeholder="e.g., 100"
                  value={filters.contract_value_min}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, contract_value_min: e.target.value }))
                  }
                />
              </div>

              {/* R&D Focus Keywords */}
              <div className="md:col-span-2">
                <Label>R&D Focus Keywords (comma-separated)</Label>
                <Input
                  placeholder="e.g., AI, autonomous systems, electric propulsion"
                  value={filters.rd_focus_keywords}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, rd_focus_keywords: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* News Sentiment */}
            <div>
              <Label className="mb-2 block">News Sentiment</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.news_sentiment.includes('positive') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSentiment('positive')}
                  className={filters.news_sentiment.includes('positive') ? 'bg-green-600' : ''}
                >
                  Positive
                </Button>
                <Button
                  variant={filters.news_sentiment.includes('neutral') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSentiment('neutral')}
                  className={filters.news_sentiment.includes('neutral') ? 'bg-gray-600' : ''}
                >
                  Neutral
                </Button>
                <Button
                  variant={filters.news_sentiment.includes('negative') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSentiment('negative')}
                  className={filters.news_sentiment.includes('negative') ? 'bg-red-600' : ''}
                >
                  Negative
                </Button>
              </div>
            </div>

            {/* Incident Severity */}
            <div>
              <Label className="mb-2 block">Incident Severity (exclude)</Label>
              <div className="flex gap-2">
                <Button
                  variant={filters.incident_severity.includes('low') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSeverity('low')}
                >
                  Low
                </Button>
                <Button
                  variant={filters.incident_severity.includes('medium') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSeverity('medium')}
                >
                  Medium
                </Button>
                <Button
                  variant={filters.incident_severity.includes('high') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSeverity('high')}
                >
                  High
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={() => onSaveAsAlert(filters)}>
                <Save className="w-4 h-4 mr-2" />
                Save as Alert
              </Button>
            )}
            <Button
              onClick={() => {
                handleApply();
                setShowFilters(false);
              }}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
