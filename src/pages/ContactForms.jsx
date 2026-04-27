import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FileText,
  Code,
  Trash2,
  Settings,
  Inbox,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import ContactFormBuilder from '@/components/forms/ContactFormBuilder';
import FormSubmissionsList from '@/components/forms/FormSubmissionsList';
import FormEmbedCode from '@/components/forms/FormEmbedCode';
import EmptyState from '@/components/ui/EmptyState';

export default function ContactForms() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [showEmbedCode, setShowEmbedCode] = useState(null);
  const queryClient = useQueryClient();

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['contact-forms'],
    queryFn: () => base44.entities.ContactForm.list('-created_date', 50),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: () => base44.entities.FormSubmission.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      editingForm
        ? base44.entities.ContactForm.update(editingForm.id, data)
        : base44.entities.ContactForm.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-forms'] });
      setShowBuilder(false);
      setEditingForm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactForm.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-forms'] }),
  });

  const getWebsite = (id) => websites.find((w) => w.id === id);
  const getSubmissionCount = (formId) => submissions.filter((s) => s.form_id === formId).length;
  const getNewSubmissionCount = (formId) =>
    submissions.filter((s) => s.form_id === formId && s.status === 'new').length;

  const totalSubmissions = submissions.length;
  const newSubmissions = submissions.filter((s) => s.status === 'new').length;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Forms</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage contact forms for your websites
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingForm(null);
            setShowBuilder(true);
          }}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Create Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{forms.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Forms</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">
              {forms.filter((f) => f.is_active).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Inbox className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{totalSubmissions}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{newSubmissions}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">New</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1">
            Submissions
            {newSubmissions > 0 && (
              <Badge className="bg-amber-500 text-white text-xs ml-1">{newSubmissions}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-4">
          {forms.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No contact forms"
              description="Create your first contact form to capture leads from your website."
              actionLabel="Create Form"
              onAction={() => setShowBuilder(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => {
                const website = getWebsite(form.website_id);
                const submissionCount = getSubmissionCount(form.id);
                const newCount = getNewSubmissionCount(form.id);

                return (
                  <Card
                    key={form.id}
                    className="border-0 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {form.name}
                            </h3>
                            {website && <p className="text-xs text-gray-500">{website.name}</p>}
                          </div>
                        </div>
                        <Badge
                          className={
                            form.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {form.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{form.fields?.length || 0} fields</span>
                        <span>•</span>
                        <span>{submissionCount} submissions</span>
                        {newCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            {newCount} new
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            setEditingForm(form);
                            setShowBuilder(true);
                          }}
                        >
                          <Settings className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setShowEmbedCode(form)}
                        >
                          <Code className="w-3 h-3" />
                          Embed
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(form.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <FormSubmissionsList submissions={submissions} forms={forms} />
        </TabsContent>
      </Tabs>

      {/* Form Builder Modal */}
      <ContactFormBuilder
        open={showBuilder}
        onClose={() => {
          setShowBuilder(false);
          setEditingForm(null);
        }}
        form={editingForm}
        websites={websites}
        onSave={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Embed Code Modal */}
      <FormEmbedCode
        open={!!showEmbedCode}
        onClose={() => setShowEmbedCode(null)}
        form={showEmbedCode}
      />
    </div>
  );
}
