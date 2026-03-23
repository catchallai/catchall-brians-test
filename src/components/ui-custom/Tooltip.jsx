import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 300,
  disableHover = false,
}) {
  if (disableHover) {
    return children;
  }
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <ShadcnTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
}

// Feature tooltip for onboarding
export function FeatureTooltip({
  children,
  title,
  description,
  step,
  totalSteps,
  onDismiss,
  show,
}) {
  if (!show) {
    return children;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute z-50 top-full left-0 mt-2 w-72 p-4 glass-card rounded-xl shadow-xl">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
          {step && totalSteps && (
            <span className="text-xs text-gray-500">
              {step}/{totalSteps}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
        <button
          onClick={onDismiss}
          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
