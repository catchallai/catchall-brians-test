import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Target, Search, Share2, Mail, Zap, CheckCircle, 
  ArrowRight, ArrowLeft, Sparkles, Building2, BarChart3
} from "lucide-react";

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CRM + SEO Suite!',
    description: 'Your all-in-one platform for managing customer relationships, tracking SEO performance, and growing your social media presence.',
    icon: Sparkles,
    color: 'bg-violet-500',
    tips: [
      'Manage contacts and deals in one place',
      'Track keyword rankings and backlinks',
      'Schedule social media posts with AI',
      'Automate your marketing workflows'
    ]
  },
  {
    id: 'crm',
    title: 'CRM & Lead Management',
    description: 'Organize your contacts, companies, and deals. Track every interaction and move deals through your pipeline.',
    icon: Users,
    color: 'bg-blue-500',
    tips: [
      'Add contacts and link them to companies',
      'Create deals and track their progress',
      'Log activities like calls, emails, and meetings',
      'Capture leads from social media interactions'
    ],
    page: 'Contacts'
  },
  {
    id: 'deals',
    title: 'Deal Pipeline',
    description: 'Visualize your sales pipeline and track deal stages from lead to close.',
    icon: Target,
    color: 'bg-emerald-500',
    tips: [
      'Create deals with values and expected close dates',
      'Move deals through stages: Lead → Qualified → Proposal → Won',
      'Track win probability and forecast revenue',
      'Link deals to contacts and companies'
    ],
    page: 'Deals'
  },
  {
    id: 'seo',
    title: 'SEO Tools',
    description: 'Monitor your website\'s search performance, track keywords, and analyze backlinks.',
    icon: Search,
    color: 'bg-amber-500',
    tips: [
      'Add websites to monitor their SEO health',
      'Track keyword rankings over time',
      'Discover and monitor backlinks',
      'Run comprehensive SEO audits'
    ],
    page: 'SEODashboard'
  },
  {
    id: 'social',
    title: 'Social Media Management',
    description: 'Analyze your social presence, schedule posts, and track competitors.',
    icon: Share2,
    color: 'bg-pink-500',
    tips: [
      'Connect your social media accounts',
      'Schedule posts with AI optimization',
      'Run A/B tests on your content',
      'Analyze competitor strategies'
    ],
    page: 'SocialMedia'
  },
  {
    id: 'marketing',
    title: 'Marketing Automation',
    description: 'Create campaigns, send emails, and automate your marketing workflows.',
    icon: Mail,
    color: 'bg-indigo-500',
    tips: [
      'Design email templates with the visual editor',
      'Create and send email campaigns',
      'Set up automation rules for follow-ups',
      'Track campaign performance'
    ],
    page: 'EmailMarketing'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start using CRM + SEO Suite. Explore the features and grow your business!',
    icon: CheckCircle,
    color: 'bg-emerald-500',
    tips: [
      'Visit the Help Center anytime for guides',
      'Use tooltips (?) for quick help',
      'Check the Dashboard for an overview',
      'Reach out if you need assistance'
    ]
  }
];

export default function OnboardingModal({ open, onClose, onComplete, completedSteps = [] }) {
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
            <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
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