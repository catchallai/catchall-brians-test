import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PreviewModal({ open, onClose, slides, branding, deckTitle, companyName }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      nextSlide();
    }
    if (e.key === 'ArrowLeft') {
      prevSlide();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, currentSlide]);

  const slide = slides[currentSlide];
  if (!slide) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <div
          className="relative w-full h-full flex flex-col"
          style={{
            backgroundColor: branding?.background_color || '#ffffff',
            fontFamily: branding?.font_body || 'Inter',
          }}
        >
          {/* Header */}
          <div
            className="w-full h-16 flex items-center justify-between px-6"
            style={{ backgroundColor: branding?.primary_color || '#7c3aed' }}
          >
            <div className="flex items-center gap-4">
              {branding?.logo_url && (
                <img src={branding.logo_url} alt="Logo" className="h-10 object-contain" />
              )}
              <span
                className="text-white font-bold text-lg"
                style={{ fontFamily: branding?.font_heading || 'Inter' }}
              >
                {companyName || deckTitle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">
                {currentSlide + 1} / {slides.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex items-center justify-center p-12 overflow-auto">
            <div className="w-full max-w-5xl">
              {/* Title */}
              <h1
                className="text-5xl font-bold mb-8"
                style={{
                  color: branding?.primary_color || '#7c3aed',
                  fontFamily: branding?.font_heading || 'Inter',
                }}
              >
                {slide.title}
              </h1>

              {/* Content based on slide type */}
              {slide.type === 'cover' && (
                <div className="text-center py-12">
                  <h2
                    className="text-6xl font-bold mb-6"
                    style={{ color: branding?.primary_color }}
                  >
                    {slide.content?.company || companyName}
                  </h2>
                  <p className="text-3xl" style={{ color: branding?.secondary_color }}>
                    {slide.content?.tagline}
                  </p>
                </div>
              )}

              {slide.content?.points && Array.isArray(slide.content.points) && (
                <ul className="space-y-4 text-2xl">
                  {slide.content.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span
                        className="w-3 h-3 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: branding?.primary_color }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {slide.content?.description && (
                <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                  {slide.content.description}
                </p>
              )}

              {slide.content?.text && (
                <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                  {slide.content.text}
                </p>
              )}

              {/* Market Data */}
              {slide.type === 'market' && slide.content?.tam && (
                <div className="grid grid-cols-3 gap-8 mt-8">
                  <div
                    className="text-center p-6 rounded-xl"
                    style={{ backgroundColor: branding?.primary_color + '20' }}
                  >
                    <div
                      className="text-sm font-medium mb-2"
                      style={{ color: branding?.primary_color }}
                    >
                      TAM
                    </div>
                    <div className="text-3xl font-bold">{slide.content.tam}</div>
                  </div>
                  <div
                    className="text-center p-6 rounded-xl"
                    style={{ backgroundColor: branding?.primary_color + '20' }}
                  >
                    <div
                      className="text-sm font-medium mb-2"
                      style={{ color: branding?.primary_color }}
                    >
                      SAM
                    </div>
                    <div className="text-3xl font-bold">{slide.content.sam || 'N/A'}</div>
                  </div>
                  <div
                    className="text-center p-6 rounded-xl"
                    style={{ backgroundColor: branding?.primary_color + '20' }}
                  >
                    <div
                      className="text-sm font-medium mb-2"
                      style={{ color: branding?.primary_color }}
                    >
                      SOM
                    </div>
                    <div className="text-3xl font-bold">{slide.content.som || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Embedded Media */}
              {slide.content?.media && (
                <div className="mt-8">
                  {slide.content.media.type === 'youtube' && (
                    <div className="aspect-video">
                      <iframe
                        src={slide.content.media.url.replace('watch?v=', 'embed/')}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {slide.content.media.type === 'video' && (
                    <video controls className="w-full rounded-lg">
                      <source src={slide.content.media.url} />
                    </video>
                  )}
                  {slide.content.media.type === 'link' && (
                    <div className="aspect-video">
                      <iframe
                        src={slide.content.media.url}
                        className="w-full h-full rounded-lg border-2"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  )}
                  {slide.content.media.type === 'upload' && (
                    <img src={slide.content.media.url} alt="" className="w-full rounded-lg" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            <Button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="bg-white/90 hover:bg-white"
              size="lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="bg-white/90 hover:bg-white"
              size="lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Footer */}
          <div
            className="w-full h-12 flex items-center justify-center text-sm"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
          >
            {deckTitle} • {companyName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
