import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Filter } from 'lucide-react';

export default function ReportFilters({ filters, onChange, reportType, campaigns, websites }) {
  const addFilter = () => {
    onChange([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const updateFilter = (index, updates) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const removeFilter = (index) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const getFilterFields = () => {
    switch (reportType) {
      case 'campaign_performance':
        return [
          {
            id: 'campaign_type',
            label: 'Campaign Type',
            type: 'select',
            options: [
              'email',
              'social_media',
              'ppc',
              'content',
              'seo',
              'event',
              'referral',
              'other',
            ],
          },
          {
            id: 'campaign_status',
            label: 'Status',
            type: 'select',
            options: ['draft', 'active', 'paused', 'completed'],
          },
          { id: 'revenue', label: 'Revenue', type: 'number' },
          { id: 'leads_count', label: 'Leads Count', type: 'number' },
        ];
      case 'contacts_by_source':
        return [
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: ['lead', 'prospect', 'customer', 'churned'],
          },
          {
            id: 'source',
            label: 'Source',
            type: 'select',
            options: ['website', 'referral', 'linkedin', 'cold_outreach', 'event', 'other'],
          },
          { id: 'campaign_id', label: 'Campaign', type: 'campaign' },
        ];
      case 'deals_pipeline':
        return [
          {
            id: 'stage',
            label: 'Stage',
            type: 'select',
            options: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
          },
          { id: 'value', label: 'Value', type: 'number' },
          { id: 'campaign_id', label: 'Campaign', type: 'campaign' },
        ];
      case 'keyword_rankings':
        return [
          { id: 'position', label: 'Position', type: 'number' },
          { id: 'volume', label: 'Search Volume', type: 'number' },
          { id: 'difficulty', label: 'Difficulty', type: 'number' },
          { id: 'website_id', label: 'Website', type: 'website' },
          { id: 'campaign_id', label: 'Campaign', type: 'campaign' },
        ];
      case 'backlink_profile':
        return [
          {
            id: 'link_type',
            label: 'Link Type',
            type: 'select',
            options: ['dofollow', 'nofollow', 'ugc', 'sponsored'],
          },
          { id: 'status', label: 'Status', type: 'select', options: ['active', 'lost', 'broken'] },
          { id: 'domain_authority', label: 'Domain Authority', type: 'number' },
          { id: 'campaign_id', label: 'Campaign', type: 'campaign' },
        ];
      default:
        return [];
    }
  };

  const filterFields = getFilterFields();

  return (
    <Card className="border-0 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <h4 className="font-medium text-gray-900">Filters</h4>
        </div>
        <Button variant="outline" size="sm" onClick={addFilter} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Filter
        </Button>
      </div>

      {filters.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No filters applied</p>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={filter.field}
                onValueChange={(value) => updateFilter(index, { field: value, value: '' })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {filterFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(value) => updateFilter(index, { operator: value })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>

              {(() => {
                const fieldConfig = filterFields.find((f) => f.id === filter.field);
                if (fieldConfig?.type === 'select') {
                  return (
                    <Select
                      value={filter.value}
                      onValueChange={(value) => updateFilter(index, { value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Value" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldConfig.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                } else if (fieldConfig?.type === 'campaign') {
                  return (
                    <Select
                      value={filter.value}
                      onValueChange={(value) => updateFilter(index, { value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                } else if (fieldConfig?.type === 'website') {
                  return (
                    <Select
                      value={filter.value}
                      onValueChange={(value) => updateFilter(index, { value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select website" />
                      </SelectTrigger>
                      <SelectContent>
                        {websites?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                } else {
                  return (
                    <Input
                      type={fieldConfig?.type === 'number' ? 'number' : 'text'}
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />
                  );
                }
              })()}

              <Button variant="ghost" size="icon" onClick={() => removeFilter(index)}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
