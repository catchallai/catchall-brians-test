import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const REPORT_TYPES = [
  {
    id: 'campaign_performance',
    label: 'Campaign Performance',
    description: 'Leads, deals & revenue by campaign',
  },
  {
    id: 'contacts_by_source',
    label: 'Contacts by Source',
    description: 'Contact acquisition breakdown',
  },
  { id: 'deals_pipeline', label: 'Deals Pipeline', description: 'Deal stages and values' },
  { id: 'keyword_rankings', label: 'Keyword Rankings', description: 'SEO keyword performance' },
  {
    id: 'backlink_profile',
    label: 'Backlink Profile',
    description: 'Backlink acquisition and quality',
  },
  {
    id: 'revenue_attribution',
    label: 'Revenue Attribution',
    description: 'Revenue by campaign/keyword',
  },
];

const FIELD_OPTIONS = {
  campaign_performance: [
    { id: 'campaign_name', label: 'Campaign Name' },
    { id: 'campaign_type', label: 'Campaign Type' },
    { id: 'campaign_status', label: 'Status' },
    { id: 'leads_count', label: 'Leads Generated' },
    { id: 'deals_count', label: 'Deals Created' },
    { id: 'won_deals', label: 'Deals Won' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'budget', label: 'Budget' },
    { id: 'spent', label: 'Spent' },
    { id: 'roi', label: 'ROI %' },
  ],
  contacts_by_source: [
    { id: 'contact_name', label: 'Contact Name' },
    { id: 'email', label: 'Email' },
    { id: 'company', label: 'Company' },
    { id: 'status', label: 'Status' },
    { id: 'source', label: 'Source' },
    { id: 'created_date', label: 'Created Date' },
    { id: 'campaign', label: 'Campaign' },
  ],
  deals_pipeline: [
    { id: 'deal_title', label: 'Deal Title' },
    { id: 'value', label: 'Value' },
    { id: 'stage', label: 'Stage' },
    { id: 'contact', label: 'Contact' },
    { id: 'company', label: 'Company' },
    { id: 'probability', label: 'Probability' },
    { id: 'expected_close', label: 'Expected Close' },
    { id: 'campaign', label: 'Campaign' },
  ],
  keyword_rankings: [
    { id: 'keyword', label: 'Keyword' },
    { id: 'website', label: 'Website' },
    { id: 'position', label: 'Position' },
    { id: 'change', label: 'Position Change' },
    { id: 'volume', label: 'Search Volume' },
    { id: 'difficulty', label: 'Difficulty' },
    { id: 'campaign', label: 'Campaign' },
  ],
  backlink_profile: [
    { id: 'source_domain', label: 'Source Domain' },
    { id: 'target_url', label: 'Target URL' },
    { id: 'anchor_text', label: 'Anchor Text' },
    { id: 'domain_authority', label: 'Domain Authority' },
    { id: 'link_type', label: 'Link Type' },
    { id: 'status', label: 'Status' },
    { id: 'campaign', label: 'Campaign' },
  ],
  revenue_attribution: [
    { id: 'source', label: 'Source' },
    { id: 'source_type', label: 'Source Type' },
    { id: 'deals_count', label: 'Deals' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'avg_deal_size', label: 'Avg Deal Size' },
  ],
};

export default function ReportBuilder({ config, onChange, onGenerate }) {
  const handleTypeChange = (type) => {
    const fields = FIELD_OPTIONS[type]?.slice(0, 5).map((f) => f.id) || [];
    onChange({ ...config, reportType: type, selectedFields: fields });
  };

  const toggleField = (fieldId) => {
    const fields = config.selectedFields || [];
    const newFields = fields.includes(fieldId)
      ? fields.filter((f) => f !== fieldId)
      : [...fields, fieldId];
    onChange({ ...config, selectedFields: newFields });
  };

  const availableFields = FIELD_OPTIONS[config.reportType] || [];

  return (
    <Card className="border-0 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Report Configuration</h3>

      <div className="space-y-6">
        {/* Report Type */}
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={config.reportType || ''} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div>
                    <span className="font-medium">{type.label}</span>
                    <span className="text-gray-400 text-xs ml-2">- {type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fields Selection */}
        {config.reportType && (
          <div className="space-y-2">
            <Label>Select Fields</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-gray-50">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Checkbox
                    id={field.id}
                    checked={config.selectedFields?.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                  <label htmlFor={field.id} className="text-sm cursor-pointer">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={config.startDate || ''}
              onChange={(e) => onChange({ ...config, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={config.endDate || ''}
              onChange={(e) => onChange({ ...config, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={!config.reportType || !config.selectedFields?.length}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          Generate Report
        </Button>
      </div>
    </Card>
  );
}

export { REPORT_TYPES, FIELD_OPTIONS };
