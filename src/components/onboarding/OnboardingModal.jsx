import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Target,
  Search,
  Share2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  BarChart3,
} from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CatchAll Business Suite!',
    description:
      'Your complete platform for business development, CRM, sales, marketing, SEO, and more—all in one place.',
    icon: Sparkles,
    color: 'bg-violet-500',
    tips: [
      'Track aerospace opportunities and competitors',
      'Manage contacts, companies, and opportunities',
      'Monitor SEO performance and social media',
      'Automate workflows and collaborate with your team',
    ],
  },
  {
    id: 'bizdev',
    title: 'Business Development',
    description:
      'Scan aerospace industry trends, analyze competitors, and track leads with AI-powered insights.',
    icon: BarChart3,
    color: 'bg-blue-500',
    tips: [
      'Aerospace Scanner monitors industry news and opportunities',
      'Track visitor activity and score leads automatically',
      'Manage legal documents and contracts',
      'Monitor press mentions and media coverage',
    ],
    page: 'BusinessDevDashboard',
  },
  {
    id: 'crm',
    title: 'CRM & Opportunities',
    description:
      'Organize contacts, companies, and opportunities. Track deals from first touch to close.',
    icon: Users,
    color: 'bg-emerald-500',
    tips: [
      'Import and enrich contact data automatically',
      'Link contacts to multiple companies',
      'Create opportunities and track progress',
      'Use DocuTrace for document tracking and Data Rooms for secure file sharing',
    ],
    page: 'Contacts',
  },
  {
    id: 'sales',
    title: 'Sales Tools',
    description: 'Streamline your sales process with sequences, proposals, and meeting scheduling.',
    icon: Target,
    color: 'bg-cyan-500',
    tips: [
      'Enrich leads with AI-powered data',
      'Create automated email sequences',
      'Generate and track proposals',
      'Schedule meetings with integrated calendar',
    ],
    page: 'SalesHub',
  },
  {
    id: 'seo',
    title: 'SEO & Analytics',
    description:
      'Monitor website performance, track keywords, analyze backlinks, and optimize local SEO.',
    icon: Search,
    color: 'bg-amber-500',
    tips: [
      'Run comprehensive SEO audits',
      'Track keyword rankings and competitors',
      'Monitor and analyze backlinks',
      'Manage local SEO and Google Business Profile',
    ],
    page: 'SEODashboard',
  },
  {
    id: 'social',
    title: 'Social & Content',
    description:
      'Plan content, schedule posts, monitor conversations, and analyze social performance.',
    icon: Share2,
    color: 'bg-pink-500',
    tips: [
      'Create and schedule social media posts',
      'Monitor brand mentions and sentiment',
      'Build landing pages without code',
      'Track social leads and engagement',
    ],
    page: 'SocialMedia',
  },
  {
    id: 'collaboration',
    title: 'Collaboration & Communication',
    description: 'Manage projects, share knowledge, and communicate with your team in real-time.',
    icon: Building2,
    color: 'bg-indigo-500',
    tips: [
      'Create projects and assign tasks',
      'Build knowledge bases with Spaces',
      'Real-time chat and video calls with ICS',
      'Track time and manage resources',
    ],
    page: 'Projects',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description:
      "You're ready to start using CatchAll Business Suite. Explore the features and grow your business!",
    icon: CheckCircle,
    color: 'bg-emerald-500',
    tips: [
      'Customize enabled features in Settings',
      'Visit Help Center for detailed guides',
      'Use keyboard shortcuts (press ? for help)',
      'Drag navigation items to Favorites for quick access',
    ],
  },
];

export default function OnboardingModal({ open, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose(true); // true = skipped
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden" hideCloseButton>
        {/* Progress */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div
            className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            <step.icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
          <p className="text-gray-500 mb-6">{step.description}</p>

          {/* Tips */}
          <div className="bg-gray-50 rounded-xl p-4 text-left">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Tips:</h4>
            <ul className="space-y-2">
              {step.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'bg-violet-600 w-4' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
