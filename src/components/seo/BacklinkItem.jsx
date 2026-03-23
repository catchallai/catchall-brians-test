import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Link2, ShieldX, AlertTriangle } from 'lucide-react';

export default function BacklinkItem({ backlink, onDisavow }) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-red-100 text-red-700',
    broken: 'bg-amber-100 text-amber-700',
    disavowed: 'bg-gray-100 text-gray-500',
  };

  const isBadBacklink =
    backlink.is_toxic || backlink.domain_authority < 10 || backlink.status === 'broken';

  const typeColors = {
    dofollow: 'bg-emerald-100 text-emerald-700',
    nofollow: 'bg-gray-100 text-gray-600',
    ugc: 'bg-blue-100 text-blue-700',
    sponsored: 'bg-violet-100 text-violet-700',
  };

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border transition-all ${
        backlink.status === 'disavowed'
          ? 'border-gray-200 dark:border-gray-700 opacity-60'
          : isBadBacklink
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${isBadBacklink && backlink.status !== 'disavowed' ? 'bg-red-100' : 'bg-violet-50 dark:bg-violet-900/30'}`}
      >
        {isBadBacklink && backlink.status !== 'disavowed' ? (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        ) : (
          <Link2 className="w-4 h-4 text-violet-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={`font-medium truncate ${backlink.status === 'disavowed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}
          >
            {backlink.source_domain}
          </h4>
          <Badge className={`${statusColors[backlink.status]} text-xs border-0`}>
            {backlink.status}
          </Badge>
          {backlink.link_type && (
            <Badge className={`${typeColors[backlink.link_type]} text-xs border-0`}>
              {backlink.link_type}
            </Badge>
          )}
          {backlink.is_toxic && (
            <Badge className="bg-red-100 text-red-700 text-xs border-0">Toxic</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mb-2">{backlink.source_url}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>
            DA:{' '}
            <span
              className={`font-medium ${backlink.domain_authority < 10 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {backlink.domain_authority || '-'}
            </span>
          </span>
          {backlink.anchor_text && (
            <span>
              Anchor:{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                "{backlink.anchor_text}"
              </span>
            </span>
          )}
          {backlink.disavow_reason && (
            <span className="text-gray-400">Reason: {backlink.disavow_reason}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {backlink.status !== 'disavowed' && onDisavow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisavow(backlink)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Disavow this backlink"
          >
            <ShieldX className="w-4 h-4" />
          </Button>
        )}
        <a
          href={backlink.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
      </div>
    </div>
  );
}
