import { useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, ExternalLink, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useUnsavedChangesGuard from '@/components/hooks/useUnsavedChangesGuard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ProjectType } from '@/types/enums';

const EMPTY_FORM = {
  name: '',
  project_type: ProjectType.PROJECT,
  description: '',
  status: 'planning',
  priority: 'medium',
  company_id: '',
  budget: '',
  budget_spent: 0,
  progress: 0,
  team_members: [],
  project_type_data: {},
};

const PROJECT_TYPE_OPTIONS = [
  { value: ProjectType.PROJECT, label: 'Project' },
  { value: ProjectType.PHOTO_VIDEO_SHOOT, label: 'Photo/Video Shoot' },
  { value: ProjectType.GRAPHIC_DESIGN, label: 'Graphic Design' },
  { value: ProjectType.PHOTO_VIDEO, label: 'Photo Video' },
  { value: ProjectType.PDF_DOCUMENT, label: 'PDF/Document' },
];

const TYPE_DEFAULTS = {
  [ProjectType.PROJECT]: {},
  [ProjectType.PHOTO_VIDEO_SHOOT]: {
    shoot_start_at: '',
    shoot_end_at: '',
    location_text: '',
    indoor_outdoor: '',
    use_case: [],
    use_case_other: '',
    equipment_list: '',
    summary_field: '',
  },
  [ProjectType.GRAPHIC_DESIGN]: {
    google_font_family: '',
    caption_copy_text: '',
    hex_codes_colors: '',
    summary_field: '',
  },
  [ProjectType.PHOTO_VIDEO]: {
    summary_field: '',
  },
  [ProjectType.PDF_DOCUMENT]: {
    google_font_family: '',
    copy_text: '',
    hex_codes_colors: '',
    summary_field: '',
  },
};

const GOOGLE_FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Oswald',
  'Raleway',
  'Nunito',
  'Work Sans',
];

const GOOGLE_FONTS_STYLESHEET_HREF = `https://fonts.googleapis.com/css2?${GOOGLE_FONT_OPTIONS.map(
  (fontName) => `family=${encodeURIComponent(fontName).replace(/%20/g, '+')}:wght@400;500;600`
).join('&')}&display=swap`;

const USE_CASE_OPTIONS = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'website', label: 'Website' },
  { value: 'ad', label: 'Ad' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'pdf', label: 'PDF' },
  { value: 'other', label: 'Other' },
];

const FILE_PLACEHOLDER_HELPER =
  'Placeholder only for this PR. Uploading and media library support will be added later.';

function normalizeProjectTypeData(projectType, projectTypeData) {
  const defaults = TYPE_DEFAULTS[projectType] || {};
  const incoming = projectTypeData && typeof projectTypeData === 'object' ? projectTypeData : {};
  const normalized = { ...defaults, ...incoming };

  if (projectType === ProjectType.PHOTO_VIDEO_SHOOT) {
    const useCase = Array.isArray(normalized.use_case)
      ? normalized.use_case
      : typeof normalized.use_case === 'string' && normalized.use_case
        ? normalized.use_case
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [];

    normalized.use_case = useCase;
    if (!useCase.includes('other')) {
      normalized.use_case_other = '';
    }
  }

  return normalized;
}

function buildInitialFormData(project) {
  const projectType = project?.project_type || ProjectType.PROJECT;

  return {
    name: project?.name || '',
    project_type: projectType,
    description: project?.description || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium',
    company_id: project?.company_id || '',
    budget: project?.budget || '',
    budget_spent: project?.budget_spent || 0,
    progress: project?.progress || 0,
    team_members: Array.isArray(project?.team_members) ? project.team_members : [],
    project_type_data: normalizeProjectTypeData(projectType, project?.project_type_data),
  };
}

function normalizeFormDataForCompare(formData) {
  return {
    ...formData,
    team_members: [...formData.team_members],
    project_type_data: {
      ...formData.project_type_data,
      use_case: Array.isArray(formData.project_type_data?.use_case)
        ? [...formData.project_type_data.use_case]
        : formData.project_type_data?.use_case,
    },
  };
}

function FilePlaceholderField({ label }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center dark:border-gray-700 dark:bg-gray-900/40">
        <Upload className="mx-auto mb-2 h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Click or drag and drop files/folders here
        </p>
        <p className="mt-1 text-xs text-gray-500">{FILE_PLACEHOLDER_HELPER}</p>
      </div>
    </div>
  );
}

function GoogleFontField({ value, onChange }) {
  return (
    <div className="space-y-3">
      <link rel="stylesheet" href={GOOGLE_FONTS_STYLESHEET_HREF} />
      <div>
        <Label>Google Font</Label>
        <Select
          value={value || 'none'}
          onValueChange={(nextValue) => onChange(nextValue === 'none' ? '' : nextValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a Google Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {GOOGLE_FONT_OPTIONS.map((fontName) => (
              <SelectItem key={fontName} value={fontName}>
                <span style={{ fontFamily: `'${fontName}', sans-serif` }}>{fontName}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Preview</p>
        <p
          className="mt-2 text-base"
          style={value ? { fontFamily: `'${value}', sans-serif` } : undefined}
        >
          {value
            ? `The quick brown fox jumps over the lazy dog in ${value}.`
            : 'Select a Google Font to preview it here.'}
        </p>
      </div>
    </div>
  );
}

export default function ProjectModal({
  open,
  onClose,
  project,
  companies,
  contacts: _contacts,
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [initialFormData, setInitialFormData] = useState(EMPTY_FORM);
  const [memberEmail, setMemberEmail] = useState('');
  const [pendingProjectType, setPendingProjectType] = useState(null);
  const [showTypeSwitchConfirm, setShowTypeSwitchConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextFormData = buildInitialFormData(project);
    setFormData(nextFormData);
    setInitialFormData(nextFormData);
    setMemberEmail('');
    setPendingProjectType(null);
    setShowTypeSwitchConfirm(false);
  }, [project, open]);

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(normalizeFormDataForCompare(formData)) !==
      JSON.stringify(normalizeFormDataForCompare(initialFormData))
    );
  }, [formData, initialFormData]);

  const { guardedClose, discardDialogProps } = useUnsavedChangesGuard({ isDirty, onClose });

  const updateFormField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateProjectTypeField = (field, value) => {
    setFormData((current) => ({
      ...current,
      project_type_data: {
        ...current.project_type_data,
        [field]: value,
      },
    }));
  };

  const handleProjectTypeChange = (nextType) => {
    if (nextType === formData.project_type) {
      return;
    }

    if (isDirty) {
      setPendingProjectType(nextType);
      setShowTypeSwitchConfirm(true);
      return;
    }

    setFormData((current) => ({
      ...current,
      project_type: nextType,
      project_type_data: normalizeProjectTypeData(nextType),
    }));
  };

  const confirmProjectTypeChange = () => {
    if (!pendingProjectType) {
      return;
    }

    setFormData((current) => ({
      ...current,
      project_type: pendingProjectType,
      project_type_data: normalizeProjectTypeData(pendingProjectType),
    }));
    setPendingProjectType(null);
    setShowTypeSwitchConfirm(false);
  };

  const addTeamMember = () => {
    const email = memberEmail.trim();
    if (email && !formData.team_members.includes(email)) {
      updateFormField('team_members', [...formData.team_members, email]);
      setMemberEmail('');
    }
  };

  const removeTeamMember = (email) => {
    updateFormField(
      'team_members',
      formData.team_members.filter((member) => member !== email)
    );
  };

  const toggleUseCase = (useCaseValue, checked) => {
    const selected = formData.project_type_data.use_case || [];
    const nextSelected = checked
      ? [...selected, useCaseValue]
      : selected.filter((value) => value !== useCaseValue);

    updateProjectTypeField('use_case', nextSelected);
    if (!nextSelected.includes('other')) {
      updateProjectTypeField('use_case_other', '');
    }
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      project_type_data: normalizeProjectTypeData(
        formData.project_type,
        formData.project_type_data
      ),
    });
  };

  const openMapsLink = () => {
    const location = formData.project_type_data.location_text?.trim();
    const url = location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : 'https://www.google.com/maps';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderProjectTypeFields = () => {
    switch (formData.project_type) {
      case ProjectType.PHOTO_VIDEO_SHOOT:
        return (
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Photo/Video Shoot Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                These fields apply only to the selected project type.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shoot Start Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.project_type_data.shoot_start_at || ''}
                  onChange={(e) => updateProjectTypeField('shoot_start_at', e.target.value)}
                />
              </div>

              <div>
                <Label>Shoot End Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.project_type_data.shoot_end_at || ''}
                  onChange={(e) => updateProjectTypeField('shoot_end_at', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.project_type_data.location_text || ''}
                  onChange={(e) => updateProjectTypeField('location_text', e.target.value)}
                  placeholder="Type an address, location, or pasted pin details"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={openMapsLink}
                  className="shrink-0 gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Open Google Maps
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Type a location directly, or open Google Maps to drop a pin and paste the location
                here.
              </p>
            </div>

            <div>
              <Label>Indoor / Outdoor</Label>
              <Select
                value={formData.project_type_data.indoor_outdoor || ''}
                onValueChange={(value) => updateProjectTypeField('indoor_outdoor', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select one option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Use Case</Label>
              <div className="grid gap-2 rounded-md border border-gray-200 p-3 dark:border-gray-800">
                {USE_CASE_OPTIONS.map((option) => {
                  const isChecked = (formData.project_type_data.use_case || []).includes(
                    option.value
                  );

                  return (
                    <label key={option.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => toggleUseCase(option.value, checked === true)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>

              {(formData.project_type_data.use_case || []).includes('other') && (
                <Input
                  value={formData.project_type_data.use_case_other || ''}
                  onChange={(e) => updateProjectTypeField('use_case_other', e.target.value)}
                  placeholder="Describe the other use case"
                />
              )}
            </div>

            <div>
              <Label>Equipment List</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.equipment_list || ''}
                onChange={(e) => updateProjectTypeField('equipment_list', e.target.value)}
                placeholder="List required equipment..."
              />
            </div>

            <div>
              <Label>Summary</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.summary_field || ''}
                onChange={(e) => updateProjectTypeField('summary_field', e.target.value)}
                placeholder="Add shoot-specific notes or summary..."
              />
            </div>
          </div>
        );

      case ProjectType.GRAPHIC_DESIGN:
        return (
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Graphic Design Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                File areas are visual placeholders only in this PR.
              </p>
            </div>

            <FilePlaceholderField label="Photo / Video Files" />
            <FilePlaceholderField label="Caption Copy Files" />

            <div>
              <Label>Caption Copy</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.caption_copy_text || ''}
                onChange={(e) => updateProjectTypeField('caption_copy_text', e.target.value)}
                placeholder="Type caption copy directly..."
              />
            </div>

            <FilePlaceholderField label="Brand Guidelines" />
            <GoogleFontField
              value={formData.project_type_data.google_font_family || ''}
              onChange={(value) => updateProjectTypeField('google_font_family', value)}
            />
            <FilePlaceholderField label="Fonts" />

            <div>
              <Label>Hex Codes / Colors</Label>
              <Textarea
                rows={3}
                value={formData.project_type_data.hex_codes_colors || ''}
                onChange={(e) => updateProjectTypeField('hex_codes_colors', e.target.value)}
                placeholder="List brand colors, hex codes, and color notes..."
              />
            </div>

            <FilePlaceholderField label="Assets" />
            <FilePlaceholderField label="Example" />

            <div>
              <Label>Summary</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.summary_field || ''}
                onChange={(e) => updateProjectTypeField('summary_field', e.target.value)}
                placeholder="Add design-specific notes or summary..."
              />
            </div>
          </div>
        );

      case ProjectType.PHOTO_VIDEO:
        return (
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Photo Video Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                File areas are visual placeholders only in this PR.
              </p>
            </div>

            <FilePlaceholderField label="Photo / Video Files" />
            <FilePlaceholderField label="Filter" />
            <FilePlaceholderField label="Example" />

            <div>
              <Label>Summary</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.summary_field || ''}
                onChange={(e) => updateProjectTypeField('summary_field', e.target.value)}
                placeholder="Add editing notes or summary..."
              />
            </div>
          </div>
        );

      case ProjectType.PDF_DOCUMENT:
        return (
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                PDF / Document Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                File areas are visual placeholders only in this PR.
              </p>
            </div>

            <FilePlaceholderField label="Template" />
            <FilePlaceholderField label="Copy Files" />

            <div>
              <Label>Copy</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.copy_text || ''}
                onChange={(e) => updateProjectTypeField('copy_text', e.target.value)}
                placeholder="Type document copy directly..."
              />
            </div>

            <GoogleFontField
              value={formData.project_type_data.google_font_family || ''}
              onChange={(value) => updateProjectTypeField('google_font_family', value)}
            />
            <FilePlaceholderField label="Fonts" />

            <div>
              <Label>Hex Codes / Colors</Label>
              <Textarea
                rows={3}
                value={formData.project_type_data.hex_codes_colors || ''}
                onChange={(e) => updateProjectTypeField('hex_codes_colors', e.target.value)}
                placeholder="List brand colors, hex codes, and color notes..."
              />
            </div>

            <FilePlaceholderField label="Assets" />
            <FilePlaceholderField label="Example" />

            <div>
              <Label>Summary</Label>
              <Textarea
                rows={4}
                value={formData.project_type_data.summary_field || ''}
                onChange={(e) => updateProjectTypeField('summary_field', e.target.value)}
                placeholder="Add document-specific notes or summary..."
              />
            </div>
          </div>
        );

      case ProjectType.PROJECT:
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={guardedClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="e.g., Q1 SEO Campaign"
              />
            </div>

            <div>
              <Label>Project Type</Label>
              <Select value={formData.project_type} onValueChange={handleProjectTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                placeholder="Project description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateFormField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => updateFormField('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Company (Optional)</Label>
              <Select
                value={formData.company_id || 'none'}
                onValueChange={(value) =>
                  updateFormField('company_id', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget (Optional)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    updateFormField(
                      'budget',
                      e.target.value === '' ? '' : parseFloat(e.target.value) || ''
                    )
                  }
                  placeholder="Enter budget (optional)"
                />
              </div>

              <div>
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    updateFormField(
                      'progress',
                      e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                    )
                  }
                />
              </div>
            </div>

            <div>
              <Label>Team Members</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTeamMember();
                    }
                  }}
                />
                <Button type="button" onClick={addTeamMember} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.team_members.map((email) => (
                  <Badge key={email} variant="outline" className="gap-1">
                    {email}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTeamMember(email)} />
                  </Badge>
                ))}
              </div>
            </div>

            {renderProjectTypeFields()}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => guardedClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {project ? 'Update' : 'Create'} Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog {...discardDialogProps} />
      <ConfirmDialog
        open={showTypeSwitchConfirm}
        onClose={() => {
          setShowTypeSwitchConfirm(false);
          setPendingProjectType(null);
        }}
        onConfirm={confirmProjectTypeChange}
        title="Discard changes?"
        description="You have unsaved changes. Switching project types will replace the custom fields for this project type."
        confirmLabel="Discard and Switch"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </>
  );
}
