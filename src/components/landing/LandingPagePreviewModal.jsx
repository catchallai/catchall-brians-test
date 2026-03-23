import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPagePreviewModal({ open, onClose, page }) {
  if (!page) {
    return null;
  }

  const renderSection = (section) => {
    const { type, content } = section;

    if (type === 'hero') {
      return (
        <div
          className="relative py-24 px-6 text-center text-white"
          style={{
            backgroundColor: page.theme?.primary_color || '#7c3aed',
            backgroundImage: content.backgroundImage
              ? `url(${content.backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <h1 className="text-5xl font-bold mb-4">{content.heading}</h1>
          <p className="text-xl mb-8">{content.subheading}</p>
          {page.cta_button?.text && (
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              {page.cta_button.text}
            </Button>
          )}
        </div>
      );
    }

    if (type === 'features') {
      return (
        <div className="py-16 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {(content.items || []).map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'testimonials') {
      return (
        <div className="py-16 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {(content.items || []).map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  {item.avatar && (
                    <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full" />
                  )}
                  <p className="font-semibold">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'cta') {
      return (
        <div
          className="py-16 px-6 text-center text-white"
          style={{ backgroundColor: page.theme?.secondary_color || '#06b6d4' }}
        >
          <h2 className="text-3xl font-bold mb-6">{content.heading}</h2>
          <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
            {content.buttonText}
          </Button>
        </div>
      );
    }

    if (type === 'text') {
      return (
        <div className="py-12 px-6">
          <div className="max-w-3xl mx-auto prose">
            <p className="text-gray-700 whitespace-pre-wrap">{content.text}</p>
          </div>
        </div>
      );
    }

    if (type === 'image') {
      return (
        <div className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            {content.url && (
              <img src={content.url} alt={content.alt} className="w-full rounded-lg shadow-lg" />
            )}
            {content.caption && (
              <p className="text-center text-sm text-gray-500 mt-3">{content.caption}</p>
            )}
          </div>
        </div>
      );
    }

    if (type === 'form') {
      return (
        <div className="py-16 px-6 bg-gray-50">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h3 className="text-2xl font-bold mb-4">Sign Up</h3>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded mb-4"
            />
            <Button className="w-full" style={{ backgroundColor: page.theme?.primary_color }}>
              Subscribe
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{page.title}</DialogTitle>
            <Badge className={page.status === 'published' ? 'bg-green-500' : 'bg-gray-500'}>
              {page.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="bg-white" style={{ fontFamily: page.theme?.font_family || 'Inter' }}>
          {(page.sections || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => (
              <div key={section.id}>{renderSection(section)}</div>
            ))}

          {(!page.sections || page.sections.length === 0) && (
            <div className="py-24 text-center text-gray-500">
              <p>No sections added yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
