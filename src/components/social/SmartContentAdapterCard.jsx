import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2, Copy, Check, Loader2 } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';

const PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube'];
const PLATFORM_ICONS = {
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
};
const AUDIENCES = ['b2b', 'b2c', 'enterprise', 'startup', 'general', 'technical', 'casual'];
const TONES = ['professional', 'casual', 'humorous', 'inspiring', 'educational', 'promotional'];

export default function SmartContentAdapterCard({ onAdapt, isAdapting }) {
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('general');
  const [tone, setTone] = useState('professional');
  const [adaptedContent, setAdaptedContent] = useState(null);
  const [copiedPlatform, setCopiedPlatform] = useState(null);

  const handleAdapt = async () => {
    const result = await onAdapt({
      content,
      platforms: PLATFORMS,
      audience: targetAudience,
      tone,
    });
    setAdaptedContent(result);
  };

  const copyToClipboard = (text, platform) => {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-violet-600" />
          Smart Content Adapter
        </CardTitle>
        <p className="text-sm text-gray-500">
          AI adapts your content for different platforms and audiences
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Original Content
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content here..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Target Audience
            </label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((aud) => (
                  <SelectItem key={aud} value={aud}>
                    {aud.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tone
            </label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleAdapt}
          disabled={!content.trim() || isAdapting}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          {isAdapting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adapting...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" /> Adapt for All Platforms
            </>
          )}
        </Button>

        {adaptedContent && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Adapted Content
            </h4>
            <Tabs defaultValue={PLATFORMS[0]}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
                {PLATFORMS.map((platform) => (
                  <TabsTrigger
                    key={platform}
                    value={platform}
                    className="text-xs"
                    aria-label={platform}
                  >
                    {(() => {
                      const PlatformIcon = PLATFORM_ICONS[platform];
                      return PlatformIcon ? (
                        <PlatformIcon className="w-4 h-4" />
                      ) : (
                        platform.slice(0, 2).toUpperCase()
                      );
                    })()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {PLATFORMS.map((platform) => (
                <TabsContent key={platform} value={platform} className="space-y-2">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="capitalize">{platform}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(adaptedContent[platform] || content, platform)
                        }
                      >
                        {copiedPlatform === platform ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {adaptedContent[platform] || content}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {(adaptedContent[platform] || content).length} characters
                    </p>
                  </div>
                  {adaptedContent.insights && adaptedContent.insights[platform] && (
                    <div className="text-xs text-gray-500 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      💡 {adaptedContent.insights[platform]}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
