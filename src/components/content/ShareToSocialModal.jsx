import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, Clock, Send, Wand2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PLATFORMS as PLATFORM_CONFIGS } from '@/constants/platforms';

// Light muted color theme — intentional for this content-sharing context (not the social calendar)
const PLATFORM_LIGHT_COLORS = {
  Twitter: 'bg-sky-100 text-sky-700',
  LinkedIn: 'bg-blue-100 text-blue-700',
  Facebook: 'bg-indigo-100 text-indigo-700',
  Instagram: 'bg-pink-100 text-pink-700',
};

const PLATFORMS = PLATFORM_CONFIGS.filter((p) => p.id in PLATFORM_LIGHT_COLORS).map((p) => ({
  id: p.id.toLowerCase(),
  name: p.id === 'Twitter' ? 'Twitter/X' : p.label,
  icon: p.icon,
  color: PLATFORM_LIGHT_COLORS[p.id],
  maxLength: p.limit,
}));

export default function ShareToSocialModal({ open, onClose, article, brief }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'twitter']);
  const [socialCopy, setSocialCopy] = useState({
    twitter: '',
    linkedin: '',
    facebook: '',
    instagram: '',
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState(null);
  const queryClient = useQueryClient();

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date', 10),
  });

  const contentTitle = article?.title || brief?.title || 'Untitled';
  const contentSummary = article?.meta_description || brief?.target_keyword || '';

  const generateCopyMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate engaging social media copy for the following content:

Title: ${contentTitle}
Summary: ${contentSummary}
${article?.content ? `Content excerpt: ${article.content.slice(0, 500)}...` : ''}

Generate copy for each platform with appropriate tone and length:
1. Twitter (max 250 chars, punchy, hashtags)
2. LinkedIn (professional, 200-400 chars, industry insights)
3. Facebook (conversational, engaging, 150-300 chars)
4. Instagram (visual-focused, emoji-friendly, hashtags, 150-300 chars)

Include relevant hashtags and a call-to-action where appropriate.`,
        response_json_schema: {
          type: 'object',
          properties: {
            twitter: { type: 'string' },
            linkedin: { type: 'string' },
            facebook: { type: 'string' },
            instagram: { type: 'string' },
          },
        },
      });
      return result;
    },
    onSuccess: (result) => {
      setSocialCopy(result);
      setIsGenerating(false);
      toast.success('Social copy generated');
    },
    onError: () => {
      setIsGenerating(false);
      toast.error('Failed to generate copy');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const posts = [];
      for (const platformId of selectedPlatforms) {
        if (socialCopy[platformId]) {
          const post = await base44.entities.CalendarPost.create({
            title: contentTitle,
            caption: socialCopy[platformId],
            platforms: [platformId],
            scheduled_date: scheduleDate || format(new Date(), 'yyyy-MM-dd'),
            scheduled_time: scheduleTime,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            status: scheduleDate ? 'approved' : 'draft',
            brand_id: brands[0]?.id,
          });
          posts.push(post);
        }
      }
      return posts;
    },
    onSuccess: (posts) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      toast.success(`${posts.length} post(s) scheduled`);
      onClose();
    },
    onError: () => toast.error('Failed to schedule posts'),
  });

  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const copyToClipboard = (platformId) => {
    navigator.clipboard.writeText(socialCopy[platformId]);
    setCopiedPlatform(platformId);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const getCharCount = (platformId) => {
    const text = socialCopy[platformId] || '';
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return { current: text.length, max: platform?.maxLength || 280 };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-violet-600" />
            Share to Social Media
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Content Preview */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-1">Sharing content:</p>
              <p className="font-medium text-gray-900 dark:text-white">{contentTitle}</p>
              {contentSummary && <p className="text-sm text-gray-500 mt-1">{contentSummary}</p>}
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <div>
            <Label className="mb-3 block">Select Platforms</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isSelected} />
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Copy Button */}
          <Button
            onClick={() => generateCopyMutation.mutate()}
            disabled={isGenerating || selectedPlatforms.length === 0}
            className="w-full gap-2"
            variant="outline"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generate AI Copy for Selected Platforms
          </Button>

          {/* Social Copy Editors */}
          {selectedPlatforms.length > 0 && (
            <Tabs defaultValue={selectedPlatforms[0]}>
              <TabsList className="w-full">
                {selectedPlatforms.map((platformId) => {
                  const platform = PLATFORMS.find((p) => p.id === platformId);
                  const Icon = platform.icon;
                  return (
                    <TabsTrigger key={platformId} value={platformId} className="gap-1">
                      <Icon className="w-4 h-4" />
                      {platform.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {selectedPlatforms.map((platformId) => {
                const platform = PLATFORMS.find((p) => p.id === platformId);
                const charCount = getCharCount(platformId);
                const isOverLimit = charCount.current > charCount.max;

                return (
                  <TabsContent key={platformId} value={platformId} className="mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={platform.color}>{platform.name}</Badge>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}
                          >
                            {charCount.current}/{charCount.max}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(platformId)}
                            className="h-7 px-2"
                          >
                            {copiedPlatform === platformId ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        placeholder={`Write your ${platform.name} post...`}
                        value={socialCopy[platformId]}
                        onChange={(e) =>
                          setSocialCopy((prev) => ({ ...prev, [platformId]: e.target.value }))
                        }
                        rows={4}
                        className={isOverLimit ? 'border-red-500' : ''}
                      />
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          {/* Schedule Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Date
              </Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => scheduleMutation.mutate()}
              disabled={
                scheduleMutation.isPending ||
                selectedPlatforms.length === 0 ||
                !selectedPlatforms.some((p) => socialCopy[p])
              }
              className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {scheduleDate ? 'Schedule Posts' : 'Save as Draft'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
