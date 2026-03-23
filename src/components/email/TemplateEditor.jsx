import { useState } from 'react';
import ReactQuill from 'react-quill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Eye } from 'lucide-react';

const AVAILABLE_VARIABLES = [
  '{{first_name}}',
  '{{last_name}}',
  '{{email}}',
  '{{company_name}}',
  '{{job_title}}',
  '{{sender_name}}',
  '{{unsubscribe_link}}',
];

export default function TemplateEditor({ value, onChange, subject }) {
  const [activeTab, setActiveTab] = useState('editor');

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'align',
    'link',
    'image',
  ];

  const renderPreview = () => {
    let previewContent = value;
    AVAILABLE_VARIABLES.forEach((variable) => {
      const placeholder = variable.replace('{{', '').replace('}}', '').replace(/_/g, ' ');
      previewContent = previewContent.replace(
        new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'),
        `[${placeholder}]`
      );
    });
    return previewContent;
  };

  return (
    <div className="space-y-4">
      {/* Variable Helpers */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Variables:
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
                onClick={() => {
                  onChange(value + ' ' + variable);
                }}
              >
                {variable}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor" className="gap-2">
            <Code className="w-4 h-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4">
          <ReactQuill
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            theme="snow"
            className="bg-white dark:bg-gray-800 rounded-lg"
            style={{ height: '300px', marginBottom: '50px' }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              {subject && (
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Subject:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{subject}</p>
                </div>
              )}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
