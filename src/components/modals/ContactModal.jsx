import { useState, useEffect } from 'react';
import { validateForm, sanitizeObject } from '@/components/utils/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, CheckSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ContactModal({
  open,
  onClose,
  contact,
  companies,
  onSave,
  isLoading,
  allowMultipleCompanies = false,
}) {
  const [showTaskSection, setShowTaskSection] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
    company_ids: [],
    job_title: '',
    linkedin_url: '',
    status: 'lead',
    source: '',
    notes: '',
    tier: '',
    category: '',
    country: '',
    hq_city: '',
    website: '',
    contact_page_url: '',
    general_emails: [],
    general_phones: [],
    contact_sources_urls: [],
    role_1_title: '',
    role_1_name: '',
    role_1_email: '',
    role_1_phone: '',
    role_1_source_url: '',
    role_2_title: '',
    role_2_name: '',
    role_2_email: '',
    role_2_phone: '',
    role_2_source_url: '',
    signer_title: '',
    signer_name: '',
    signer_email: '',
    signer_phone: '',
    signer_source_url: '',
    loi_summary: '',
    loi_source_urls: [],
    notes_angle: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (contact) {
      setFormData({
        company_name: contact.company_name || '',
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company_id: contact.company_id || '',
        company_ids: contact.company_ids || [],
        job_title: contact.job_title || '',
        linkedin_url: contact.linkedin_url || '',
        status: contact.status || 'lead',
        source: contact.source || '',
        notes: contact.notes || '',
        tier: contact.tier || '',
        category: contact.category || [],
        country: contact.country || '',
        hq_city: contact.hq_city || '',
        website: contact.website || '',
        contact_page_url: contact.contact_page_url || '',
        general_emails: contact.general_emails || [],
        general_phones: contact.general_phones || [],
        contact_sources_urls: contact.contact_sources_urls || [],
        role_1_title: contact.role_1_title || '',
        role_1_name: contact.role_1_name || '',
        role_1_email: contact.role_1_email || '',
        role_1_phone: contact.role_1_phone || '',
        role_1_source_url: contact.role_1_source_url || '',
        role_2_title: contact.role_2_title || '',
        role_2_name: contact.role_2_name || '',
        role_2_email: contact.role_2_email || '',
        role_2_phone: contact.role_2_phone || '',
        role_2_source_url: contact.role_2_source_url || '',
        signer_title: contact.signer_title || '',
        signer_name: contact.signer_name || '',
        signer_email: contact.signer_email || '',
        signer_phone: contact.signer_phone || '',
        signer_source_url: contact.signer_source_url || '',
        loi_summary: contact.loi_summary || '',
        loi_source_urls: contact.loi_source_urls || [],
        notes_angle: contact.notes_angle || '',
      });
    } else {
      setFormData({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: '',
        company_ids: [],
        job_title: '',
        linkedin_url: '',
        status: 'lead',
        source: '',
        notes: '',
        tier: '',
        category: [],
        country: '',
        hq_city: '',
        website: '',
        contact_page_url: '',
        general_emails: [],
        general_phones: [],
        contact_sources_urls: [],
        role_1_title: '',
        role_1_name: '',
        role_1_email: '',
        role_1_phone: '',
        role_1_source_url: '',
        role_2_title: '',
        role_2_name: '',
        role_2_email: '',
        role_2_phone: '',
        role_2_source_url: '',
        signer_title: '',
        signer_name: '',
        signer_email: '',
        signer_phone: '',
        signer_source_url: '',
        loi_summary: '',
        loi_source_urls: [],
        notes_angle: '',
      });
    }
  }, [contact, open]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validateForm(formData, {
      first_name: { required: true, message: 'First name is required' },
      email: { required: true, email: true },
      phone: { phone: true },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const sanitizedData = sanitizeObject(formData);
    onSave(sanitizedData);
  };

  const addArrayItem = (field, value) => {
    setFormData({
      ...formData,
      [field]: [...(formData[field] || []), value],
    });
  };

  const removeArrayItem = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      return;
    }
    setCreatingTask(true);
    try {
      await base44.entities.Task.create({
        title: taskTitle,
        description: taskDescription,
        status: 'todo',
      });
      setTaskTitle('');
      setTaskDescription('');
      setShowTaskSection(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={errors.first_name ? 'border-red-500' : ''}
                  />
                  {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone 1</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Firm</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Company/Firm name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tier 1">Tier 1</SelectItem>
                      <SelectItem value="Tier 2">Tier 2</SelectItem>
                      <SelectItem value="Tier 3">Tier 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category (Select Multiple)</Label>
                <div className="grid grid-cols-1 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                  {[
                    'US Fractional Charter',
                    'US Part 135 Operations',
                    'US Regional Membership',
                    'Leading France',
                    'US Regional Airlines',
                    'US Seaplane Ops',
                    'US Membership',
                    'US Charter Marketplace',
                    'US Fractional Jet Card',
                    'US Public Charter',
                    'Intl BizAv Operators',
                    'Intl Regional Charter',
                    'Intl Seaplane Charter',
                    'Corporate Flight Depts',
                    'LOI & MOU History',
                  ].map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.category || []).includes(cat)}
                        onChange={(e) => {
                          const current = formData.category || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, category: [...current, cat] });
                          } else {
                            setFormData({
                              ...formData,
                              category: current.filter((c) => c !== cat),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
                {formData.category && formData.category.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.category.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country / Region</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hq_city">HQ City</Label>
                  <Input
                    id="hq_city"
                    value={formData.hq_city}
                    onChange={(e) => setFormData({ ...formData, hq_city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_page_url">Contact Page URL</Label>
                <Input
                  id="contact_page_url"
                  value={formData.contact_page_url}
                  onChange={(e) => setFormData({ ...formData, contact_page_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>General Emails</Label>
                  <div className="space-y-2">
                    {formData.general_emails?.map((email, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={email} disabled />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('general_emails', idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add email"
                        id="new_email"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.target.value) {
                              addArrayItem('general_emails', e.target.value);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new_email');
                          if (input?.value) {
                            addArrayItem('general_emails', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>General Phones</Label>
                  <div className="space-y-2">
                    {formData.general_phones?.map((phone, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={phone} disabled />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('general_phones', idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add phone"
                        id="new_phone"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.target.value) {
                              addArrayItem('general_phones', e.target.value);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new_phone');
                          if (input?.value) {
                            addArrayItem('general_phones', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact Source URLs</Label>
                <div className="space-y-2">
                  {formData.contact_sources_urls?.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={url} disabled />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('contact_sources_urls', idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add URL"
                      id="new_source_url"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.target.value) {
                            addArrayItem('contact_sources_urls', e.target.value);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new_source_url');
                        if (input?.value) {
                          addArrayItem('contact_sources_urls', input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              {/* Primary Role */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-sm">Primary Role</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Title"
                    value={formData.role_1_title}
                    onChange={(e) => setFormData({ ...formData, role_1_title: e.target.value })}
                  />
                  <Input
                    placeholder="Name"
                    value={formData.role_1_name}
                    onChange={(e) => setFormData({ ...formData, role_1_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Email"
                    value={formData.role_1_email}
                    onChange={(e) => setFormData({ ...formData, role_1_email: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={formData.role_1_phone}
                    onChange={(e) => setFormData({ ...formData, role_1_phone: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Source URL"
                  value={formData.role_1_source_url}
                  onChange={(e) => setFormData({ ...formData, role_1_source_url: e.target.value })}
                />
              </div>

              {/* Secondary Role */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-sm">Secondary Role</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Title"
                    value={formData.role_2_title}
                    onChange={(e) => setFormData({ ...formData, role_2_title: e.target.value })}
                  />
                  <Input
                    placeholder="Name"
                    value={formData.role_2_name}
                    onChange={(e) => setFormData({ ...formData, role_2_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Email"
                    value={formData.role_2_email}
                    onChange={(e) => setFormData({ ...formData, role_2_email: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={formData.role_2_phone}
                    onChange={(e) => setFormData({ ...formData, role_2_phone: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Source URL"
                  value={formData.role_2_source_url}
                  onChange={(e) => setFormData({ ...formData, role_2_source_url: e.target.value })}
                />
              </div>

              {/* Signer / Exec Sponsor */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-sm">Signer / Exec Sponsor</h4>
                <Input
                  placeholder="Title"
                  value={formData.signer_title}
                  onChange={(e) => setFormData({ ...formData, signer_title: e.target.value })}
                />
                <Input
                  placeholder="Name"
                  value={formData.signer_name}
                  onChange={(e) => setFormData({ ...formData, signer_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Email"
                    value={formData.signer_email}
                    onChange={(e) => setFormData({ ...formData, signer_email: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={formData.signer_phone}
                    onChange={(e) => setFormData({ ...formData, signer_phone: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Source URL"
                  value={formData.signer_source_url}
                  onChange={(e) => setFormData({ ...formData, signer_source_url: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loi_summary">LOI / MOU / Prior Conditional Orders (Summary)</Label>
                <Textarea
                  id="loi_summary"
                  value={formData.loi_summary}
                  onChange={(e) => setFormData({ ...formData, loi_summary: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>LOI / MOU Source URLs</Label>
                <div className="space-y-2">
                  {formData.loi_source_urls?.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={url} disabled />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('loi_source_urls', idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add URL"
                      id="new_loi_url"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.target.value) {
                            addArrayItem('loi_source_urls', e.target.value);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new_loi_url');
                        if (input?.value) {
                          addArrayItem('loi_source_urls', input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes_angle">Notes / Angle</Label>
                <Textarea
                  id="notes_angle"
                  value={formData.notes_angle}
                  onChange={(e) => setFormData({ ...formData, notes_angle: e.target.value })}
                  rows={3}
                />
              </div>

              {allowMultipleCompanies && (
                <div className="space-y-2">
                  <Label>Link to Additional Companies</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {companies?.map((company) => (
                      <label
                        key={company.id}
                        className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.company_ids?.includes(company.id) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                company_ids: [...(formData.company_ids || []), company.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                company_ids: (formData.company_ids || []).filter(
                                  (id) => id !== company.id
                                ),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{company.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Follow-up Task Section */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <button
              type="button"
              onClick={() => setShowTaskSection(!showTaskSection)}
              className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400 mb-3"
            >
              <CheckSquare className="w-4 h-4" />
              {showTaskSection ? 'Hide' : 'Add'} Follow-up Task
            </button>
            {showTaskSection && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Task Title</Label>
                  <Input
                    placeholder="e.g., Follow up on proposal"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    disabled={creatingTask}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    placeholder="Additional details..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={2}
                    disabled={creatingTask}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTask}
                  disabled={!taskTitle.trim() || creatingTask}
                  className="w-full gap-2"
                >
                  {creatingTask && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create Task
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
