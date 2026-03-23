import { useState } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeatureTooltip({
  title,
  description,
  learnMoreLink,
  position = 'bottom-right',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2',
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 hover:bg-violet-200 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute z-50 w-72 bg-white rounded-xl shadow-xl border p-4 ${positionClasses[position]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{title}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            {learnMoreLink && (
              <Link
                to={createPageUrl('HelpCenter') + `?article=${learnMoreLink}`}
                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                Learn more <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
