import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SessionReplayTracker from '@/components/analytics/SessionReplayTracker';

export default function PublicLandingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const {
    data: page,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['landing-page', slug],
    queryFn: async () => {
      const pages = await base44.entities.LandingPage.filter({ slug });
      return pages?.[0] || null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !page || page.status !== 'published') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-600">This landing page is no longer available.</p>
          <Button asChild className="gap-2">
            <a href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SessionReplayTracker />
      {/* Render sections */}
      {page.sections && page.sections.length > 0 ? (
        <div className="divide-y">
          {page.sections
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => (
              <Section key={section.id} section={section} />
            ))}
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
            <p className="text-gray-600">No content yet. Check back soon!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ section }) {
  const { type, content } = section;

  switch (type) {
    case 'hero':
      return (
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {content.heading && <h1 className="text-5xl font-bold">{content.heading}</h1>}
            {content.subheading && <p className="text-xl text-violet-100">{content.subheading}</p>}
            {content.cta_text && (
              <Button className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-6">
                {content.cta_text}
              </Button>
            )}
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            {content.title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                {content.title}
              </h2>
            )}
            {content.features && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {content.features.map((feature, idx) => (
                  <div key={idx} className="space-y-3">
                    {feature.icon && <div className="text-4xl">{feature.icon}</div>}
                    {feature.title && (
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    )}
                    {feature.description && <p className="text-gray-600">{feature.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'content':
      return (
        <div className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            {content.title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{content.title}</h2>
            )}
            {content.text && (
              <div className="prose prose-lg max-w-none text-gray-700">{content.text}</div>
            )}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="bg-violet-50 py-16 px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {content.heading && (
              <h2 className="text-3xl font-bold text-gray-900">{content.heading}</h2>
            )}
            {content.text && <p className="text-lg text-gray-600">{content.text}</p>}
            {content.button_text && (
              <Button className="bg-violet-600 hover:bg-violet-700 text-lg px-8 py-6">
                {content.button_text}
              </Button>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}
