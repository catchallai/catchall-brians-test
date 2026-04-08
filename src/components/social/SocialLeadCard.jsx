import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  User,
  Building2,
  Target,
  MessageSquare,
  Heart,
  Share2,
  AtSign,
  Sparkles,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

// Light muted color theme — intentional for lead cards (not the social calendar)
const LEAD_CARD_PLATFORM_COLORS = {
  twitter: 'bg-sky-100 text-sky-700',
  linkedin: 'bg-blue-100 text-blue-700',
  facebook: 'bg-indigo-100 text-indigo-700',
  instagram: 'bg-pink-100 text-pink-700',
  youtube: 'bg-red-100 text-red-700',
};

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-violet-100 text-violet-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-100 text-gray-700',
};

const interactionIcons = {
  comment: MessageSquare,
  like: Heart,
  share: Share2,
  mention: AtSign,
  dm: MessageSquare,
  follow: User,
  inquiry: MessageSquare,
  complaint: MessageSquare,
};

export default function SocialLeadCard({ lead, contact, company, deal, mention, onClick }) {
  const platformEntry = PLATFORM_MAP_LOWER[lead.platform];
  const PlatformIcon = platformEntry?.icon;
  const platformColor = LEAD_CARD_PLATFORM_COLORS[lead.platform] || 'bg-gray-100 text-gray-700';
  const InteractionIcon = interactionIcons[lead.interaction_type] || MessageSquare;

  return (
    <Card
      className="glass-card rounded-2xl hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${platformColor} flex items-center justify-center shrink-0`}
          >
            {PlatformIcon && <PlatformIcon size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 truncate">@{lead.social_handle}</h4>
              <Badge className={`${statusColors[lead.status]} text-xs border-0`}>
                {lead.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${platformColor} text-xs border-0`}>{lead.platform}</Badge>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <InteractionIcon className="w-3 h-3" />
                {lead.interaction_type}
              </span>
            </div>

            {lead.interaction_content && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                "{lead.interaction_content}"
              </p>
            )}

            {/* Lead Score & AI Discovery Badge */}
            {(lead.lead_score > 0 || lead.source === 'ai_scan') && (
              <div className="flex items-center gap-3 mb-2">
                {lead.lead_score > 0 && (
                  <div className="flex items-center gap-2 flex-1">
                    <TrendingUp className="w-3 h-3 text-gray-400" />
                    <Progress value={lead.lead_score} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-gray-600">{lead.lead_score}</span>
                  </div>
                )}
                {lead.source === 'ai_scan' && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs border-0 gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </Badge>
                )}
              </div>
            )}

            {/* Intent Signals */}
            {lead.intent_signals?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {lead.intent_signals.slice(0, 3).map((signal, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs bg-violet-50 text-violet-700 border-violet-200"
                  >
                    {signal}
                  </Badge>
                ))}
              </div>
            )}

            {/* Linked Mention Info */}
            {mention && (
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <Radio className="w-3 h-3" />
                <span>{mention.author_followers?.toLocaleString() || 0} followers</span>
                <span>•</span>
                <span>
                  {(mention.likes || 0) + (mention.comments || 0) + (mention.shares || 0)}{' '}
                  engagements
                </span>
              </div>
            )}

            {/* Linked CRM entities */}
            <div className="flex flex-wrap gap-2">
              {contact && (
                <Badge variant="outline" className="text-xs gap-1">
                  <User className="w-3 h-3" />
                  {contact.first_name} {contact.last_name}
                </Badge>
              )}
              {company && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Building2 className="w-3 h-3" />
                  {company.name}
                </Badge>
              )}
              {deal && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Target className="w-3 h-3" />
                  {deal.title}
                </Badge>
              )}
            </div>

            {lead.profile_url && (
              <a
                href={lead.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-violet-600 hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                View Profile
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
