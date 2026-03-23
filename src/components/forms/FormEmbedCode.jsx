import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check, Code, FileCode, Braces } from 'lucide-react';

export default function FormEmbedCode({ open, onClose, form }) {
  const [copied, setCopied] = useState(null);

  if (!form) {
    return null;
  }

  const apiEndpoint = `${window.location.origin}/api/formSubmit`;
  const formId = form.id;

  const htmlCode = `<!-- ${form.name} Contact Form -->
<form id="contact-form-${formId}" onsubmit="submitForm(event)">
${form.fields
  ?.map((field) => {
    if (field.type === 'textarea') {
      return `  <div class="form-group">
    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
    <textarea id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
  </div>`;
    } else if (field.type === 'select') {
      return `  <div class="form-group">
    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
    <select id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
      <option value="">Select...</option>
${field.options?.map((opt) => `      <option value="${opt}">${opt}</option>`).join('\n')}
    </select>
  </div>`;
    } else if (field.type === 'checkbox') {
      return `  <div class="form-group checkbox">
    <input type="checkbox" id="${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
  </div>`;
    }
    return `  <div class="form-group">
    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
    <input type="${field.type}" id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>
  </div>`;
  })
  .join('\n')}
  <button type="submit">${form.submit_button_text || 'Submit'}</button>
  <div id="form-message" style="display: none;"></div>
</form>

<script>
async function submitForm(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('${apiEndpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId: '${formId}',
        data: data,
        sourceUrl: window.location.href
      })
    });
    
    const result = await response.json();
    const messageEl = document.getElementById('form-message');
    
    if (result.success) {
      messageEl.innerHTML = '${form.success_message || 'Thank you for your submission!'}';
      messageEl.className = 'success';
      form.reset();
    } else {
      messageEl.innerHTML = result.error || 'Something went wrong. Please try again.';
      messageEl.className = 'error';
    }
    messageEl.style.display = 'block';
  } catch (err) {
    document.getElementById('form-message').innerHTML = 'Network error. Please try again.';
    document.getElementById('form-message').style.display = 'block';
  }
}
</script>

<style>
#contact-form-${formId} {
  max-width: 500px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, sans-serif;
}
#contact-form-${formId} .form-group {
  margin-bottom: 1rem;
}
#contact-form-${formId} label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
#contact-form-${formId} input,
#contact-form-${formId} textarea,
#contact-form-${formId} select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
}
#contact-form-${formId} textarea {
  min-height: 100px;
  resize: vertical;
}
#contact-form-${formId} button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}
#contact-form-${formId} button:hover {
  background: #7c3aed;
}
#form-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
}
#form-message.success {
  background: #dcfce7;
  color: #166534;
}
#form-message.error {
  background: #fee2e2;
  color: #991b1b;
}
</style>`;

  const jsCode = `// JavaScript/Fetch API Example
const submitForm = async (formData) => {
  const response = await fetch('${apiEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      formId: '${formId}',
      data: formData,
      sourceUrl: window.location.href
    })
  });
  
  return await response.json();
};

// Example usage:
const result = await submitForm({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!'
});

if (result.success) {
  console.log('Form submitted successfully!', result);
} else {
  console.error('Error:', result.error);
}`;

  const curlCode = `# cURL Example
curl -X POST '${apiEndpoint}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "formId": "${formId}",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello from API!"
    },
    "sourceUrl": "https://example.com/contact"
  }'`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Embed Code - {form.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-sm text-violet-700 dark:text-violet-300">
              <strong>API Endpoint:</strong> {apiEndpoint}
            </p>
            <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
              <strong>Form ID:</strong> {formId}
            </p>
          </div>

          <Tabs defaultValue="html">
            <TabsList>
              <TabsTrigger value="html" className="gap-1">
                <FileCode className="w-4 h-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="js" className="gap-1">
                <Braces className="w-4 h-4" />
                JavaScript
              </TabsTrigger>
              <TabsTrigger value="curl" className="gap-1">
                <Code className="w-4 h-4" />
                cURL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="mt-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => copyToClipboard(htmlCode, 'html')}
                >
                  {copied === 'html' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'html' ? 'Copied!' : 'Copy'}
                </Button>
                <Textarea value={htmlCode} readOnly className="font-mono text-xs h-96" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Copy and paste this complete HTML snippet into your website. Includes form, styling,
                and submission handling.
              </p>
            </TabsContent>

            <TabsContent value="js" className="mt-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => copyToClipboard(jsCode, 'js')}
                >
                  {copied === 'js' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'js' ? 'Copied!' : 'Copy'}
                </Button>
                <Textarea value={jsCode} readOnly className="font-mono text-xs h-64" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Use this JavaScript code to integrate with your existing form or SPA framework.
              </p>
            </TabsContent>

            <TabsContent value="curl" className="mt-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => copyToClipboard(curlCode, 'curl')}
                >
                  {copied === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'curl' ? 'Copied!' : 'Copy'}
                </Button>
                <Textarea value={curlCode} readOnly className="font-mono text-xs h-48" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Test the API directly from your terminal or use in backend integrations.
              </p>
            </TabsContent>
          </Tabs>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
            <strong className="text-amber-700 dark:text-amber-300">Note:</strong>
            <span className="text-amber-600 dark:text-amber-400 ml-1">
              The API supports CORS, so you can submit forms from any domain.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
