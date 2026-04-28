import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slideTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
  },
};

export default function PresentationMode({
  open,
  onClose,
  slides,
  branding,
  deckTitle,
  companyName,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const transition = 'fade';
  const [linkModal, setLinkModal] = useState(null);

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
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    }
    if (e.key === 'ArrowLeft') {
      prevSlide();
    }
    if (e.key === 'Escape') {
      if (linkModal) {
        setLinkModal(null);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, currentSlide, linkModal]);

  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setLinkModal(null);
    }
  }, [open]);

  // Load custom fonts
  useEffect(() => {
    if (branding?.custom_fonts) {
      branding.custom_fonts.forEach((font) => {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: '${font.name}';
            src: url('${font.url}') format('${font.format || 'woff2'}');
          }
        `;
        document.head.appendChild(style);
      });
    }
  }, [branding]);

  const slide = slides[currentSlide];
  if (!slide) {
    return null;
  }

  const renderContent = (content) => {
    if (!content) {
      return null;
    }

    return (
      <>
        {/* Points with animations */}
        {content.points && Array.isArray(content.points) && (
          <ul className="space-y-4 text-2xl">
            {content.points.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-start gap-4"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2 + 0.1 }}
                  className="w-3 h-3 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: branding?.primary_color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{point}</span>
              </motion.li>
            ))}
          </ul>
        )}

        {/* Text content */}
        {(content.description || content.text) && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            {content.description || content.text}
          </motion.p>
        )}

        {/* Interactive Links */}
        {content.links && Array.isArray(content.links) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3 mt-6"
          >
            {content.links.map((link, i) => (
              <Button
                key={i}
                onClick={() => setLinkModal(link)}
                className="gap-2"
                style={{ backgroundColor: branding?.primary_color }}
              >
                {link.label || link.url}
                <ExternalLink className="w-4 h-4" />
              </Button>
            ))}
          </motion.div>
        )}

        {/* Embedded Media */}
        {content.media && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            {content.media.type === 'youtube' && (
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={content.media.url.replace('watch?v=', 'embed/') + '?autoplay=1'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {content.media.type === 'video' && (
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                <video controls autoPlay className="w-full h-full">
                  <source src={content.media.url} />
                </video>
              </div>
            )}
            {content.media.type === 'upload' && (
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={content.media.url}
                alt=""
                className="w-full rounded-xl shadow-2xl"
              />
            )}
          </motion.div>
        )}

        {/* Stats/Metrics with animation */}
        {content.stats && Array.isArray(content.stats) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-6 mt-8"
          >
            {content.stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-center p-6 rounded-xl"
                style={{ backgroundColor: branding?.primary_color + '20' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                  className="text-4xl font-bold mb-2"
                  style={{ color: branding?.primary_color }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 bg-black">
          <div
            className="relative w-full h-full flex flex-col"
            style={{
              backgroundColor: branding?.background_color || '#ffffff',
              fontFamily: branding?.font_body || 'Inter',
            }}
          >
            {/* Header */}
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="w-full h-16 flex items-center justify-between px-6 shadow-lg z-20"
              style={{ backgroundColor: branding?.primary_color || '#7c3aed' }}
            >
              <div className="flex items-center gap-4">
                {branding?.logo_url && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={branding.logo_url}
                    alt="Logo"
                    className="h-10 object-contain"
                  />
                )}
                <span
                  className="text-white font-bold text-lg"
                  style={{ fontFamily: branding?.font_heading || 'Inter' }}
                >
                  {companyName || deckTitle}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white text-sm font-medium">
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
            </motion.div>

            {/* Slide Content with AnimatePresence */}
            <div className="flex-1 flex items-center justify-center p-12 overflow-auto relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentSlide}
                  {...slideTransitions[transition]}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-6xl"
                >
                  {/* Title with animation */}
                  <motion.h1
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl font-bold mb-10"
                    style={{
                      color: branding?.primary_color || '#7c3aed',
                      fontFamily: branding?.font_heading || 'Inter',
                    }}
                  >
                    {slide.title}
                  </motion.h1>

                  {/* Special handling for cover slide */}
                  {slide.type === 'cover' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center py-12"
                    >
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-7xl font-bold mb-8"
                        style={{ color: branding?.primary_color }}
                      >
                        {slide.content?.company || companyName}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-4xl"
                        style={{ color: branding?.secondary_color }}
                      >
                        {slide.content?.tagline}
                      </motion.p>
                    </motion.div>
                  )}

                  {/* Market data with animation */}
                  {slide.type === 'market' && slide.content?.tam && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="grid grid-cols-3 gap-8 mt-8"
                    >
                      {['tam', 'sam', 'som'].map((key, i) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
                          className="text-center p-8 rounded-2xl shadow-xl"
                          style={{ backgroundColor: branding?.primary_color + '20' }}
                        >
                          <div
                            className="text-sm font-bold mb-3 uppercase tracking-wider"
                            style={{ color: branding?.primary_color }}
                          >
                            {key.toUpperCase()}
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 200 }}
                            className="text-5xl font-bold"
                          >
                            {slide.content[key] || 'N/A'}
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {renderContent(slide.content)}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4"
              >
                <Button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  size="lg"
                  className="bg-white/90 hover:bg-white shadow-xl"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  size="lg"
                  className="bg-white/90 hover:bg-white shadow-xl"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="w-full h-12 flex items-center justify-center text-sm"
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
            >
              {deckTitle} • {companyName}
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Modal */}
      <Dialog open={!!linkModal} onOpenChange={() => setLinkModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {linkModal && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{linkModal.label || 'External Content'}</h3>
              <div className="aspect-video w-full">
                <iframe
                  src={linkModal.url}
                  className="w-full h-full rounded-lg border-2"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLinkModal(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => window.open(linkModal.url, '_blank')}
                  style={{ backgroundColor: branding?.primary_color }}
                >
                  Open in New Tab
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
