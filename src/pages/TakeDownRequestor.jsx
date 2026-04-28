import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Shield,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Mail,
  Scale,
} from 'lucide-react';

export default function TakeDownRequestor() {
  const [formData, setFormData] = useState({
    infringement_type: '',
    infringing_url: '',
    your_content_url: '',
    platform: '',
    description: '',
    legal_basis: '',
    contact_name: '',
    contact_email: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedRequest, setGeneratedRequest] = useState(null);

  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['takedown-requests'],
    queryFn: () => base44.entities.TakedownRequest.list('-created_date'),
  });

  const saveRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.TakedownRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takedown-requests'] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TakedownRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takedown-requests'] });
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const prompt = `Generate a professional DMCA takedown notice/cease and desist letter with the following information:

Infringement Type: ${formData.infringement_type}
Infringing URL: ${formData.infringing_url}
Original Content URL: ${formData.your_content_url}
Platform: ${formData.platform}
Description: ${formData.description}
Legal Basis: ${formData.legal_basis}
Contact Name: ${formData.contact_name}
Contact Email: ${formData.contact_email}

Generate:
1. A formal takedown notice following DMCA guidelines
2. Subject line for the email
3. Key legal points to include
4. Follow-up timeline recommendations
5. Alternative dispute resolution suggestions

The letter should be professional, legally sound, and include all necessary elements for a valid takedown request.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            subject_line: { type: 'string' },
            letter_body: { type: 'string' },
            legal_points: { type: 'array', items: { type: 'string' } },
            follow_up_timeline: { type: 'string' },
            alternative_actions: { type: 'array', items: { type: 'string' } },
            platform_contact_info: { type: 'string' },
          },
        },
      });

      setGeneratedRequest(response);

      // Save the request with generated notice
      await saveRequestMutation.mutateAsync({
        ...formData,
        original_content_url: formData.your_content_url,
        generated_notice: response,
        status: 'draft',
      });
    } catch (error) {
      console.error('Error generating takedown request:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendRequest = async (requestId) => {
    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) {
        return;
      }

      // Send email via Resend
      await base44.integrations.Core.SendEmail({
        to: request.contact_email,
        subject: request.generated_notice.subject_line,
        body: request.generated_notice.letter_body,
      });

      // Update status
      await updateRequestMutation.mutateAsync({
        id: requestId,
        data: {
          status: 'sent',
          sent_date: new Date().toISOString(),
        },
      });

      toast.success('Takedown notice sent successfully!');
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request. Please try again.');
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, notes = '') => {
    await updateRequestMutation.mutateAsync({
      id: requestId,
      data: {
        status: newStatus,
        response_date:
          newStatus !== 'draft' && newStatus !== 'sent' ? new Date().toISOString() : undefined,
        resolution_notes: notes || undefined,
      },
    });
  };

  const infringementTypes = [
    { value: 'copyright', label: 'Copyright Infringement' },
    { value: 'trademark', label: 'Trademark Infringement' },
    { value: 'patent', label: 'Patent Infringement' },
    { value: 'defamation', label: 'Defamation/Libel' },
    { value: 'privacy', label: 'Privacy Violation' },
    { value: 'impersonation', label: 'Brand Impersonation' },
  ];

  const platforms = [
    'Google Search',
    'YouTube',
    'Facebook',
    'Instagram',
    'Twitter/X',
    'LinkedIn',
    'Amazon',
    'eBay',
    'Etsy',
    'WordPress',
    'Other',
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'acknowledged':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4" />;
      case 'acknowledged':
        return <FileText className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            TakeDown Requestor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate professional DMCA and legal takedown notices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Infringement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Infringement Type</Label>
                  <Select
                    value={formData.infringement_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, infringement_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {infringementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Platform/Website</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Infringing URL</Label>
                <Input
                  value={formData.infringing_url}
                  onChange={(e) => setFormData({ ...formData, infringing_url: e.target.value })}
                  placeholder="https://example.com/infringing-content"
                />
              </div>

              <div>
                <Label>Your Original Content URL</Label>
                <Input
                  value={formData.your_content_url}
                  onChange={(e) => setFormData({ ...formData, your_content_url: e.target.value })}
                  placeholder="https://yoursite.com/original-content"
                />
              </div>

              <div>
                <Label>Detailed Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe how your intellectual property is being infringed, including specific elements copied, dates, and any other relevant details..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Legal Basis</Label>
                <Textarea
                  value={formData.legal_basis}
                  onChange={(e) => setFormData({ ...formData, legal_basis: e.target.value })}
                  placeholder="Cite the legal basis for your claim (e.g., copyright registration number, trademark number, patent details, etc.)"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !formData.infringement_type || !formData.infringing_url}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Takedown Notice...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Takedown Notice
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                Legal Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <p>
                ⚠️ This tool generates template legal notices. Always consult with a qualified
                attorney before sending any legal communication.
              </p>
              <p>
                False or fraudulent takedown requests may result in legal liability under the DMCA
                and other laws.
              </p>
              <p>
                Ensure you have legitimate rights to the intellectual property before submitting a
                takedown request.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Document all evidence before sending
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Keep copies of all communications
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Follow platform-specific procedures
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Allow reasonable time for response
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request History */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {
                            infringementTypes.find((t) => t.value === request.infringement_type)
                              ?.label
                          }
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {request.infringing_url}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Platform: {request.platform} • Created:{' '}
                        {new Date(request.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRequest(request.id)}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </Button>
                      )}
                      {request.status === 'sent' && (
                        <Select
                          onValueChange={(val) => handleStatusUpdate(request.id, val)}
                          value={request.status}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="acknowledged">Acknowledged</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {generatedRequest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Takedown Notice</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (requests.length > 0) {
                    handleSendRequest(requests[0].id);
                  }
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send via Email
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm text-gray-500">Subject Line</Label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">
                  {generatedRequest.subject_line}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-500 mb-2 block">Letter Body</Label>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-white leading-relaxed">
                  {generatedRequest.letter_body}
                </pre>
              </div>
            </div>

            {generatedRequest.platform_contact_info && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Platform Contact Information
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {generatedRequest.platform_contact_info}
                </p>
              </div>
            )}

            {generatedRequest.legal_points && generatedRequest.legal_points.length > 0 && (
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Key Legal Points</Label>
                <ul className="space-y-2">
                  {generatedRequest.legal_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Scale className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generatedRequest.follow_up_timeline && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-2">
                  Follow-up Timeline
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {generatedRequest.follow_up_timeline}
                </p>
              </div>
            )}

            {generatedRequest.alternative_actions &&
              generatedRequest.alternative_actions.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">Alternative Actions</Label>
                  <ul className="space-y-2">
                    {generatedRequest.alternative_actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
